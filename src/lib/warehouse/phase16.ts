export const inventoryStatuses = [
  "received",
  "quality_inspection",
  "available",
  "reserved",
  "allocated",
  "picked",
  "packed",
  "loaded",
  "in_transit",
  "delivered",
  "returned",
  "damaged",
  "disposed",
  "archived",
] as const;

export type InventoryStatus = (typeof inventoryStatuses)[number];
export type WarehouseRole =
  | "admin"
  | "warehouse_manager"
  | "warehouse_supervisor"
  | "warehouse_operator"
  | "inventory_controller"
  | "forklift_operator"
  | "receiving_clerk"
  | "packing_clerk"
  | "quality_inspector"
  | "dispatcher"
  | "viewer"
  | "driver";

export type WarehouseTaskStatus =
  "open" | "assigned" | "in_progress" | "blocked" | "completed" | "cancelled";
export type WarehouseTaskType =
  | "receiving"
  | "putaway"
  | "picking"
  | "packing"
  | "loading"
  | "cycle_count"
  | "transfer"
  | "inspection"
  | "cleanup"
  | "maintenance";

export interface StockSnapshot {
  id: string;
  companyId: string;
  productId: string;
  warehouseId: string;
  locationId: string | null;
  status: InventoryStatus;
  quantity: number;
  reservedQuantity?: number;
  allocatedQuantity?: number;
  expiryDate?: string | null;
  isDamaged?: boolean;
}

export interface InventoryEvent {
  stockId: string;
  eventType: string;
  fromStatus: InventoryStatus | null;
  toStatus: InventoryStatus;
  quantity: number;
  actorId: string;
  metadata?: Record<string, unknown>;
}

const lifecycleTransitions: Record<InventoryStatus, readonly InventoryStatus[]> = {
  received: ["quality_inspection", "available", "damaged", "returned"],
  quality_inspection: ["available", "damaged", "disposed", "returned"],
  available: ["reserved", "allocated", "damaged", "disposed", "archived"],
  reserved: ["available", "allocated", "picked"],
  allocated: ["available", "picked"],
  picked: ["packed", "available", "damaged"],
  packed: ["loaded", "picked", "damaged"],
  loaded: ["in_transit", "packed"],
  in_transit: ["delivered", "returned", "damaged"],
  delivered: ["returned", "archived"],
  returned: ["quality_inspection", "available", "disposed"],
  damaged: ["quality_inspection", "disposed", "archived"],
  disposed: ["archived"],
  archived: [],
};

export function canTransitionInventory(from: InventoryStatus, to: InventoryStatus) {
  return lifecycleTransitions[from].includes(to);
}

export function transitionInventory(
  stock: StockSnapshot,
  toStatus: InventoryStatus,
  quantity: number,
  actorId: string,
  eventType = "inventory_transition",
): { stock: StockSnapshot; event: InventoryEvent } {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > stock.quantity) {
    throw new Error("Transition quantity must be within the available stock quantity");
  }
  if (!canTransitionInventory(stock.status, toStatus)) {
    throw new Error(`Illegal inventory transition from ${stock.status} to ${toStatus}`);
  }
  return {
    stock: { ...stock, status: toStatus, isDamaged: toStatus === "damaged" },
    event: {
      stockId: stock.id,
      eventType,
      fromStatus: stock.status,
      toStatus,
      quantity,
      actorId,
    },
  };
}

