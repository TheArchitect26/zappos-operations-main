import { retryPlan } from "@/lib/integrations/phase22";
import type { MobileQueueItem, MobileStorage, SyncCheckpoint, SyncEnvironment } from "./types";

const QUEUE_KEY = "zapp.mobile.queue.v1";
const DRAFT_PREFIX = "zapp.mobile.draft.v1";
const CHECKPOINT_PREFIX = "zapp.mobile.checkpoint.v1";

export class MemoryMobileStorage implements MobileStorage {
  private readonly values = new Map<string, unknown>();
  async get<T>(key: string) {
    return (this.values.get(key) as T | undefined) ?? null;
  }
  async set<T>(key: string, value: T) {
    this.values.set(key, structuredClone(value));
  }
  async remove(key: string) {
    this.values.delete(key);
  }
}

export class BrowserMobileStorage implements MobileStorage {
  async get<T>(key: string): Promise<T | null> {
    if (typeof localStorage === "undefined") return null;
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  }
  async set<T>(key: string, value: T) {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  }
  async remove(key: string) {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  }
}

export function simpleChecksum(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function canSynchronize(environment: SyncEnvironment, urgent = false) {
  if (!environment.online || environment.quality === "offline") return false;
  if (urgent) return true;
  if (
    environment.batteryPercent !== null &&
    environment.batteryPercent < 15 &&
    !environment.charging
  )
    return false;
  return environment.quality !== "poor";
}

export class MobileOfflineEngine {
  constructor(private readonly storage: MobileStorage) {}

  async queue<T>(
    input: Omit<
      MobileQueueItem<T>,
      | "checksum"
      | "attempt"
      | "maximumAttempts"
      | "nextRetryAt"
      | "state"
      | "createdAt"
      | "updatedAt"
    > & { maximumAttempts?: number },
  ) {
    const items = await this.items();
    const duplicate = items.find(
      (item) =>
        item.id === input.id ||
        (item.entity === input.entity &&
          item.entityId === input.entityId &&
          item.operation === input.operation &&
          item.checksum === simpleChecksum(input.payload) &&
          item.state !== "failed"),
    );
    if (duplicate) return duplicate as MobileQueueItem<T>;
    const now = new Date().toISOString();
    const item: MobileQueueItem<T> = {
      ...input,
      checksum: simpleChecksum(input.payload),
      attempt: 0,
      maximumAttempts: input.maximumAttempts ?? 6,
      nextRetryAt: null,
      state: "queued",
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.set(QUEUE_KEY, [...items, item]);
    return item;
  }

  async items() {
    return (await this.storage.get<MobileQueueItem[]>(QUEUE_KEY)) ?? [];
  }

  async markFailed(id: string, now = new Date()) {
    const items = await this.items();
    const target = items.find((item) => item.id === id);
    if (!target) throw new Error("Offline queue item not found");
    const attempt = target.attempt + 1;
    const plan = retryPlan(attempt, target.maximumAttempts, now);
    target.attempt = attempt;
    target.state = "failed";
    target.nextRetryAt = plan.nextRetryAt?.toISOString() ?? null;
    target.updatedAt = now.toISOString();
    await this.storage.set(QUEUE_KEY, items);
    return { item: target, exhausted: plan.status === "exhausted" };
  }

  async markSucceeded(id: string) {
    const items = await this.items();
    await this.storage.set(
      QUEUE_KEY,
      items.filter((item) => item.id !== id),
    );
  }

  async markConflict(id: string) {
    const items = await this.items();
    const target = items.find((item) => item.id === id);
    if (!target) throw new Error("Offline queue item not found");
    target.state = "conflict";
    target.updatedAt = new Date().toISOString();
    await this.storage.set(QUEUE_KEY, items);
    return target;
  }

  async ready(environment: SyncEnvironment, now = new Date()) {
    if (!canSynchronize(environment)) return [];
    return (await this.items()).filter(
      (item) =>
        item.state === "queued" ||
        (item.state === "failed" && item.nextRetryAt !== null && new Date(item.nextRetryAt) <= now),
    );
  }

  async saveDraft<T>(companyId: string, userId: string, kind: string, id: string, value: T) {
    await this.storage.set(`${DRAFT_PREFIX}:${companyId}:${userId}:${kind}:${id}`, value);
  }
  async loadDraft<T>(companyId: string, userId: string, kind: string, id: string) {
    return this.storage.get<T>(`${DRAFT_PREFIX}:${companyId}:${userId}:${kind}:${id}`);
  }
  async saveCheckpoint(checkpoint: SyncCheckpoint) {
    await this.storage.set(
      `${CHECKPOINT_PREFIX}:${checkpoint.companyId}:${checkpoint.userId}:${checkpoint.scope}`,
      checkpoint,
    );
  }
  async loadCheckpoint(companyId: string, userId: string, scope: string) {
    return this.storage.get<SyncCheckpoint>(`${CHECKPOINT_PREFIX}:${companyId}:${userId}:${scope}`);
  }
}
