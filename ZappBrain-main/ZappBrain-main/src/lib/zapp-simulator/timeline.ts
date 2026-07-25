/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState } from './types';

export interface TimelineFrame {
  timestamp: string;
  stateSnapshot: string; // JSON string for deep copying / non-mutation guarantees
}

/**
 * Manages physical state histories to allow scrubbing, replaying, and state resets.
 */
export class SimTimeline {
  private frames: TimelineFrame[] = [];
  private maxFrames: number = 200;

  /**
   * Pushes a new deep copy of the state onto the timeline.
   */
  public pushFrame(timestamp: string, state: SimState): void {
    const frame: TimelineFrame = {
      timestamp,
      stateSnapshot: JSON.stringify(state)
    };

    this.frames.push(frame);
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
  }

  /**
   * Retrieves a historical frame at a given timestamp, or the closest prior frame.
   */
  public getFrame(timestamp: string): SimState | null {
    const targetTime = new Date(timestamp).getTime();
    let bestFrame: TimelineFrame | null = null;
    let closestDiff = Infinity;

    for (const frame of this.frames) {
      const frameTime = new Date(frame.timestamp).getTime();
      const diff = Math.abs(frameTime - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        bestFrame = frame;
      }
    }

    if (bestFrame) {
      return JSON.parse(bestFrame.stateSnapshot) as SimState;
    }
    return null;
  }

  public clear(): void {
    this.frames = [];
  }

  public getHistoryCount(): number {
    return this.frames.length;
  }
}
