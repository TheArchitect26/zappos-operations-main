export type MobileWorkspace =
  "driver" | "technician" | "warehouse" | "supervisor" | "executive" | "customer_care";

export type NetworkQuality = "offline" | "poor" | "good" | "excellent";
export type SyncDirection = "upload" | "download";
export type MobileSyncState = "queued" | "running" | "failed" | "succeeded" | "conflict";

export interface MobileQueueItem<T = unknown> {
  id: string;
  companyId: string;
  userId: string;
  entity: string;
  entityId: string;
  operation: "create" | "update" | "delete" | "upload";
  payload: T;
  checksum: string;
  baseVersion: number | null;
  attempt: number;
  maximumAttempts: number;
  nextRetryAt: string | null;
  state: MobileSyncState;
  priority?: "safety" | "trip" | "pod" | "message" | "gps" | "photo" | "analytics";
  dependencyId?: string | null;
  lastError?: string | null;
  serverAcknowledgedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEnvironment {
  online: boolean;
  quality: NetworkQuality;
  batteryPercent: number | null;
  charging: boolean;
}

export interface SyncCheckpoint {
  companyId: string;
  userId: string;
  scope: string;
  cursor: string | null;
  updatedAt: string;
}

export interface MobileStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
