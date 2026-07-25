/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FleetDigitalTwin } from '../../zapp-simulator/engine';
import { SimState } from '../../zapp-simulator/types';

export interface TimelineBookmark {
  id: string;
  timestamp: string;
  label: string;
  description: string;
}

/**
 * High-fidelity playback controller coordinating with the physical Fleet Simulator.
 * Guarantees reproducibility because of the seed-based Mulberry32 design.
 */
export class EvaluationReplayController {
  private twin: FleetDigitalTwin;
  private bookmarks: TimelineBookmark[] = [];
  private currentFrameIndex: number = 0;
  private maxFrameTicks: number = 1000;

  constructor(twin: FleetDigitalTwin) {
    this.twin = twin;
  }

  /**
   * Ticks simulator forward by specified steps.
   */
  public stepForward(ticks: number = 1, stepSizeSeconds: number = 60): SimState {
    let lastState = this.twin.getState();
    for (let i = 0; i < ticks; i++) {
      lastState = this.twin.tick(stepSizeSeconds);
      this.currentFrameIndex += 1;
    }
    return lastState;
  }

  /**
   * Steps backward by restoring prior snapshot states from the simulator timeline.
   */
  public stepBackward(ticks: number = 1, stepSizeSeconds: number = 60): SimState | null {
    const clock = this.twin.getClock();
    const currentTimeMs = new Date(clock.getISOString()).getTime();
    const targetTimeStr = new Date(currentTimeMs - ticks * stepSizeSeconds * 1000).toISOString();

    const success = this.twin.loadTimelineHistory(targetTimeStr);
    if (success) {
      this.currentFrameIndex = Math.max(0, this.currentFrameIndex - ticks);
      return this.twin.getState();
    }
    return null;
  }

  /**
   * Sets custom bookmarks to enable fast jumps.
   */
  public addBookmark(label: string, description: string): TimelineBookmark {
    const timestamp = this.twin.getClock().getISOString();
    const bookmark: TimelineBookmark = {
      id: `bk_${Math.random().toString(36).substring(2, 9)}`,
      timestamp,
      label,
      description,
    };
    this.bookmarks.push(bookmark);
    return bookmark;
  }

  public jumpToBookmark(bookmarkId: string): boolean {
    const bk = this.bookmarks.find(b => b.id === bookmarkId);
    if (bk) {
      return this.twin.loadTimelineHistory(bk.timestamp);
    }
    return false;
  }

  public getBookmarks(): TimelineBookmark[] {
    return this.bookmarks;
  }

  public getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  public resetReplay(): void {
    this.currentFrameIndex = 0;
    this.bookmarks = [];
  }
}
