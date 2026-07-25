/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MultiYearMemoryRecord, ExecutiveKPIs } from './types';

export class MultiYearMemoryEngine {
  private memoryRecords: MultiYearMemoryRecord[] = [];

  constructor() {
    this.initializeDefaultMemory();
  }

  /**
   * Seed some default historical baseline data (2024, 2025, and current 2026).
   */
  private initializeDefaultMemory(): void {
    this.memoryRecords = [
      {
        year: 2024,
        kpis: {
          fleetHealthIndex: 90,
          customerSatisfactionIndex: 94,
          driverPerformanceIndex: 92,
          complianceScore: 96,
          maintenanceForecastZAR: 2400000,
          operationalEfficiency: 92,
          costPerKilometer: 14.20,
          fuelEfficiencyL100km: 29.8,
          assetUtilizationRate: 85,
          revenuePerVehicleZAR: 620000
        },
        strategicRisksCount: 2,
        depotPerformanceSummary: {
          depot_gauteng: 94,
          depot_kzn: 88,
          depot_wc: 90,
          depot_lp: 84
        }
      },
      {
        year: 2025,
        kpis: {
          fleetHealthIndex: 86,
          customerSatisfactionIndex: 89,
          driverPerformanceIndex: 87,
          complianceScore: 91,
          maintenanceForecastZAR: 3200000,
          operationalEfficiency: 88,
          costPerKilometer: 15.80,
          fuelEfficiencyL100km: 31.2,
          assetUtilizationRate: 88,
          revenuePerVehicleZAR: 680000
        },
        strategicRisksCount: 4,
        depotPerformanceSummary: {
          depot_gauteng: 92,
          depot_kzn: 85,
          depot_wc: 88,
          depot_lp: 80
        }
      }
    ];
  }

  /**
   * Returns all stored multi-year historical memory records.
   */
  public getHistory(): MultiYearMemoryRecord[] {
    return this.memoryRecords;
  }

  /**
   * Saves a new multi-year memory record.
   */
  public saveYearRecord(record: MultiYearMemoryRecord): void {
    const existingIndex = this.memoryRecords.findIndex(r => r.year === record.year);
    if (existingIndex >= 0) {
      this.memoryRecords[existingIndex] = record;
    } else {
      this.memoryRecords.push(record);
    }
  }

  /**
   * Compares current performance KPIs against the historical 2024 baseline.
   * Detects gradual, long-term degradation or improvements.
   */
  public detectGradualChanges(currentKpis: ExecutiveKPIs): string[] {
    const baseline = this.memoryRecords.find(r => r.year === 2024);
    if (!baseline) {
      return ['No historical baseline (2024) available for comparison.'];
    }

    const driftDetails: string[] = [];

    // 1. Fleet Health Index drift
    const healthDiff = currentKpis.fleetHealthIndex - baseline.kpis.fleetHealthIndex;
    if (healthDiff <= -5) {
      driftDetails.push(
        `Gradual Fleet Health degradation: Fleet health has drifted downward by ${Math.abs(healthDiff)}% points from the 2024 baseline of ${baseline.kpis.fleetHealthIndex}%. This signals a critical lack of fresh asset capital injections.`
      );
    }

    // 2. Customer Satisfaction drift
    const satDiff = currentKpis.customerSatisfactionIndex - baseline.kpis.customerSatisfactionIndex;
    if (satDiff <= -5) {
      driftDetails.push(
        `Steep Customer Satisfaction decline: Satisfaction score has slid by ${Math.abs(satDiff)}% points since 2024, indicating systemic routing or border queue delays.`
      );
    }

    // 3. Maintenance cost escalation drift
    const costRatio = currentKpis.maintenanceForecastZAR / baseline.kpis.maintenanceForecastZAR;
    if (costRatio >= 1.25) {
      driftDetails.push(
        `Severe Maintenance Spend inflation: Annual maintenance forecast is ${Math.round((costRatio - 1) * 100)}% higher than the 2024 baseline of ZAR ${baseline.kpis.maintenanceForecastZAR.toLocaleString()}. This reflects escalating wear on older diesel rigs.`
      );
    }

    // 4. Fuel Efficiency drift
    const fuelDiff = currentKpis.fuelEfficiencyL100km - baseline.kpis.fuelEfficiencyL100km;
    if (fuelDiff >= 1.5) {
      driftDetails.push(
        `Declining Fuel Efficiency: Average fuel consumption has climbed by ${fuelDiff.toFixed(1)} L/100km compared to 2024 (${baseline.kpis.fuelEfficiencyL100km} L/100km). This indicates either poor driver eco-habits or aging fuel injection systems.`
      );
    }

    // 5. Driver Compliance Index drift
    const compDiff = currentKpis.complianceScore - baseline.kpis.complianceScore;
    if (compDiff <= -4) {
      driftDetails.push(
        `Compliance Score erosion: Driver compliance has slid down from ${baseline.kpis.complianceScore}% to ${currentKpis.complianceScore}%, signaling the need for stricter safety audits and dispatcher fatigue controls.`
      );
    }

    if (driftDetails.length === 0) {
      driftDetails.push('Operating parameters are stable within standard deviations compared to the 2024 baseline.');
    }

    return driftDetails;
  }
}
