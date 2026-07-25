/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeviceProfile, DeviceType, ActivationStatus, KeyStatus } from './types';

// In-memory registry of provisioned devices
const deviceRegistry = new Map<string, DeviceProfile>();

/**
 * Creates and registers a new simulated device profile.
 * Detects duplicate device IDs and IMEI collisions.
 */
export function provisionDevice(profile: {
  device_id: string;
  company_id: string;
  device_type: DeviceType;
  firmware_version: string;
  hardware_revision: string;
  sim_iccid?: string;
  imei?: string;
}): DeviceProfile {
  const normalizedId = profile.device_id.trim();
  
  if (deviceRegistry.has(normalizedId)) {
    throw new Error(`Device provisioning failure: Device ID '${normalizedId}' already exists.`);
  }

  // Check for IMEI uniqueness
  const imei = profile.imei || `35891210${Math.floor(1000000 + Math.random() * 9000000)}`;
  for (const registered of deviceRegistry.values()) {
    if (registered.imei === imei) {
      throw new Error(`Device provisioning failure: IMEI '${imei}' is already assigned to device '${registered.device_id}'.`);
    }
  }

  const newProfile: DeviceProfile = {
    device_id: normalizedId,
    company_id: profile.company_id,
    device_type: profile.device_type,
    firmware_version: profile.firmware_version,
    hardware_revision: profile.hardware_revision,
    sim_iccid: profile.sim_iccid || `89254012012${Math.floor(100000000 + Math.random() * 900000000)}`,
    imei,
    activation_status: 'active',
    provisioned_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    secret_key_status: 'provisioned'
  };

  deviceRegistry.set(normalizedId, newProfile);
  return newProfile;
}

/**
 * Assigns a device to a specific vehicle.
 */
export function assignDeviceToVehicle(deviceId: string, vehicleId: string, driverId?: string): DeviceProfile {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device assignment failure: Device '${deviceId}' not found.`);
  }

  // Remove existing assignment of this vehicle if any other device is holding it
  for (const registered of deviceRegistry.values()) {
    if (registered.vehicle_id === vehicleId && registered.device_id !== deviceId) {
      registered.vehicle_id = undefined;
      registered.assigned_driver_id = undefined;
    }
  }

  device.vehicle_id = vehicleId;
  device.assigned_driver_id = driverId;
  device.last_seen_at = new Date().toISOString();
  return device;
}

/**
 * Unassigns a device from its currently mapped vehicle.
 */
export function unassignDevice(deviceId: string): DeviceProfile {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: '${deviceId}'`);
  }
  device.vehicle_id = undefined;
  device.assigned_driver_id = undefined;
  device.last_seen_at = new Date().toISOString();
  return device;
}

/**
 * Rotates the simulated cryptographic key of a device (Security demonstration).
 */
export function rotateDeviceSecretKey(deviceId: string): DeviceProfile {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: '${deviceId}'`);
  }
  device.secret_key_status = 'rotated';
  device.last_seen_at = new Date().toISOString();
  return device;
}

/**
 * Toggles a device's active/inactive status.
 */
export function setDeviceActivationStatus(deviceId: string, status: ActivationStatus): DeviceProfile {
  const device = deviceRegistry.get(deviceId);
  if (!device) {
    throw new Error(`Device not found: '${deviceId}'`);
  }
  device.activation_status = status;
  device.last_seen_at = new Date().toISOString();
  return device;
}

/**
 * Retrieves a device profile by ID.
 */
export function getDeviceProfile(deviceId: string): DeviceProfile | undefined {
  return deviceRegistry.get(deviceId);
}

/**
 * Gets all provisioned devices in memory.
 */
export function getAllDevices(): DeviceProfile[] {
  return Array.from(deviceRegistry.values());
}

/**
 * Clears the registry for clean slate or unit tests.
 */
export function clearDeviceRegistry() {
  deviceRegistry.clear();
}
