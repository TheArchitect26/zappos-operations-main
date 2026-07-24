import { describe, expect, it } from "vitest";
import {
  buildBarcode,
  buildQrPayload,
  calculateInventoryValuation,
  canTransitionInventory,
  createPickPlan,
  createTransfer,
  deriveWarehouseAlerts,
  packOrder,
  receiveInventory,
  reconcileCycleCount,
  scheduleDock,
  selectPutawayLocation,
  transitionInventory,
  transitionWarehouseTask,
  validatePartialPick,
  verifyLoading,
  warehouseCapabilities,
  type StockSnapshot,
} from "@/lib/warehouse/phase16";

const stock: StockSnapshot = {
  id: "stock-1",
  companyId: "company-1",
  productId: "product-1",
  warehouseId: "warehouse-1",
  locationId: "location-1",
  status: "available",
  quantity: 10,
};

describe("Phase 16 warehouse inventory lifecycle", () => {
  it("blocks illegal inventory transitions and emits immutable event details", () => {
    expect(canTransitionInventory("available", "picked")).toBe(false);
    expect(() => transitionInventory(stock, "picked", 1, "user-1")).toThrow("Illegal inventory");

    const result = transitionInventory(stock, "reserved", 4, "user-1", "reserve_for_order");
    expect(result.stock.status).toBe("reserved");
    expect(result.event).toMatchObject({
      fromStatus: "available",
      toStatus: "reserved",
      quantity: 4,
    });
  });

  it("validates receiving quantities and records a truthful acceptance outcome", () => {
    const received = receiveInventory({
      companyId: "company-1",
      productId: "product-1",
      warehouseId: "warehouse-1",
      expectedQuantity: 10,
      acceptedQuantity: 8,
      rejectedQuantity: 2,
      actorId: "receiver-1",
      batchNumber: "BATCH-1",
    });
    expect(received.inspectionStatus).toBe("partial");
    expect(received.stock?.quantity).toBe(8);
    expect(
      receiveInventory({
        companyId: "company-1",
        productId: "product-1",
        warehouseId: "warehouse-1",
        expectedQuantity: 10,
        acceptedQuantity: 0,
        rejectedQuantity: 10,
        actorId: "receiver-1",
      }),
    ).toMatchObject({ inspectionStatus: "rejected", stock: null, event: null });
    expect(() =>
      receiveInventory({
        companyId: "company-1",
        productId: "product-1",
        warehouseId: "warehouse-1",
        expectedQuantity: 10,
        acceptedQuantity: 11,
        rejectedQuantity: 0,
        actorId: "receiver-1",
      }),
    ).toThrow("exceed");
  });

  it("selects the nearest compatible put-away location and validates overrides", () => {
    const locations = [
      {
        id: "blocked-near",
        warehouseId: "warehouse-1",
        status: "blocked" as const,
        distanceRank: 1,
        availableWeightKg: 100,
        availableVolumeM3: 10,
        acceptsHazardous: true,
        temperatureMinC: 2,
        temperatureMaxC: 8,
      },
      {
        id: "compatible",
        warehouseId: "warehouse-1",
        status: "available" as const,
        distanceRank: 5,
        availableWeightKg: 100,
        availableVolumeM3: 10,
        acceptsHazardous: true,
        temperatureMinC: 2,
        temperatureMaxC: 8,
      },
    ];
    const item = {
      warehouseId: "warehouse-1",
      quantity: 2,
      unitWeightKg: 10,
      unitVolumeM3: 1,
      dangerousGoods: true,
      requiredTemperatureMinC: 3,
      requiredTemperatureMaxC: 6,
    };
    expect(selectPutawayLocation(locations, item).location.id).toBe("compatible");
    expect(() => selectPutawayLocation(locations, item, "blocked-near")).toThrow("not compatible");
  });

  it("plans picks deterministically and supports partial-pick accounting", () => {
    const plan = createPickPlan(
      [
        { orderId: "B", productId: "P2", quantity: 2, priority: "normal" as const },
        { orderId: "A", productId: "P1", quantity: 1, priority: "critical" as const },
      ],
      "single",
    );
    expect(plan.map((item) => item.orderId)).toEqual(["A", "B"]);
    expect(validatePartialPick(10, 6)).toEqual({ isPartial: true, remainingQuantity: 4 });
    expect(() => validatePartialPick(4, 5)).toThrow("no more than requested");
  });

  it("verifies packing weights and generates traceable labels", () => {
    const packed = packOrder({
      orderId: "order-1",
      packageReference: "pkg 001",
      expectedWeightKg: 5,
      verifiedWeightKg: 5.1,
      toleranceKg: 0.2,
      actorId: "packer-1",
    });
    expect(packed.barcode).toMatch(/^ZAP-PKG001-/);
    expect(packed.qrPayload).toContain("package/pkg%20001");
    expect(() =>
      packOrder({
        orderId: "order-1",
        packageReference: "pkg 002",
        expectedWeightKg: 5,
        verifiedWeightKg: 6,
        toleranceKg: 0.2,
        actorId: "packer-1",
      }),
    ).toThrow("outside");
  });

  it("requires a vehicle and seal number before loading and dispatch readiness", () => {
    expect(() =>
      verifyLoading({
        orderStatus: "ready_for_dispatch",
        vehicleId: "vehicle-1",
        sealNumber: "",
        actorId: "loader-1",
      }),
    ).toThrow("seal number");
    expect(
      verifyLoading({
        orderStatus: "ready_for_dispatch",
        vehicleId: "vehicle-1",
        sealNumber: "SEAL-1",
        actorId: "loader-1",
      }),
    ).toMatchObject({ status: "loaded", sealNumber: "SEAL-1" });
  });

  it("keeps transfers tenant-safe and requires emergency transfer reasons", () => {
    expect(() =>
      createTransfer({
        companyId: "company-1",
        stockCompanyId: "company-2",
        fromWarehouseId: "one",
        toWarehouseId: "two",
        quantity: 1,
        availableQuantity: 2,
        type: "warehouse",
      }),
    ).toThrow("company boundaries");
    expect(() =>
      createTransfer({
        companyId: "company-1",
        stockCompanyId: "company-1",
        fromWarehouseId: "one",
        toWarehouseId: "two",
        quantity: 1,
        availableQuantity: 2,
        type: "emergency",
      }),
    ).toThrow("recorded reason");
  });

  it("requires supervisor approval for cycle-count adjustments", () => {
    expect(() =>
      reconcileCycleCount({
        expectedQuantity: 10,
        countedQuantity: 8,
        status: "approved",
        supervisorApproved: false,
      }),
    ).toThrow("supervisor");
    expect(
      reconcileCycleCount({
        expectedQuantity: 10,
        countedQuantity: 8,
        status: "approved",
        supervisorApproved: true,
      }),
    ).toEqual({ varianceQuantity: -2, requiresAdjustment: true });
  });

  it("enforces task transitions and warehouse role boundaries", () => {
    expect(transitionWarehouseTask("open", "assigned")).toBe("assigned");
    expect(() => transitionWarehouseTask("completed", "in_progress")).toThrow("Illegal");
    expect(warehouseCapabilities(["warehouse_operator"]).canViewFinance).toBe(false);
    expect(warehouseCapabilities(["dispatcher"]).canOperate).toBe(false);
    expect(warehouseCapabilities(["inventory_controller"]).canApproveCounts).toBe(true);
    expect(warehouseCapabilities(["driver"]).canRead).toBe(false);
  });

  it("calculates valuation without disposed stock and derives operational alerts", () => {
    expect(
      calculateInventoryValuation([
        { quantity: 3, unitCost: 25, status: "available" },
        { quantity: 2, unitCost: 30, status: "disposed" },
      ]),
    ).toBe(75);
    expect(
      deriveWarehouseAlerts({
        productId: "product-1",
        availableQuantity: 0,
        reorderPoint: 2,
        damagedQuantity: 1,
        warehouseUtilization: 1,
        equipmentStatus: "out_of_service",
        now: new Date("2026-07-24T00:00:00Z"),
        expiryDate: "2026-07-23",
      }).map((alert) => alert.type),
    ).toEqual(
      expect.arrayContaining([
        "low_stock",
        "damaged_inventory",
        "capacity_limit",
        "equipment_failure",
        "stock_expiry",
      ]),
    );
  });

  it("generates canonical barcode and QR payloads and prevents dock conflicts", () => {
    expect(buildBarcode("sku-01")).toBe(buildBarcode("SKU-01"));
    expect(buildQrPayload("stock", "serial/1")).toBe("zappos://warehouse/stock/serial%2F1");
    expect(() =>
      scheduleDock({
        dockId: "dock-1",
        start: "2026-07-24T10:30:00Z",
        end: "2026-07-24T11:00:00Z",
        existing: [
          {
            dockId: "dock-1",
            start: "2026-07-24T10:00:00Z",
            end: "2026-07-24T11:00:00Z",
            status: "scheduled",
          },
        ],
      }),
    ).toThrow("already scheduled");
    expect(
      scheduleDock({
        dockId: "dock-1",
        start: "2026-07-24T11:00:00Z",
        end: "2026-07-24T12:00:00Z",
        existing: [
          {
            dockId: "dock-1",
            start: "2026-07-24T10:00:00Z",
            end: "2026-07-24T11:00:00Z",
            status: "scheduled",
          },
        ],
      }),
    ).toEqual({ status: "scheduled" });
  });
});
