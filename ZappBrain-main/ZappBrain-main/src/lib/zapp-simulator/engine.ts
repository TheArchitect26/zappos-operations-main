/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState, SimKPIs, SimTelemetryBatch, SimIncident } from './types';
import { SeededRandom } from './random';
import { SimClock } from './clock';
import { generateCompany } from './company';
import { generateFleet } from './fleet';
import { generateDrivers, tickDriver } from './drivers';
import { generateCustomers } from './customers';
import { generateDepots } from './depots';
import { generateRoutes } from './routes';
import { generateJobs, tickJob } from './jobs';
import { generateTelemetryBatch } from './telemetry';
import { tickVehicle } from './vehicles';
import { tickDispatcherDecisions } from './dispatcher';
import { auditFleetCompliance } from './compliance';
import { calculateSimKPIs } from './kpis';
import { SimStatisticsEngine } from './statistics';
import { SimTimeline } from './timeline';
import { applyScenario, ScenarioType } from './scenarios';
import { SimulatorConfig, DEFAULT_CONFIG } from './config';

/**
 * Centered coordinator representing the Fleet Digital Twin simulation environment.
 */
export class FleetDigitalTwin {
  private config: SimulatorConfig;
  private rng: SeededRandom;
  private clock: SimClock;
  private stats: SimStatisticsEngine;
  private timeline: SimTimeline;
  private state: SimState;

  constructor(config: Partial<SimulatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = new SeededRandom(this.config.seed);
    this.clock = new SimClock('2026-07-14T08:00:00Z');
    this.stats = new SimStatisticsEngine();
    this.timeline = new SimTimeline();

    this.state = this.initializeState();
    this.timeline.pushFrame(this.clock.getISOString(), this.state);
  }

  /**
   * Performs full-stack setup of company, depots, fleets, customers, and active jobs.
   */
  private initializeState(): SimState {
    const company = generateCompany(this.rng, this.config.fleetSize);
    const vehicles = generateFleet(this.rng, this.config.fleetSize);
    const drivers = generateDrivers(this.rng, company.driverCount);
    const customers = generateCustomers(this.rng, company.customerCount);
    const depots = generateDepots(this.rng);
    const routes = generateRoutes(this.rng, depots);

    const jobs = generateJobs(
      this.rng,
      company.id,
      vehicles,
      drivers,
      routes,
      customers
    );

    return {
      company,
      fleets: { vehicles, drivers },
      customers,
      depots,
      routes,
      jobs,
      incidents: [],
      workshops: [],
      environmental: {
        weather: this.config.initialWeather,
        traffic: this.config.initialTraffic,
        cellular: this.config.initialCellular
      }
    };
  }

  /**
   * Performs a single forward operating tick of the transport network.
   * Advances distance, fuel burn, driver fatiguing, job milestones, dispatcher logs, and compliance violations.
   */
  public tick(durationSeconds: number = 60): SimState {
    const hours = durationSeconds / 3600;
    this.clock.tick(durationSeconds);
    const currentISO = this.clock.getISOString();

    // 1. Tick each driver and associated active job vehicle
    this.state.jobs.forEach(job => {
      if (job.status !== 'active') return;

      const vehicle = this.state.fleets.vehicles.find(v => v.id === job.vehicleId);
      const driver = this.state.fleets.drivers.find(d => d.id === job.driverId);
      const route = this.state.routes.find(r => r.id === job.routeId);

      if (vehicle) {
        const speed = route ? route.averageSpeedKmh : 80;
        tickVehicle(vehicle, this.rng, speed, hours, true);
      }

      if (driver) {
        tickDriver(driver, true, hours);
      }

      // Progress job route
      tickJob(job, route, hours);
      job.telemetrySent++;
    });

    // Handle offline resting drivers
    this.state.fleets.drivers.forEach(d => {
      const isWorking = this.state.jobs.some(j => j.driverId === d.id && j.status === 'active');
      if (!isWorking) {
        tickDriver(d, false, hours);
      }
    });

    // 2. Process simulated dispatchers
    tickDispatcherDecisions(this.state.incidents, this.rng);

    // 3. Keep Timeline Frames updated
    this.timeline.pushFrame(currentISO, this.state);

    // 4. Update Statistics hourly
    const currentMin = new Date(currentISO).getUTCMinutes();
    if (currentMin === 0) {
      const kpis = this.getKPIs();
      this.stats.recordHourlyKPIs(kpis);
    }

    return this.state;
  }

  /**
   * Applies a specific micro-scenario to alter telemetry profiles.
   */
  public triggerScenario(scenario: ScenarioType): void {
    applyScenario(scenario, this.state, this.rng, this.clock.getISOString());
  }

  /**
   * Returns current evaluated fleet indicators.
   */
  public getKPIs(): SimKPIs {
    return calculateSimKPIs(
      this.state.fleets.vehicles,
      this.state.fleets.drivers,
      this.state.jobs
    );
  }

  /**
   * Audits active violations.
   */
  public runComplianceAudit() {
    return auditFleetCompliance(
      this.state.fleets.drivers,
      this.state.fleets.vehicles,
      this.clock.getISOString()
    );
  }

  /**
   * Generates instant stream-ready coordinates.
   */
  public streamTelemetryBatch(jobId: string): SimTelemetryBatch | null {
    const job = this.state.jobs.find(j => j.id === jobId);
    if (!job || !job.vehicleId) return null;

    const vehicle = this.state.fleets.vehicles.find(v => v.id === job.vehicleId);
    const route = this.state.routes.find(r => r.id === job.routeId);

    if (!vehicle) return null;

    return generateTelemetryBatch(
      this.rng,
      vehicle,
      route,
      job.currentWaypointIndex,
      this.clock.getISOString()
    );
  }

  /**
   * Timed scrubbing back/forward.
   */
  public loadTimelineHistory(timestamp: string): boolean {
    const pastState = this.timeline.getFrame(timestamp);
    if (pastState) {
      this.state = pastState;
      this.clock.rewindTo(timestamp);
      return true;
    }
    return false;
  }

  public getState(): SimState {
    return this.state;
  }

  public getClock(): SimClock {
    return this.clock;
  }

  public getStats(): SimStatisticsEngine {
    return this.stats;
  }

  public getTimeline(): SimTimeline {
    return this.timeline;
  }
}
