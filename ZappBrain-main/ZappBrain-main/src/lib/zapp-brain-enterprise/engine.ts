/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrategicIntelligenceEngine } from './strategic-intelligence';
import { ForecastingEngine } from './forecasting';
import { StrategicRiskRegister } from './risk-register';
import { OpportunityEngine } from './opportunity';
import { BusinessSimulationEngine } from './business-simulation';
import { MultiYearMemoryEngine } from './multi-year-memory';
import { ExecutiveReportGenerator } from './executive-reports';

import {
  ExecutiveKPIs,
  LongTermFleetTrend,
  DepotPerformanceRanking,
  CustomerProfitabilityAnalysis,
  VehicleLifecycleAnalysis,
  DriverDevelopmentTrend,
  RouteProfitability,
  EnterpriseProjections,
  StrategicRisk,
  StrategicOpportunity,
  BusinessSimulationScenario,
  BusinessSimulationResult,
  MultiYearMemoryRecord,
  ExecutiveReport
} from './types';

export class ZappEnterpriseStrategicEngine {
  private intelEngine = new StrategicIntelligenceEngine();
  private forecastEngine = new ForecastingEngine();
  private riskRegister = new StrategicRiskRegister();
  private opportunityEngine = new OpportunityEngine();
  private simulationEngine = new BusinessSimulationEngine();
  private memoryEngine = new MultiYearMemoryEngine();
  private reportGenerator = new ExecutiveReportGenerator();

  /**
   * Runs complete enterprise intelligence audit, producing KPIs, trends, risks, and opportunities.
   */
  public analyzeEnterprise(state: {
    depots?: any[];
    customers?: any[];
    vehicles?: any[];
    drivers?: any[];
    routes?: any[];
  } = {}): {
    kpis: ExecutiveKPIs;
    fleetTrends: LongTermFleetTrend[];
    depotRankings: DepotPerformanceRanking[];
    customerAnalysis: CustomerProfitabilityAnalysis[];
    vehicleLifecycles: VehicleLifecycleAnalysis[];
    driverTrends: DriverDevelopmentTrend[];
    routeProfitability: RouteProfitability[];
    projections: EnterpriseProjections[];
    risks: StrategicRisk[];
    opportunities: StrategicOpportunity[];
    gradualChanges: string[];
  } {
    // 1. Core Analytics
    const fleetTrends = this.intelEngine.analyzeFleetTrends(this.memoryEngine.getHistory());
    const depotRankings = this.intelEngine.rankDepots(state.depots || []);
    const customerAnalysis = this.intelEngine.analyzeCustomerProfitability(state.customers || []);
    const vehicleLifecycles = this.intelEngine.analyzeVehicleLifecycles(state.vehicles || []);
    const driverTrends = this.intelEngine.analyzeDriverDevelopment(state.drivers || []);
    const routeProfitability = this.intelEngine.analyzeRouteProfitability(state.routes || []);

    // 2. Executive KPIs Compilation
    const kpis = this.intelEngine.compileExecutiveKPIs(
      fleetTrends,
      depotRankings,
      customerAnalysis,
      vehicleLifecycles,
      driverTrends,
      routeProfitability
    );

    // 3. Multi-year trend & drift detection
    const gradualChanges = this.memoryEngine.detectGradualChanges(kpis);

    // 4. Strategic Forecasting (5-year)
    const activeVehiclesBase = state.vehicles?.length || 120;
    const fuelCostBaseZAR = routeProfitability.reduce((acc, r) => acc + r.fuelCostZAR, 0) || 4500000;
    const projections = this.forecastEngine.generateProjections(kpis, activeVehiclesBase, fuelCostBaseZAR);

    // 5. Strategic Risk Register Compilation
    const risks = this.riskRegister.compileRiskRegister(kpis, vehicleLifecycles, this.memoryEngine.getHistory());

    // 6. Strategic Opportunities Engine
    const opportunities = this.opportunityEngine.scanOpportunities(kpis, routeProfitability, vehicleLifecycles);

    return {
      kpis,
      fleetTrends,
      depotRankings,
      customerAnalysis,
      vehicleLifecycles,
      driverTrends,
      routeProfitability,
      projections,
      risks,
      opportunities,
      gradualChanges
    };
  }

  /**
   * Run a what-if operational/financial business simulation.
   */
  public simulateScenario(scenario: BusinessSimulationScenario): BusinessSimulationResult {
    return this.simulationEngine.runSimulation(scenario);
  }

  /**
   * Compiles an executive-grade corporate report.
   */
  public generateReport(
    reportType: ExecutiveReport['reportType'],
    analysis: ReturnType<ZappEnterpriseStrategicEngine['analyzeEnterprise']>
  ): ExecutiveReport {
    return this.reportGenerator.generateReport(
      reportType,
      analysis.kpis,
      analysis.risks,
      analysis.opportunities,
      analysis.gradualChanges
    );
  }

  /**
   * Retrieve multi-year memory records.
   */
  public getMultiYearHistory(): MultiYearMemoryRecord[] {
    return this.memoryEngine.getHistory();
  }

  /**
   * Saves a new multi-year record.
   */
  public saveYearRecord(record: MultiYearMemoryRecord): void {
    this.memoryEngine.saveYearRecord(record);
  }
}
