import { SIMULATION_COMPANY_ID } from "./company-fixture";
import { vehicles } from "./fleet";

export const fleetIntelligenceSimulation = vehicles.map((vehicle, index) => ({
  companyId: SIMULATION_COMPANY_ID,
  marker: "simulation" as const,
  vehicleId: vehicle.id,
  day: index % 30,
  fuelLitres: vehicle.fuelType === "electric" ? 0 : 80 + (index % 12) * 4,
  engineWearPercent: Math.min(100, 20 + index * 1.3),
  tyreRemainingPercent: Math.max(5, 92 - index * 1.4),
  maintenanceHistoryCount: index % 6,
  harshBrakingEvents: index % 9,
  harshAccelerationEvents: index % 7,
  speedingEvents: index % 5,
  weatherEffect: index % 4 === 0 ? "heavy_rain" : "clear",
  trafficCondition: index % 3 === 0 ? "congested" : "normal",
  productionEligible: false,
}));