export function receiveInventory(input: {
  companyId: string;
  productId: string;
  warehouseId: string;
  expectedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  actorId: string;
  serialNumber?: string;
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
}) {
  if (input.acceptedQuantity < 0 || input.rejectedQuantity < 0) {
    throw new Error("Received quantities cannot be negative");
  }
  if (input.acceptedQuantity + input.rejectedQuantity > input.expectedQuantity) {
    throw new Error("Received quantities cannot exceed the expected quantity");
  }
  if (input.acceptedQuantity === 0 && input.rejectedQuantity === 0) {
    throw new Error("A receiving outcome must include accepted or rejected quantity");
  }
  const inspectionStatus =
    input.rejectedQuantity === 0
      ? "accepted"
      : input.acceptedQuantity === 0
        ? "rejected"
        : "partial";
  if (input.acceptedQuantity === 0) {
    return { inspectionStatus, stock: null, event: null };
  }
  return {
    inspectionStatus,
    stock: {
      id: `received:${input.productId}:${input.serialNumber ?? input.batchNumber ?? input.lotNumber ?? "bulk"}`,
      companyId: input.companyId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      locationId: null,
      status: "received" as const,
      quantity: input.acceptedQuantity,
      expiryDate: input.expiryDate ?? null,
    },
    event: {
      stockId: `received:${input.productId}`,
      eventType: "receiving_accepted",
      fromStatus: null,
      toStatus: "received" as const,
      quantity: input.acceptedQuantity,
      actorId: input.actorId,
      metadata: { rejectedQuantity: input.rejectedQuantity },
    },
  };
}

export interface PutawayLocation {
  id: string;
  warehouseId: string;
  status: "available" | "blocked" | "maintenance" | "full";
  distanceRank: number;
  availableWeightKg: number | null;
  availableVolumeM3: number | null;
  acceptsHazardous: boolean;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
}

export interface PutawayItem {
  warehouseId: string;
  quantity: number;
  unitWeightKg: number;
  unitVolumeM3: number;
  dangerousGoods: boolean;
  requiredTemperatureMinC: number | null;
  requiredTemperatureMaxC: number | null;
}

function supportsTemperature(location: PutawayLocation, item: PutawayItem) {
  if (item.requiredTemperatureMinC !== null && location.temperatureMinC !== null) {
    if (location.temperatureMinC > item.requiredTemperatureMinC) return false;
  }
  if (item.requiredTemperatureMaxC !== null && location.temperatureMaxC !== null) {
    if (location.temperatureMaxC < item.requiredTemperatureMaxC) return false;
  }
  return true;
}

export function selectPutawayLocation(
  locations: PutawayLocation[],
  item: PutawayItem,
  manualLocationId?: string | null,
) {
  const requiredWeight = item.quantity * item.unitWeightKg;
  const requiredVolume = item.quantity * item.unitVolumeM3;
  const compatible = locations.filter(
    (location) =>
      location.warehouseId === item.warehouseId &&
      location.status === "available" &&
      (location.availableWeightKg === null || location.availableWeightKg >= requiredWeight) &&
      (location.availableVolumeM3 === null || location.availableVolumeM3 >= requiredVolume) &&
      (!item.dangerousGoods || location.acceptsHazardous) &&
      supportsTemperature(location, item),
  );
  if (manualLocationId) {
    const override = compatible.find((location) => location.id === manualLocationId);
    if (!override) throw new Error("Manual put-away location is not compatible");
    return { location: override, overridden: true };
  }
  const location = [...compatible].sort(
    (left, right) => left.distanceRank - right.distanceRank || left.id.localeCompare(right.id),
  )[0];
  if (!location) throw new Error("No compatible put-away location is available");
  return { location, overridden: false };
}

export interface PickRequest {
  orderId: string;
  productId: string;
  quantity: number;
  priority: "low" | "normal" | "high" | "critical";
  zoneId?: string | null;
}

export function createPickPlan(
  requests: PickRequest[],
  strategy: "single" | "batch" | "wave" | "zone",
) {
  const sorted = [...requests].sort((left, right) => {
    const priority = { critical: 0, high: 1, normal: 2, low: 3 };
    return (
      priority[left.priority] - priority[right.priority] ||
      left.orderId.localeCompare(right.orderId)
    );
  });
  if (strategy === "zone") {
    return sorted.sort((left, right) => (left.zoneId ?? "").localeCompare(right.zoneId ?? ""));
  }
  if (strategy === "batch") {
    return sorted.sort((left, right) => left.productId.localeCompare(right.productId));
  }
  return sorted;
}

