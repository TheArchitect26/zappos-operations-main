/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimKPIs } from './types';

export interface StatisticalSummary {
  hourly: SimKPIs[];
  daily: SimKPIs[];
  weekly: SimKPIs[];
  monthly: SimKPIs[];
}

/**
 * Tracks historical statistics over virtual operating periods.
 */
export class SimStatisticsEngine {
  private history: StatisticalSummary = {
    hourly: [],
    daily: [],
    weekly: [],
    monthly: []
  };

  /**
   * Logs a new hourly statistical sample.
   */
  public recordHourlyKPIs(kpis: SimKPIs): void {
    this.history.hourly.push({ ...kpis });
    if (this.history.hourly.length > 24) {
      this.history.hourly.shift();
    }
  }

  /**
   * Logs a daily statistical sample.
   */
  public recordDailyKPIs(kpis: SimKPIs): void {
    this.history.daily.push({ ...kpis });
    if (this.history.daily.length > 30) {
      this.history.daily.shift();
    }
  }

  /**
   * Logs a weekly statistical sample.
   */
  public recordWeeklyKPIs(kpis: SimKPIs): void {
    this.history.weekly.push({ ...kpis });
    if (this.history.weekly.length > 52) {
      this.history.weekly.shift();
    }
  }

  /**
   * Logs a monthly statistical sample.
   */
  public recordMonthlyKPIs(kpis: SimKPIs): void {
    this.history.monthly.push({ ...kpis });
    if (this.history.monthly.length > 12) {
      this.history.monthly.shift();
    }
  }

  public getHistory(): StatisticalSummary {
    return this.history;
  }
}
