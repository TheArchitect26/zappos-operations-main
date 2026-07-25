/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState } from '../zapp-simulator/types';

export interface DependencyLink {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  label: string;
}

/**
 * High-performance interactive operational dependency mapper.
 */
export class DependencyMapper {
  private dependencies: Map<string, DependencyLink[]> = new Map();

  /**
   * Builds index mapping all active operational links across elements.
   */
  public buildMap(state: SimState): void {
    this.dependencies.clear();

    // 1. Link Jobs -> Vehicle, Driver, Route, Customer
    state.jobs.forEach(job => {
      const links: DependencyLink[] = [];

      if (job.vehicleId) {
        links.push({
          id: `dep_job_v_${job.id}`,
          sourceType: 'job',
          sourceId: job.id,
          targetType: 'vehicle',
          targetId: job.vehicleId,
          label: 'DEPENDS_ON_VEHICLE',
        });
      }

      if (job.driverId) {
        links.push({
          id: `dep_job_d_${job.id}`,
          sourceType: 'job',
          sourceId: job.id,
          targetType: 'driver',
          targetId: job.driverId,
          label: 'OPERATED_BY_DRIVER',
        });
      }

      if (job.routeId) {
        links.push({
          id: `dep_job_r_${job.id}`,
          sourceType: 'job',
          sourceId: job.id,
          targetType: 'route',
          targetId: job.routeId,
          label: 'TRANSITS_ROUTE',
        });
      }

      if (job.customerId) {
        links.push({
          id: `dep_job_c_${job.id}`,
          sourceType: 'job',
          sourceId: job.id,
          targetType: 'customer',
          targetId: job.customerId,
          label: 'REPRESENTS_CLIENT',
        });
      }

      this.addLinks(job.id, links);

      // Reciprocal registration
      if (job.vehicleId) this.addLinks(job.vehicleId, [this.reciprocal(links[0])]);
      if (job.driverId) this.addLinks(job.driverId, [this.reciprocal(links[1])]);
      if (job.routeId) this.addLinks(job.routeId, [this.reciprocal(links[2])]);
      if (job.customerId) this.addLinks(job.customerId, [this.reciprocal(links[3])]);
    });

    // 2. Link Incidents -> Job, Driver, Vehicle
    state.incidents.forEach(inc => {
      const links: DependencyLink[] = [];

      if (inc.jobId) {
        links.push({
          id: `dep_inc_j_${inc.id}`,
          sourceType: 'incident',
          sourceId: inc.id,
          targetType: 'job',
          targetId: inc.jobId,
          label: 'IMPACTS_JOB',
        });
      }

      if (inc.driverId) {
        links.push({
          id: `dep_inc_d_${inc.id}`,
          sourceType: 'incident',
          sourceId: inc.id,
          targetType: 'driver',
          targetId: inc.driverId,
          label: 'INVOLVES_DRIVER',
        });
      }

      if (inc.vehicleId) {
        links.push({
          id: `dep_inc_v_${inc.id}`,
          sourceType: 'incident',
          sourceId: inc.id,
          targetType: 'vehicle',
          targetId: inc.vehicleId,
          label: 'AFFECTS_VEHICLE',
        });
      }

      this.addLinks(inc.id, links);

      // Reciprocal registration
      if (inc.jobId) this.addLinks(inc.jobId, [this.reciprocal(links[0])]);
      if (inc.driverId) this.addLinks(inc.driverId, [this.reciprocal(links[1])]);
      if (inc.vehicleId) this.addLinks(inc.vehicleId, [this.reciprocal(links[2])]);
    });
  }

  private addLinks(key: string, links: DependencyLink[]): void {
    const existing = this.dependencies.get(key) || [];
    this.dependencies.set(key, [...existing, ...links]);
  }

  private reciprocal(link: DependencyLink): DependencyLink {
    return {
      id: `${link.id}_rev`,
      sourceType: link.targetType,
      sourceId: link.targetId,
      targetType: link.sourceType,
      targetId: link.sourceId,
      label: `REV_${link.label}`,
    };
  }

  /**
   * Dynamic lookup of associated dependency edges for a specific node ID.
   */
  public getDependenciesOf(id: string): DependencyLink[] {
    return this.dependencies.get(id) || [];
  }

  /**
   * Traverse the full operational tree up to N levels (O(n) limit lookups).
   */
  public traverseDependencies(startId: string, maxDepth: number = 2): string[] {
    const visited = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (current.depth < maxDepth) {
        const nextLinks = this.getDependenciesOf(current.id);
        nextLinks.forEach(link => {
          if (!visited.has(link.targetId)) {
            queue.push({ id: link.targetId, depth: current.depth + 1 });
          }
        });
      }
    }

    return Array.from(visited);
  }
}