export function validatePartialPick(requestedQuantity: number, pickedQuantity: number) {
  if (pickedQuantity <= 0 || pickedQuantity > requestedQuantity) {
    throw new Error("Picked quantity must be greater than zero and no more than requested");
  }
  return {
    isPartial: pickedQuantity < requestedQuantity,
    remainingQuantity: requestedQuantity - pickedQuantity,
  };
}

export function packOrder(input: {
  orderId: string;
  packageReference: string;
  expectedWeightKg: number;
  verifiedWeightKg: number;
  toleranceKg: number;
  actorId: string;
}) {
  if (input.expectedWeightKg < 0 || input.verifiedWeightKg < 0 || input.toleranceKg < 0) {
    throw new Error("Package weights and tolerance cannot be negative");
  }
  if (Math.abs(input.expectedWeightKg - input.verifiedWeightKg) > input.toleranceKg) {
    throw new Error("Package weight is outside the approved verification tolerance");
  }
  return {
    packageReference: input.packageReference,
    orderId: input.orderId,
    barcode: buildBarcode(input.packageReference),
    qrPayload: buildQrPayload("package", input.packageReference),
    packedBy: input.actorId,
  };
}

export function verifyLoading(input: {
  orderStatus: "ready_for_dispatch" | "loaded" | "dispatched";
  vehicleId: string | null;
  sealNumber: string | null;
  actorId: string;
}) {
  if (input.orderStatus !== "ready_for_dispatch") {
    throw new Error("Only packed orders ready for dispatch can be loaded");
  }
  if (!input.vehicleId) throw new Error("A vehicle must be assigned before loading");
  if (!input.sealNumber?.trim()) throw new Error("A seal number is required to complete loading");
  return {
    status: "loaded" as const,
    verifiedBy: input.actorId,
    sealNumber: input.sealNumber.trim(),
  };
}

export function createTransfer(input: {
  companyId: string;
  stockCompanyId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  availableQuantity: number;
  type: "warehouse" | "bin" | "zone" | "emergency" | "cross_dock";
  reason?: string;
}) {
  if (input.companyId !== input.stockCompanyId) {
    throw new Error("Inventory transfers cannot cross company boundaries");
  }
  if (input.quantity <= 0 || input.quantity > input.availableQuantity) {
    throw new Error("Transfer quantity must be within available stock");
  }
  if (input.fromWarehouseId === input.toWarehouseId && input.type === "warehouse") {
    throw new Error("Warehouse-to-warehouse transfers require a different destination warehouse");
  }
  if (input.type === "emergency" && !input.reason?.trim()) {
    throw new Error("Emergency transfers require a recorded reason");
  }
  return { status: "requested" as const, auditEvent: "inventory_transfer_requested" };
}

export function reconcileCycleCount(input: {
  expectedQuantity: number;
  countedQuantity: number;
  status: "submitted" | "approved";
  supervisorApproved: boolean;
}) {
  if (input.expectedQuantity < 0 || input.countedQuantity < 0) {
    throw new Error("Cycle count quantities cannot be negative");
  }
  if (input.status === "approved" && !input.supervisorApproved) {
    throw new Error("A supervisor must approve inventory adjustments");
  }
  return {
    varianceQuantity: input.countedQuantity - input.expectedQuantity,
    requiresAdjustment: input.countedQuantity !== input.expectedQuantity,
  };
}

