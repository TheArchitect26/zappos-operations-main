/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleType = 'truck' | 'trailer' | 'rigid' | 'van' | 'tanker' | 'refrigerated' | 'abnormal_load';

export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

export type DriverStatus = 'active' | 'inactive';

export type JobStatus = 'pending' | 'assigned' | 'active' | 'completed' | 'failed' | 'cancelled';

export type WeatherCondition = 'clear' | 'rain' | 'storm' | 'heat' | 'fog' | 'wind' | 'flooding';

export type TrafficCondition = 'clear' | 'moderate' | 'congested' | 'accident' | 'road_closure' | 'protest';

export type CellularSignal = 'excellent' | 'good' | 'fair' | 'poor' | 'blackout';

export interface SimCompany {
  id: string;
  name: string;
  operatingRegions: string[];
  terminals: string[];
  workshops: string[];
  dispatchCenters: string[];
  vehicleCount: number;
  driverCount: number;
  customerCount: number;
}

export interface SimVehicle {
  id: string;
  plateNumber: string;
  vin: string;
  type: VehicleType;
  make: string;
  model: string;
  ageYears: number;
  mileage: number;
  engineHours: number;
  status: VehicleStatus;
  tyreHealth: number; // 0 to 100
  batteryHealth: number; // 0 to 100
  healthScore: number; // 0 to 100
  fuelCapacity: number;
  fuelLevel: number; // Litres
  fuelConsumptionRate: number; // Litres/100km
  currentFaults: string[];
  overdueService: boolean;
}

export interface SimDriver {
  id: string;
  name: string;
  licenseCode: string;
  licenseExpiry: string; // YYYY-MM-DD
  prdpExpiry: string; // YYYY-MM-DD
  prdpStatus: 'valid' | 'expired' | 'expiring_soon';
  experienceYears: number;
  complianceScore: number; // 0 to 100
  punctualityScore: number; // 0 to 100
  safetyScore: number; // 0 to 100
  fatigueLevel: number; // 0 to 100
  drivingBehavior: 'gentle' | 'standard' | 'aggressive';
  reliabilityScore: number; // 0 to 100
  trainingCompleted: boolean;
  status: DriverStatus;
}

export interface SimCustomer {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  loadingSpeedMinutes: number;
  unloadingSpeedMinutes: number;
  averageWaitingTimeMinutes: number;
  operatingHoursStart: number; // e.g. 8 (8 AM)
  operatingHoursEnd: number; // e.g. 18 (6 PM)
  historicalReliability: number; // 0 to 100
}

export interface SimDepot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  congestionIndex: number; // 0 to 100
}

export interface SimWaypoint {
  latitude: number;
  longitude: number;
  name?: string;
  gsmSignal: CellularSignal;
}

export interface SimRoute {
  id: string;
  name: string;
  startDepotId: string;
  endDepotId: string;
  waypoints: SimWaypoint[];
  tollGatesCount: number;
  borderCrossingsCount: number;
  averageSpeedKmh: number;
  congestionProbability: number; // 0 to 1
  isRisky: boolean;
}

export interface SimJob {
  id: string;
  companyId: string;
  title: string;
  status: JobStatus;
  driverId: string | null;
  vehicleId: string | null;
  customerId: string;
  routeId: string;
  plannedStartTime: string;
  actualStartTime: string | null;
  plannedEndTime: string;
  actualEndTime: string | null;
  currentWaypointIndex: number;
  delayMinutes: number;
  telemetrySent: number;
}

export interface SimTelemetryBatch {
  timestamp: string;
  latitude: number;
  longitude: number;
  ignition: boolean;
  speed: number;
  heading: number;
  fuelLevel: number;
  rpm: number;
  odometer: number;
  engineTemp: number;
  batteryVoltage: number;
  gsmSignal: CellularSignal;
  satelliteCount: number;
}

export interface SimZappBoxState {
  deviceId: string;
  tamperSwitch: boolean;
  backupBatteryCharge: number; // 0 to 100
  panicButtonPressed: boolean;
  firmwareVersion: string;
  isTampered: boolean;
  lastDtcCodes: string[];
}

export interface SimEnvironmentalConditions {
  weather: WeatherCondition;
  traffic: TrafficCondition;
  cellular: CellularSignal;
}

export interface SimIncident {
  id: string;
  companyId: string;
  jobId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurredAt: string;
  reportedBy: string;
  status: 'pending' | 'acknowledged' | 'investigating' | 'resolved' | 'escalated' | 'rejected';
}

export interface SimWorkshopBooking {
  id: string;
  vehicleId: string;
  workshopName: string;
  reason: string;
  scheduledDate: string;
  completedDate: string | null;
  partsReplaced: string[];
  labourHours: number;
  cost: number;
}

export interface SimState {
  company: SimCompany;
  fleets: {
    vehicles: SimVehicle[];
    drivers: SimDriver[];
  };
  customers: SimCustomer[];
  depots: SimDepot[];
  routes: SimRoute[];
  jobs: SimJob[];
  incidents: SimIncident[];
  workshops: SimWorkshopBooking[];
  environmental: SimEnvironmentalConditions;
}

export interface SimKPIs {
  fleetAvailability: number; // %
  fleetUtilization: number; // %
  onTimeDelivery: number; // %
  averageDelayMinutes: number;
  driverReliability: number; // %
  maintenanceCompliance: number; // %
  telemetryCoverage: number; // %
  customerServiceLevel: number; // %
  depotEfficiency: number; // %
  routeEfficiency: number; // %
}
