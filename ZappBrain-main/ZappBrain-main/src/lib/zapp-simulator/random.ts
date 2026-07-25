/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Seedable pseudo-random number generator using Mulberry32.
 * This guarantees 100% deterministic simulation results under any seed.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed;
  }

  /**
   * Generates a floating-point number between 0 (inclusive) and 1 (exclusive).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a floating-point number in [min, max).
   */
  public nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generates an integer in [min, max].
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  /**
   * Randomly selects an element from an array.
   */
  public nextElement<T>(arr: T[]): T {
    const idx = this.nextInt(0, arr.length - 1);
    return arr[idx];
  }

  /**
   * Returns true with a given probability (between 0 and 1).
   */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }
}
