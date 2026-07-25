/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DeviceType,
  SensorState,
  IgnitionTripState,
  DeviceHealthScore,
  RouteMovementState,
  DTCFaultSignal,
  DeviceProfile
} from './types';
import { createInitialSensorState, simulateSensorFluctuations, convertSensorsToLightstreamPacket } from './sensors';
import { determineIgnitionTripState, auditTripAnomalies, TripAnomalyAudit } from './ignition';
import { auditPowerSystems, calculateDeviceHealthScore, PowerAnomalies } from './power';
import { simulateGSMTransmission } from './gsm';
import { createInitialRouteState, advanceRouteProgress } from './gps';
import { triggerDTCFault, clearDTCFault } from './diagnostics';
import { triggerPhysicalPanic, resetPhysicalPanic, formatPanicIncident } from './panic';
import { getDeviceProfile, provisionDevice, assignDeviceToVehicle, rotateDeviceSecretKey } from './device-profile';
import { ZappOfflineBuffer } from '../zapp-lightstream/buffer';
import { compressBatch } from '../zapp-lightstream/compression';
import { ingestLightstreamBatch } from '../zapp-lightstream/adapter';
import { ZappCompactTelemetryPacket } from '../zapp-lightstream/types';

export interface SimLog {
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'alert';
  message: string;
}

export class ZappDeviceSim {
  public device_id: string;
  public company_id: string;
  public vehicle_id?: string;
  public assigned_driver_id?: string;
  
  public sensors: SensorState;
  public tripState: IgnitionTripState = 'ignition_off';
  public idleTicks = 0;
  public sequenceNumber = 1;
  public failedUploads = 0;
  
  public routeState?: RouteMovementState;
  public isRouteActive = false;
  
  public buffer: ZappOfflineBuffer;
  public logs: SimLog[] = [];
  public lastPacket?: ZappCompactTelemetryPacket;
  
  constructor(deviceId: string, companyId: string, deviceType: DeviceType, firmwareVersion: string) {
    this.device_id = deviceId;
    this.company_id = companyId;
    this.buffer = new ZappOfflineBuffer();
    
    // Provision device profile
    let profile: DeviceProfile;
    try {
      profile = provisionDevice({
        device_id: deviceId,
        company_id: companyId,
        device_type: deviceType,
        firmware_version: firmwareVersion,
        hardware_revision: 'HW_REV_P1_C'
      });
    } catch {
      // already exists
      const p = getDeviceProfile(deviceId);
      if (p) {
        profile = p;
      } else {
        throw new Error(`Failed to provision or fetch device '${deviceId}'`);
      }
    }
    
    this.vehicle_id = profile.vehicle_id;
    this.assigned_driver_id = profile.assigned_driver_id;
    
    // Initial standard sensor states
    this.sensors = createInitialSensorState();
    
    this.log('info', `Simulated hardware device initialized. Type: ${deviceType}, FW: ${firmwareVersion}`);
  }

  public log(type: SimLog['type'], message: string) {
    this.logs.unshift({
      timestamp: new Date().toISOString(),
      type,
      message
    });
    // Cap log history
    if (this.logs.length > 100) this.logs.pop();
  }

  /**
   * Assigns this device to a vehicle.
   */
  public assignToVehicle(vehicleId: string, driverId?: string) {
    assignDeviceToVehicle(this.device_id, vehicleId, driverId);
    this.vehicle_id = vehicleId;
    this.assigned_driver_id = driverId;
    this.log('info', `Assigned to vehicle '${vehicleId}' (Driver: ${driverId || 'None'})`);
  }

  /**
   * Unassigns this device.
   */
  public unassign() {
    this.vehicle_id = undefined;
    this.assigned_driver_id = undefined;
    this.log('info', `Unassigned from vehicle.`);
  }

  /**
   * Starts Nairobi ICD to Mombasa Port route simulator.
   */
  public startRouteSimulation() {
    this.routeState = createInitialRouteState();
    this.isRouteActive = true;
    this.sensors.ignition_state = 'on';
    this.log('info', 'Nairobi to Mombasa cargo route movement simulator STARTED.');
  }

  /**
   * Stops route simulator.
   */
  public stopRouteSimulation() {
    this.isRouteActive = false;
    this.sensors.ignition_state = 'off';
    this.sensors.speed = 0;
    this.log('info', 'Route movement simulator STOPPED.');
  }

