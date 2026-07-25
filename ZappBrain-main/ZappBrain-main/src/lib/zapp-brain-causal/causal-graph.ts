/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CausalNode, CausalEdge, CausalGraph } from './types';
import { SimState } from '../zapp-simulator/types';

/**
 * High-performance, indexed Causal Graph Engine.
 */
export class CausalGraphEngine {
  private graph: CausalGraph = { nodes: {}, edges: [] };
  private cache: Map<string, CausalNode[]> = new Map();

  /**
   * Builds a deterministic graph of operational causal paths based on active SimState.
   */
  public buildCausalGraph(state: SimState): CausalGraph {
    this.graph = { nodes: {}, edges: [] };
    this.cache.clear();

    const companyId = state.company.id;

    // 1. Add Depots
    state.depots.forEach(depot => {
      this.addNode({
        id: depot.id,
        type: 'depot',
        label: depot.name,
        properties: { capacity: depot.capacity, congestion: depot.congestionIndex },
        contributingFactors: [],
      });
    });

    // 2. Add Customers
    state.customers.forEach(customer => {
      this.addNode({
        id: customer.id,
        type: 'customer',
        label: customer.name,
        properties: { speed: customer.loadingSpeedMinutes, waiting: customer.averageWaitingTimeMinutes },
        contributingFactors: [],
      });
    });

    // 3. Add Routes
    state.routes.forEach(route => {
      const startDepot = state.depots.find(d => d.id === route.startDepotId);
      this.addNode({
        id: route.id,
        type: 'route',
        label: route.name,
        properties: { speed: route.averageSpeedKmh, tollGates: route.tollGatesCount, isRisky: route.isRisky },
        contributingFactors: route.startDepotId ? [route.startDepotId] : [],
      });

      if (route.startDepotId) {
        this.addEdge({
          id: `e_${route.startDepotId}_${route.id}`,
          source: route.startDepotId,
          target: route.id,
          relationship: 'ORIGINATES_FROM',
          weight: 1.0,
        });
      }
    });

    // 4. Add Drivers
    state.fleets.drivers.forEach(driver => {
      this.addNode({
        id: driver.id,
        type: 'driver',
        label: driver.name,
        properties: { compliance: driver.complianceScore, safety: driver.safetyScore, fatigue: driver.fatigueLevel },
        contributingFactors: [],
      });
    });

    // 5. Add Vehicles
    state.fleets.vehicles.forEach(vehicle => {
      this.addNode({
        id: vehicle.id,
        type: 'vehicle',
        label: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
        properties: { health: vehicle.healthScore, tyre: vehicle.tyreHealth, fuel: vehicle.fuelLevel },
        contributingFactors: [],
      });
    });

    // 6. Connect Jobs to represent primary flow: Vehicle + Driver -> Route -> Customer -> Outcome
    state.jobs.forEach((job, idx) => {
      const jobId = job.id;
      
      // Node representing the delivery event
      this.addNode({
        id: jobId,
        type: 'maintenance', // mapping job as operational flow
        label: job.title,
        properties: { status: job.status, delay: job.delayMinutes },
        contributingFactors: [job.vehicleId, job.driverId, job.routeId, job.customerId].filter(Boolean) as string[],
      });

      // Add relationships
      if (job.vehicleId) {
        this.addEdge({
          id: `e_vh_job_${jobId}`,
          source: job.vehicleId,
          target: jobId,
          relationship: 'ASSIGNED_VEHICLE',
          weight: 0.9,
        });
      }
      if (job.driverId) {
        this.addEdge({
          id: `e_dr_job_${jobId}`,
          source: job.driverId,
          target: jobId,
          relationship: 'OPERATED_BY',
          weight: 0.9,
        });
      }
      if (job.routeId) {
        this.addEdge({
          id: `e_rt_job_${jobId}`,
          source: job.routeId,
          target: jobId,
          relationship: 'COVERS_ROUTE',
          weight: 0.85,
        });
      }
      if (job.customerId) {
        this.addEdge({
          id: `e_cust_job_${jobId}`,
          source: jobId,
          target: job.customerId,
          relationship: 'DELIVERS_TO',
          weight: 1.0,
        });
      }
    });

    // 7. Connect Incidents mapping to Vehicle / Driver / Job
    state.incidents.forEach(inc => {
      const factors: string[] = [];
      if (inc.vehicleId) factors.push(inc.vehicleId);
      if (inc.driverId) factors.push(inc.driverId);
      if (inc.jobId) factors.push(inc.jobId);

      this.addNode({
        id: inc.id,
        type: 'incident',
        label: `${inc.severity.toUpperCase()}: ${inc.description.substring(0, 30)}...`,
        properties: { severity: inc.severity, status: inc.status },
        contributingFactors: factors,
      });

      factors.forEach(f => {
        this.addEdge({
          id: `e_inc_${f}_${inc.id}`,
          source: f,
          target: inc.id,
          relationship: 'TRIGGERS_INCIDENT',
          weight: inc.severity === 'critical' ? 0.95 : inc.severity === 'high' ? 0.75 : 0.4,
        });
      });
    });

    return this.graph;
  }

  /**
   * Adds node to causal graph.
   */
  public addNode(node: CausalNode): void {
    this.graph.nodes[node.id] = node;
  }

  /**
   * Adds directed relationship edge to causal graph.
   */
  public addEdge(edge: CausalEdge): void {
    this.graph.edges.push(edge);
  }

  /**
   * Resolves 1-degree neighbours traversal for dependency mapping.
   */
  public getNeighbors(nodeId: string): CausalNode[] {
    if (this.cache.has(nodeId)) {
      return this.cache.get(nodeId)!;
    }

    const neighborsSet = new Set<string>();
    
    // Traversing direct edges
    this.graph.edges.forEach(edge => {
      if (edge.source === nodeId) {
        neighborsSet.add(edge.target);
      } else if (edge.target === nodeId) {
        neighborsSet.add(edge.source);
      }
    });

    // Trait lookup
    const targetNode = this.graph.nodes[nodeId];
    if (targetNode) {
      targetNode.contributingFactors.forEach(factor => neighborsSet.add(factor));
    }

    const neighbors: CausalNode[] = [];
    neighborsSet.forEach(id => {
      const node = this.graph.nodes[id];
      if (node) neighbors.push(node);
    });

    this.cache.set(nodeId, neighbors);
    return neighbors;
  }

  public getGraph(): CausalGraph {
    return this.graph;
  }
}
