/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * High-fidelity virtual clock for the transport simulation.
 */
export class SimClock {
  private currentTimestamp: Date;
  private timeMultiplier: number = 1; // 1 second real-time = timeMultiplier seconds simulation-time
  private isPausedState: boolean = false;

  constructor(initialTimeStr: string = '2026-07-14T08:00:00Z') {
    this.currentTimestamp = new Date(initialTimeStr);
  }

  /**
   * Advances the clock by a specified number of seconds.
   */
  public tick(seconds: number = 1): void {
    if (this.isPausedState) return;
    const deltaMs = seconds * 1000 * this.timeMultiplier;
    this.currentTimestamp = new Date(this.currentTimestamp.getTime() + deltaMs);
  }

  /**
   * Returns current time as an ISO string.
   */
  public getISOString(): string {
    return this.currentTimestamp.toISOString();
  }

  /**
   * Fast-forwards the clock directly to a target time.
   */
  public fastForwardTo(targetTime: string): void {
    const target = new Date(targetTime);
    if (target > this.currentTimestamp) {
      this.currentTimestamp = target;
    }
  }

  /**
   * Rewinds the clock to a historical point.
   */
  public rewindTo(targetTime: string): void {
    const target = new Date(targetTime);
    this.currentTimestamp = target;
  }

  /**
   * Sets simulation speed multiplier (e.g., 60 = 1 real second represents 1 virtual minute).
   */
  public setMultiplier(multiplier: number): void {
    this.timeMultiplier = Math.max(1, multiplier);
  }

  public getMultiplier(): number {
    return this.timeMultiplier;
  }

  public pause(): void {
    this.isPausedState = true;
  }

  public resume(): void {
    this.isPausedState = false;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }
}