  /**
   * Performs one clock tick of the hardware device, updating GPS coordinates,
   * fluctuating signal RSSI, verifying battery/power voltage, and attempting batch spooling.
   */
  public async tick() {
    if (!this.vehicle_id) {
      // Unassigned devices operate in stationary diagnostics loop
      this.sensors.speed = 0;
      this.sensors = simulateSensorFluctuations(this.sensors);
      return;
    }

    let waypointMsg: string | undefined = undefined;

    // 1. Advance route coordinates if active
    if (this.isRouteActive && this.routeState) {
      const prevIdx = this.routeState.current_waypoint_index;
      const step = advanceRouteProgress(this.routeState, this.sensors);
      this.routeState = step.nextRoute;
      this.sensors = step.nextSensor;
      waypointMsg = step.waypointReachedMessage;

      if (waypointMsg) {
        this.log('info', waypointMsg);
      }

      // Check if finished
      if (this.routeState.mode === 'completed') {
        this.isRouteActive = false;
        this.log('success', 'Route simulator completed all cargo waypoints successfully.');
      }
    } else {
      // Normal minor noise drift
      this.sensors = simulateSensorFluctuations(this.sensors);
    }

    // 2. Compute ignition transitions
    const prevTrip = this.tripState;
    const tripStep = determineIgnitionTripState(this.sensors, this.tripState, this.idleTicks);
    this.tripState = tripStep.newState;
    this.idleTicks = tripStep.updatedIdleTicks;

    if (this.tripState !== prevTrip) {
      this.log('info', `Trip state changed: ${prevTrip.toUpperCase()} ➔ ${this.tripState.toUpperCase()}`);
    }

    // 3. Audit power systems & trigger warnings
    const powerAudit = auditPowerSystems(this.sensors);
    if (powerAudit.main_power_disconnected && !this.sensors.diagnostic_fault_codes.includes('SPN_168_FMI_1')) {
      this.sensors.diagnostic_fault_codes = triggerDTCFault(
        this.sensors.diagnostic_fault_codes.map(c => ({ code: c, severity: 'medium', first_seen_at: '', last_seen_at: '', occurrence_count: 1, is_active: true })),
        'SPN_168_FMI_1'
      ).filter(f => f.is_active).map(f => f.code);
      this.log('warn', 'Main vehicle power disconnected! Internal backup battery activated.');
    } else if (!powerAudit.main_power_disconnected && this.sensors.diagnostic_fault_codes.includes('SPN_168_FMI_1')) {
      this.sensors.diagnostic_fault_codes = clearDTCFault(
        this.sensors.diagnostic_fault_codes.map(c => ({ code: c, severity: 'medium', first_seen_at: '', last_seen_at: '', occurrence_count: 1, is_active: true })),
        'SPN_168_FMI_1'
      ).filter(f => f.is_active).map(f => f.code);
      this.log('success', 'External vehicle power restored. Recharging internal backup battery.');
    }

    if (this.sensors.tamper_detected && !this.sensors.diagnostic_fault_codes.includes('SPN_TAMPER')) {
      this.sensors.diagnostic_fault_codes = triggerDTCFault(
        this.sensors.diagnostic_fault_codes.map(c => ({ code: c, severity: 'critical', first_seen_at: '', last_seen_at: '', occurrence_count: 1, is_active: true })),
        'SPN_TAMPER'
      ).filter(f => f.is_active).map(f => f.code);
      this.log('alert', 'ALARM: Enclosure tamper interlock loop broken! Tamper detected.');
    }

    // 4. Calculate dynamic health score
    const health = calculateDeviceHealthScore(this.sensors, this.failedUploads, 'v1.4.2-stable');

    // 5. Build telemetry packet
    const packet = convertSensorsToLightstreamPacket(
      this.device_id,
      this.vehicle_id,
      this.sensors,
      this.sequenceNumber++
    );
    this.lastPacket = packet;

    // 6. Push to offline queue (performs deduplication internally)
    const pushed = this.buffer.push(packet);
    if (!pushed) {
      this.log('info', 'Telemetry packet deduplicated (position stationary, status unchanged).');
    }

    // 7. Spool Transmission over GSM
    const isOnline = this.sensors.gsm_rssi > -106;
    if (isOnline) {
      // Simulate network dropping/latency
      const tx = simulateGSMTransmission(this.sensors);
      
      // Critical SOS Panic Button bypasses drops if any weak signal exists
      const isCriticalSOS = this.sensors.panic_pressed;
      
      if (tx.success || (isCriticalSOS && this.sensors.gsm_rssi > -110)) {
        const queuedPackets = this.buffer.getQueue();
        if (queuedPackets.length > 0) {
          // Compress batch to binary payload
          const binaryPayload = compressBatch(queuedPackets);
          
          try {
            // Ingest compressed batch server-side
            const result = await ingestLightstreamBatch(this.company_id, binaryPayload);
            
            if (result.rejected_count > 0 || result.audit_issues.length > 0) {
              this.log('warn', `Spool sync completed with warnings. Rejected: ${result.rejected_count}. Issues: ${result.audit_issues.join(', ')}`);
            }
            
            // Clear successfully sent
            this.buffer.acknowledgeSent(queuedPackets.length);
            this.failedUploads = 0;
            this.log('success', `Spooled ${queuedPackets.length} telemetry packets successfully (Lightstream batch compressed: ${binaryPayload.length} bytes).`);
          } catch (e: any) {
            this.buffer.recordFailure();
            this.failedUploads++;
            this.log('error', `Server rejected spool batch: ${e.message || e}`);
          }
        }
      } else {
        this.buffer.recordFailure();
        this.failedUploads++;
        this.log('warn', `GSM transmission failed: ${tx.drop_reason}`);
      }
    } else {
      this.failedUploads++;
      this.log('warn', 'GSM Network Offline. Spooling telemetry packets to local flash memory queue.');
    }
  }