const taskTransitions: Record<WarehouseTaskStatus, readonly WarehouseTaskStatus[]> = {
  open: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "blocked", "cancelled"],
  in_progress: ["blocked", "completed", "cancelled"],
  blocked: ["assigned", "in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

export function transitionWarehouseTask(from: WarehouseTaskStatus, to: WarehouseTaskStatus) {
  if (!taskTransitions[from].includes(to)) {
    throw new Error(`Illegal warehouse task transition from ${from} to ${to}`);
  }
  return to;
}

export function warehouseCapabilities(roles: WarehouseRole[]) {
  const has = (role: WarehouseRole) => roles.includes(role);
  const canRead = roles.some((role) => !["driver"].includes(role));
  const canOperate = roles.some((role) =>
    [
      "admin",
      "warehouse_manager",
      "warehouse_supervisor",
      "warehouse_operator",
      "inventory_controller",
      "forklift_operator",
      "receiving_clerk",
      "packing_clerk",
      "quality_inspector",
    ].includes(role),
  );
  const canManage = roles.some((role) =>
    ["admin", "warehouse_manager", "warehouse_supervisor", "inventory_controller"].includes(role),
  );
  return {
    canRead,
    canOperate,
    canManage,
    canViewFinance: has("admin") || has("warehouse_manager") || has("inventory_controller"),
    canScheduleDocks: canManage || has("dispatcher"),
    canApproveCounts: canManage,
    canReceive: canOperate && !has("packing_clerk"),
    canPack: canOperate && !has("receiving_clerk"),
  };
}

export function calculateInventoryValuation(
  entries: Array<{ quantity: number; unitCost: number; status: InventoryStatus }>,
) {
  return entries
    .filter((entry) => !["disposed", "archived"].includes(entry.status))
    .reduce((total, entry) => total + entry.quantity * entry.unitCost, 0);
}

export interface WarehouseAlertInput {
  productId: string;
  availableQuantity: number;
  reorderPoint: number;
  expiryDate?: string | null;
  damagedQuantity?: number;
  warehouseUtilization?: number;
  equipmentStatus?: "available" | "assigned" | "maintenance" | "out_of_service";
  now?: Date;
}

export function deriveWarehouseAlerts(input: WarehouseAlertInput) {
  const alerts: Array<{ type: string; severity: "info" | "warning" | "critical" }> = [];
  if (input.availableQuantity <= 0) alerts.push({ type: "low_stock", severity: "critical" });
  else if (input.availableQuantity <= input.reorderPoint)
    alerts.push({ type: "low_stock", severity: "warning" });
  if (input.damagedQuantity && input.damagedQuantity > 0)
    alerts.push({ type: "damaged_inventory", severity: "warning" });
  if (input.expiryDate) {
    const remainingDays =
      (new Date(input.expiryDate).getTime() - (input.now ?? new Date()).getTime()) / 86_400_000;
    if (remainingDays <= 0) alerts.push({ type: "stock_expiry", severity: "critical" });
    else if (remainingDays <= 30) alerts.push({ type: "stock_expiry", severity: "warning" });
  }
  if ((input.warehouseUtilization ?? 0) >= 1)
    alerts.push({ type: "capacity_limit", severity: "critical" });
  else if ((input.warehouseUtilization ?? 0) >= 0.9)
    alerts.push({ type: "capacity_limit", severity: "warning" });
  if (input.equipmentStatus === "out_of_service")
    alerts.push({ type: "equipment_failure", severity: "critical" });
  return alerts;
}

function barcodeChecksum(value: string) {
  return (
    [...value].reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 3), 0) %
    97
  );
}

export function buildBarcode(reference: string) {
  const normalized = reference
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
  if (!normalized) throw new Error("A barcode reference is required");
  return `ZAP-${normalized}-${barcodeChecksum(normalized).toString().padStart(2, "0")}`;
}

export function buildQrPayload(entityType: "product" | "package" | "stock", reference: string) {
  const normalized = reference.trim();
  if (!normalized) throw new Error("A QR reference is required");
  return `zappos://warehouse/${entityType}/${encodeURIComponent(normalized)}`;
}

export function scheduleDock(input: {
  dockId: string;
  start: string;
  end: string;
  existing: Array<{ dockId: string; start: string; end: string; status: string }>;
}) {
  const start = new Date(input.start).getTime();
  const end = new Date(input.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Dock schedule must have a valid non-empty time window");
  }
  const conflicting = input.existing.some((booking) => {
    if (booking.dockId !== input.dockId || ["cancelled", "complete"].includes(booking.status))
      return false;
    return start < new Date(booking.end).getTime() && end > new Date(booking.start).getTime();
  });
  if (conflicting) throw new Error("Dock is already scheduled for that time window");
  return { status: "scheduled" as const };
}
