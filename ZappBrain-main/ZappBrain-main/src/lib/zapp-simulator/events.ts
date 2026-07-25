/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SimEventType = 'telemetry_received' | 'incident_created' | 'job_progress' | 'environment_changed';

export interface SimEvent<T = any> {
  type: SimEventType;
  timestamp: string;
  payload: T;
}

export type SimEventCallback = (event: SimEvent) => void;

/**
 * Event Broker to broadcast simulated occurrences.
 */
export class SimEventBroker {
  private listeners: Record<string, SimEventCallback[]> = {};

  public subscribe(type: SimEventType, callback: SimEventCallback): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  public publish(type: SimEventType, timestamp: string, payload: any): void {
    const listeners = this.listeners[type] || [];
    const event: SimEvent = { type, timestamp, payload };
    listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error(`Error in simulator event listener:`, err);
      }
    });
  }
}