  /**
   * Helper to trigger a panic button press.
   */
  public pressPanicButton() {
    this.sensors = triggerPhysicalPanic(this.sensors);
    this.log('alert', 'CRITICAL SOS: Physical panic button pressed by vehicle operator.');
    
    // We instantly trigger a tick to force immediate bypass transmission
    this.tick();
  }

  /**
   * Helper to reset a panic button press.
   */
  public releasePanicButton() {
    this.sensors = resetPhysicalPanic(this.sensors);
    this.log('info', 'Panic state cleared.');
  }

  /**
   * Inject fault code.
   */
  public injectFault(code: string) {
    const list = this.sensors.diagnostic_fault_codes.map(c => ({ code: c, severity: 'medium' as const, first_seen_at: '', last_seen_at: '', occurrence_count: 1, is_active: true }));
    const updated = triggerDTCFault(list, code);
    this.sensors.diagnostic_fault_codes = updated.filter(f => f.is_active).map(f => f.code);
    this.log('warn', `Diagnostic fault code INJECTED: ${code}`);
  }

  /**
   * Clear fault code.
   */
  public clearFault(code: string) {
    const list = this.sensors.diagnostic_fault_codes.map(c => ({ code: c, severity: 'medium' as const, first_seen_at: '', last_seen_at: '', occurrence_count: 1, is_active: true }));
    const updated = clearDTCFault(list, code);
    this.sensors.diagnostic_fault_codes = updated.filter(f => f.is_active).map(f => f.code);
    this.log('info', `Diagnostic fault code CLEARED: ${code}`);
  }
}

// Master orchestrator singleton to run the whole yard of simulated devices
class ZappDeviceSimulatorManager {
  private devices = new Map<string, ZappDeviceSim>();
  private activeInterval?: NodeJS.Timeout;

  /**
   * Initializes some default simulated devices for the company if they don't exist.
   */
  public bootstrap(companyId: string): ZappDeviceSim[] {
    const defaultIds = ['DEV_BOX_01', 'DEV_P1_01', 'DEV_MOBI_03'];
    const vehicles = ['VH_M1', 'VH_M2', 'VH_M3'];
    const drivers = ['DR_C1', 'DR_C2', 'DR_C3'];
    const types: DeviceType[] = ['zapp_box', 'zapp_p1', 'mobile_app'];
    const firmware = ['v1.4.2-stable', 'v1.5.0-rc2', 'v1.4.2-stable'];

    defaultIds.forEach((id, i) => {
      if (!this.devices.has(id)) {
        const sim = new ZappDeviceSim(id, companyId, types[i], firmware[i]);
        sim.assignToVehicle(vehicles[i], drivers[i]);
        this.devices.set(id, sim);
      }
    });

    return this.getDevicesForCompany(companyId);
  }

  public getDevicesForCompany(companyId: string): ZappDeviceSim[] {
    return Array.from(this.devices.values()).filter(d => d.company_id === companyId);
  }

  public getDevice(deviceId: string): ZappDeviceSim | undefined {
    return this.devices.get(deviceId);
  }

  public createDevice(deviceId: string, companyId: string, type: DeviceType, firmware: string): ZappDeviceSim {
    const sim = new ZappDeviceSim(deviceId, companyId, type, firmware);
    this.devices.set(deviceId, sim);
    return sim;
  }

  public deleteDevice(deviceId: string) {
    this.devices.delete(deviceId);
  }

  /**
   * Triggers a clock tick on all active devices.
   */
  public async tickAll(companyId: string) {
    const list = this.getDevicesForCompany(companyId);
    for (const d of list) {
      await d.tick();
    }
  }

  public clearAll() {
    this.devices.clear();
  }
}

export const simulatorManager = new ZappDeviceSimulatorManager();
