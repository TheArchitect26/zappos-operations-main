import { orderSyncItems, type DriverSyncPriority, validateRoutePack } from "./phase35";

export type JourneyStep =
  | "route_pack_created"
  | "route_pack_ready"
  | "job_accepted"
  | "inspection_completed"
  | "trip_started"
  | "arrival_queued"
  | "delivery_queued"
  | "pod_queued"
  | "reconnected"
  | "pod_accepted"
  | "job_completed";

export interface PersistedQueueItem {
  id: string;
  priority: DriverSyncPriority;
  createdAt: string;
  dependencyId?: string | null;
  state: "queued" | "succeeded" | "failed" | "conflict";
}

export interface DriverJourneyGateway {
  createRoutePack(): Promise<void>;
  markRoutePackReady(): Promise<void>;
  transition(action: "accept" | "start" | "arrive"): Promise<void>;
  recordInspection(): Promise<void>;
  queue(item: PersistedQueueItem): Promise<void>;
  reconnect(): Promise<void>;
  processQueue(
    items: readonly PersistedQueueItem[],
  ): Promise<{ acknowledged: string[]; conflicts: string[] }>;
  submitPod(): Promise<void>;
  completeJob(): Promise<void>;
}

export interface DriverJourneyResult {
  steps: JourneyStep[];
  queueOrder: string[];
  acknowledged: string[];
  conflicts: string[];
  allSynced: boolean;
}

/**
 * Runs the complete driver journey against an injected persistence gateway.
 * The gateway is deliberately explicit so Supabase/RPC calls remain the owning
 * domain authority and this orchestration remains deterministic and testable.
 */
export async function runPersistedDriverJourney(
  gateway: DriverJourneyGateway,
  routePack: Parameters<typeof validateRoutePack>[0],
  queue: readonly PersistedQueueItem[],
): Promise<DriverJourneyResult> {
  const validation = validateRoutePack(routePack);
  if (!validation.valid) throw new Error(`Route pack invalid: ${validation.errors.join(", ")}`);
  const steps: JourneyStep[] = [];

  await gateway.createRoutePack();
  steps.push("route_pack_created");
  await gateway.markRoutePackReady();
  steps.push("route_pack_ready");
  await gateway.transition("accept");
  steps.push("job_accepted");
  await gateway.recordInspection();
  steps.push("inspection_completed");
  await gateway.transition("start");
  steps.push("trip_started");
  await gateway.queue(
    queue.find((item) => item.id === "arrival") ?? {
      id: "arrival",
      priority: "trip",
      createdAt: new Date().toISOString(),
      state: "queued",
    },
  );
  steps.push("arrival_queued");
  await gateway.queue(
    queue.find((item) => item.id === "delivery") ?? {
      id: "delivery",
      priority: "trip",
      createdAt: new Date().toISOString(),
      state: "queued",
    },
  );
  steps.push("delivery_queued");
  await gateway.queue(
    queue.find((item) => item.id === "pod") ?? {
      id: "pod",
      priority: "pod",
      createdAt: new Date().toISOString(),
      state: "queued",
    },
  );
  steps.push("pod_queued");
  await gateway.reconnect();
  steps.push("reconnected");
  const ordered = orderSyncItems(queue);
  const processed = await gateway.processQueue(ordered);
  await gateway.submitPod();
  steps.push("pod_accepted");
  await gateway.completeJob();
  steps.push("job_completed");
  return {
    steps,
    queueOrder: ordered.map((item) => item.id),
    acknowledged: processed.acknowledged,
    conflicts: processed.conflicts,
    allSynced: processed.conflicts.length === 0 && processed.acknowledged.length === ordered.length,
  };
}
