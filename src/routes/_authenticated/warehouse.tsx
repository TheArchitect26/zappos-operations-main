/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  Box,
  Boxes,
  ClipboardCheck,
  Container,
  Factory,
  Forklift,
  Loader2,
  PackageCheck,
  ScanLine,
  ShieldAlert,
  Truck,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { warehouseCapabilities, type WarehouseRole } from "@/lib/warehouse/phase16";

export const Route = createFileRoute("/_authenticated/warehouse")({
  head: () => ({ meta: [{ title: "Warehouse & distribution — ZappOS" }] }),
  component: WarehousePage,
});

type WarehouseTab =
  | "overview"
  | "inventory"
  | "tasks"
  | "receiving"
  | "dispatch"
  | "transfers"
  | "counts"
  | "equipment";

interface WarehouseData {
  warehouses: any[];
  stock: any[];
  products: any[];
  alerts: any[];
  tasks: any[];
  inbound: any[];
  orders: any[];
  docks: any[];
  loading: any[];
  crossDock: any[];
  transfers: any[];
  counts: any[];
  equipment: any[];
  movements: any[];
  valuation: any[];
}

const EMPTY_DATA: WarehouseData = {
  warehouses: [],
  stock: [],
  products: [],
  alerts: [],
  tasks: [],
  inbound: [],
  orders: [],
  docks: [],
  loading: [],
  crossDock: [],
  transfers: [],
  counts: [],
  equipment: [],
  movements: [],
  valuation: [],
};

const warehouseRoles: WarehouseRole[] = [
  "admin",
  "warehouse_manager",
  "warehouse_supervisor",
  "warehouse_operator",
  "inventory_controller",
  "forklift_operator",
  "receiving_clerk",
  "packing_clerk",
  "quality_inspector",
  "dispatcher",
  "viewer",
];

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function Kpi({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: typeof Box;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </Card>
  );
}

function StatusPill({ value }: { value: string | null | undefined }) {
  const status = value?.replaceAll("_", " ") ?? "unknown";
  return (
    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">{status}</span>
  );
}

function WarehousePage() {
  const { activeCompany, roles } = useCompany();
  const [data, setData] = useState<WarehouseData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<WarehouseTab>("overview");
  const [scanValue, setScanValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [puttingAway, setPuttingAway] = useState<string | null>(null);

  const capabilities = useMemo(() => warehouseCapabilities(roles as WarehouseRole[]), [roles]);
  const isWarehouseRole = roles.some((role) => warehouseRoles.includes(role as WarehouseRole));

  const load = useCallback(async () => {
    if (!activeCompany || !isWarehouseRole) {
      setData(EMPTY_DATA);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const companyId = activeCompany.id;
    const results = await Promise.all([
      (supabase as any)
        .from("warehouses")
        .select("id,code,name,status,max_weight_kg,max_volume_m3")
        .eq("company_id", companyId),
      (supabase as any)
        .from("warehouse_stock")
        .select("id,product_id,warehouse_id,location_id,status,quantity,expiry_date")
        .eq("company_id", companyId),
      (supabase as any)
        .from("inventory_products")
        .select("id,sku,name,barcode,weight_kg")
        .eq("company_id", companyId)
        .eq("active", true),
      (supabase as any)
        .from("warehouse_alerts")
        .select("id,alert_type,severity,status,title,detail,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(40),
      (supabase as any)
        .from("warehouse_tasks")
        .select("id,task_type,status,priority,title,assigned_to,due_at,reference_type,reference_id")
        .eq("company_id", companyId)
        .order("due_at", { ascending: true })
        .limit(80),
      (supabase as any)
        .from("warehouse_inbound_shipments")
        .select("id,purchase_order_reference,supplier_name,status,expected_at,arrived_at")
        .eq("company_id", companyId)
        .order("expected_at", { ascending: true })
        .limit(40),
      (supabase as any)
        .from("warehouse_orders")
        .select("id,order_reference,status,priority,requested_dispatch_at,customer_id,job_id")
        .eq("company_id", companyId)
        .order("requested_dispatch_at", { ascending: true })
        .limit(80),
      (supabase as any)
        .from("warehouse_dock_schedules")
        .select("id,direction,status,scheduled_start,scheduled_end,dock_id,vehicle_id")
        .eq("company_id", companyId)
        .order("scheduled_start", { ascending: true })
        .limit(40),
      (supabase as any)
        .from("warehouse_loading_jobs")
        .select("id,status,seal_number,vehicle_id,warehouse_order_id,loaded_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(40),
      (supabase as any)
        .from("warehouse_cross_dock_jobs")
        .select("id,status,inbound_shipment_id,warehouse_order_id,staging_location_id")
        .eq("company_id", companyId)
        .limit(40),
      (supabase as any)
        .from("warehouse_transfers")
        .select("id,status,transfer_type,quantity,from_warehouse_id,to_warehouse_id,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(40),
      (supabase as any)
        .from("warehouse_cycle_counts")
        .select("id,count_type,status,scheduled_for,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(40),
      (supabase as any)
        .from("warehouse_equipment")
        .select("id,asset_tag,equipment_type,maintenance_status,assigned_to,next_maintenance_at")
        .eq("company_id", companyId)
        .order("asset_tag"),
      (supabase as any)
        .from("warehouse_inventory_movements")
        .select("id,movement_type,quantity,created_at,to_status")
        .eq("company_id", companyId)
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      capabilities.canViewFinance
        ? (supabase as any).rpc("warehouse_inventory_valuation", { _company_id: companyId })
        : Promise.resolve({ data: [], error: null }),
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setError(failed.error.message);
      setLoading(false);
      return;
    }
    setData({
      warehouses: results[0].data ?? [],
      stock: results[1].data ?? [],
      products: results[2].data ?? [],
      alerts: results[3].data ?? [],
      tasks: results[4].data ?? [],
      inbound: results[5].data ?? [],
      orders: results[6].data ?? [],
      docks: results[7].data ?? [],
      loading: results[8].data ?? [],
      crossDock: results[9].data ?? [],
      transfers: results[10].data ?? [],
      counts: results[11].data ?? [],
      equipment: results[12].data ?? [],
      movements: results[13].data ?? [],
      valuation: results[14].data ?? [],
    });
    setLoading(false);
  }, [activeCompany, capabilities.canViewFinance, isWarehouseRole]);

  useEffect(() => {
    void load();
  }, [load]);

  const scan = async () => {
    if (!activeCompany || !scanValue.trim()) return;
    setScanning(true);
    setScanResult(null);
    const { data: stock, error: scanError } = await (supabase as any).rpc("warehouse_record_scan", {
      _company_id: activeCompany.id,
      _identifier: scanValue.trim(),
      _identifier_type: "manual",
      _warehouse_id: data.warehouses[0]?.id ?? null,
    });
    setScanning(false);
    if (scanError) {
      toast.error(scanError.message);
      return;
    }
    setScanResult(
      stock?.id
        ? `Inventory record ${stock.id} found.`
        : "No inventory record matched this identifier.",
    );
  };

  const assignPutaway = async (stockId: string) => {
    setPuttingAway(stockId);
    const { error: putawayError } = await (supabase as any).rpc("warehouse_assign_putaway", {
      _stock_id: stockId,
    });
    setPuttingAway(null);
    if (putawayError) {
      toast.error(putawayError.message);
      return;
    }
    toast.success("Put-away assignment recorded");
    void load();
  };

  const kpis = useMemo(() => {
    const available = data.stock.filter((item) => item.status === "available");
    const lowAlerts = data.alerts.filter(
      (alert) => alert.status === "open" && alert.alert_type === "low_stock",
    );
    const openAlerts = data.alerts.filter((alert) => alert.status === "open");
    const activeDocks = data.docks.filter((dock) => ["arrived", "loading"].includes(dock.status));
    const ready = data.orders.filter((order) => order.status === "ready_for_dispatch");
    const accuracy = data.counts.length
      ? Math.round(
          (data.counts.filter((count) => count.status === "approved").length / data.counts.length) *
            100,
        )
      : null;
    return {
      inventoryItems: data.stock.reduce((sum, item) => sum + number(item.quantity), 0),
      stockItems: new Set(data.stock.map((item) => item.product_id)).size,
      lowAlerts: lowAlerts.length,
      outOfStock: data.products.filter(
        (product) =>
          !available.some((stock) => stock.product_id === product.id && number(stock.quantity) > 0),
      ).length,
      incoming: data.inbound.filter(
        (shipment) => !["putaway_complete", "rejected", "cancelled"].includes(shipment.status),
      ).length,
      outgoing: data.orders.filter((order) => !["dispatched", "cancelled"].includes(order.status))
        .length,
      awaitingPick: data.orders.filter((order) =>
        ["awaiting_picking", "picking"].includes(order.status),
      ).length,
      awaitingPack: data.orders.filter((order) =>
        ["awaiting_packing", "packing"].includes(order.status),
      ).length,
      ready: ready.length,
      activeDocks: activeDocks.length,
      utilization: data.warehouses.length
        ? Math.round(
            (activeDocks.length / Math.max(data.warehouses.length, data.docks.length, 1)) * 100,
          )
        : 0,
      accuracy,
      openAlerts: openAlerts.length,
      inventoryValue: data.valuation.reduce((sum, entry) => sum + number(entry.inventory_value), 0),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <LoadingState label="Loading warehouse operations" />
      </div>
    );
  }
  if (!isWarehouseRole || !capabilities.canRead) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Warehouse access is restricted"
          description="Your role does not have access to warehouse administration."
        />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="Could not load warehouse operations"
          description={error}
          onAction={() => void load()}
        />
      </div>
    );
  }

  const tabs: Array<{ id: WarehouseTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "inventory", label: "Inventory" },
    { id: "tasks", label: "Tasks" },
    { id: "receiving", label: "Receiving" },
    { id: "dispatch", label: "Loading & dispatch" },
    { id: "transfers", label: "Transfers" },
    { id: "counts", label: "Cycle counts" },
    { id: "equipment", label: "Equipment" },
  ];
  const receivedStock = data.stock.filter(
    (item) => item.status === "received" || item.status === "quality_inspection",
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Warehouse & distribution
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Operational warehouse control
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Company-scoped receiving, inventory, fulfillment, loading, and transfer workflows with
            immutable movement audit records.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh live data
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? "default" : "outline"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Active warehouses"
              value={formatCount(
                data.warehouses.filter((warehouse) => warehouse.status === "active").length,
              )}
              icon={Warehouse}
            />
            <Kpi
              label="Total stock items"
              value={formatCount(kpis.stockItems)}
              detail={`${formatCount(kpis.inventoryItems)} units`}
              icon={Boxes}
            />
            <Kpi
              label="Low stock alerts"
              value={formatCount(kpis.lowAlerts)}
              detail={`${kpis.outOfStock} out of stock`}
              icon={AlertTriangle}
            />
            <Kpi label="Incoming shipments" value={formatCount(kpis.incoming)} icon={Container} />
            <Kpi
              label="Outgoing shipments"
              value={formatCount(kpis.outgoing)}
              detail={`${kpis.ready} ready for dispatch`}
              icon={Truck}
            />
            <Kpi
              label="Fulfilment queue"
              value={formatCount(kpis.awaitingPick + kpis.awaitingPack)}
              detail={`${kpis.awaitingPick} picking · ${kpis.awaitingPack} packing`}
              icon={ClipboardCheck}
            />
            <Kpi
              label="Active loading bays"
              value={formatCount(kpis.activeDocks)}
              detail={`${kpis.utilization}% dock activity`}
              icon={Forklift}
            />
            <Kpi
              label="Inventory accuracy"
              value={kpis.accuracy === null ? "—" : `${kpis.accuracy}%`}
              detail={kpis.accuracy === null ? "No approved counts yet" : "Approved cycle counts"}
              icon={PackageCheck}
            />
            {capabilities.canViewFinance ? (
              <Kpi
                label="Inventory valuation"
                value={new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                  maximumFractionDigits: 0,
                }).format(kpis.inventoryValue)}
                detail="Finance-restricted unit cost valuation"
                icon={Factory}
              />
            ) : null}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Open warehouse alerts</h2>
                  <p className="text-sm text-muted-foreground">
                    Shortages, capacity, quality, temperature, and equipment events.
                  </p>
                </div>
                <ShieldAlert className="h-5 w-5 text-status-warning" />
              </div>
              <div className="mt-4 space-y-2">
                {data.alerts
                  .filter((alert) => alert.status === "open")
                  .slice(0, 6)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {alert.detail ?? alert.alert_type}
                        </p>
                      </div>
                      <StatusPill value={alert.severity} />
                    </div>
                  ))}
                {kpis.openAlerts === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No open warehouse alerts.
                  </p>
                ) : null}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Today’s stock movement</h2>
                  <p className="text-sm text-muted-foreground">
                    Append-only movement events recorded today.
                  </p>
                </div>
                <Box className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                {data.movements.slice(0, 6).map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {movement.movement_type?.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{number(movement.quantity)}</span>
                  </div>
                ))}
                {data.movements.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No stock movements have been recorded today.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {tab === "inventory" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-semibold">Inventory availability</h2>
              <p className="text-sm text-muted-foreground">
                Stock lifecycle, traceability identifiers, batches, lots, and expiry are maintained
                in inventory records.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.stock.slice(0, 60).map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 font-mono text-xs">{item.id.slice(0, 8)}</td>
                      <td className="p-3">
                        <StatusPill value={item.status} />
                      </td>
                      <td className="p-3 text-right">{number(item.quantity)}</td>
                      <td className="p-3 text-muted-foreground">{item.expiry_date ?? "—"}</td>
                      <td className="p-3">
                        {capabilities.canOperate &&
                        ["received", "quality_inspection"].includes(item.status) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={puttingAway === item.id}
                            onClick={() => void assignPutaway(item.id)}
                          >
                            {puttingAway === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Put away"
                            )}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.stock.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No stock records are available for this company.
              </p>
            ) : null}
          </Card>
          <Card className="h-fit p-5">
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Barcode / QR lookup</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Camera capture remains a planned capability. Manual entry is recorded in scan history
              now.
            </p>
            <input
              className="mt-4 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={scanValue}
              onChange={(event) => setScanValue(event.target.value)}
              placeholder="Barcode, QR payload, RFID, or serial"
            />
            <Button
              className="mt-3 w-full gap-2"
              disabled={!scanValue.trim() || scanning}
              onClick={() => void scan()}
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Barcode className="h-4 w-4" />
              )}{" "}
              Lookup inventory
            </Button>
            {scanResult ? (
              <p className="mt-3 rounded-md bg-muted p-3 text-sm">{scanResult}</p>
            ) : null}
          </Card>
        </div>
      ) : null}

      {tab === "tasks" ? (
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold">Warehouse task engine</h2>
            <p className="text-sm text-muted-foreground">
              Receiving, put-away, picking, packing, loading, counting, transfer, inspection,
              cleanup, and maintenance work is assigned to warehouse employees.
            </p>
          </div>
          <div className="divide-y">
            {data.tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {task.task_type?.replaceAll("_", " ")} ·{" "}
                    {task.due_at ? new Date(task.due_at).toLocaleString() : "No due time"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusPill value={task.priority} />
                  <StatusPill value={task.status} />
                </div>
              </div>
            ))}
            {data.tasks.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No warehouse tasks are queued.</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {tab === "receiving" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Inbound receiving</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Expected shipments proceed through unload, inspection, quantity verification, damage
              evidence, acceptance or rejection, then put-away.
            </p>
            <div className="mt-4 space-y-2">
              {data.inbound.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {shipment.purchase_order_reference ??
                        shipment.supplier_name ??
                        "Inbound shipment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shipment.expected_at
                        ? new Date(shipment.expected_at).toLocaleString()
                        : "No expected time"}
                    </p>
                  </div>
                  <StatusPill value={shipment.status} />
                </div>
              ))}
              {data.inbound.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No inbound shipments are scheduled.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Awaiting put-away</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nearest compatible locations are selected using capacity, hazardous-goods,
              temperature, and overflow rules.
            </p>
            <div className="mt-4 space-y-2">
              {receivedStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-mono text-xs">{item.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {number(item.quantity)} units · {item.status}
                    </p>
                  </div>
                  {capabilities.canOperate ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={puttingAway === item.id}
                      onClick={() => void assignPutaway(item.id)}
                    >
                      Assign
                    </Button>
                  ) : null}
                </div>
              ))}
              {receivedStock.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No stock is awaiting put-away.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "dispatch" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Loading queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Orders become dispatch-ready only after verified packing, vehicle assignment, loading
              verification, and seal capture.
            </p>
            <div className="mt-4 space-y-2">
              {data.loading.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Order {job.warehouse_order_id?.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seal: {job.seal_number ?? "Awaiting verification"}
                    </p>
                  </div>
                  <StatusPill value={job.status} />
                </div>
              ))}
              {data.loading.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No loading jobs are queued.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Dock schedule & cross-dock</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dock slots prevent overlapping work. Cross-dock jobs retain an inbound-to-outbound
              audit trail without storage placement.
            </p>
            <div className="mt-4 space-y-2">
              {data.docks.map((dock) => (
                <div
                  key={dock.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{dock.direction} dock</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(dock.scheduled_start).toLocaleString()}
                    </p>
                  </div>
                  <StatusPill value={dock.status} />
                </div>
              ))}
              {data.crossDock.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3"
                >
                  <span className="text-sm">Cross-dock transfer</span>
                  <StatusPill value={job.status} />
                </div>
              ))}
              {data.docks.length + data.crossDock.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No dock or cross-dock activity is scheduled.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "transfers" ? (
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold">Inventory transfers</h2>
            <p className="text-sm text-muted-foreground">
              Warehouse, bin, zone, emergency, and cross-dock transfers are company-scoped and
              append immutable movement audit events.
            </p>
          </div>
          <div className="divide-y">
            {data.transfers.map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium capitalize">
                    {transfer.transfer_type} transfer
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {number(transfer.quantity)} units ·{" "}
                    {new Date(transfer.created_at).toLocaleString()}
                  </p>
                </div>
                <StatusPill value={transfer.status} />
              </div>
            ))}
            {data.transfers.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No inventory transfers have been created.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {tab === "counts" ? (
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold">Cycle counts & inventory accuracy</h2>
            <p className="text-sm text-muted-foreground">
              Scheduled, random, and spot counts calculate variance. Stock adjustments require
              supervisor approval and remain audit logged.
            </p>
          </div>
          <div className="divide-y">
            {data.counts.map((count) => (
              <div key={count.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium capitalize">{count.count_type} count</p>
                  <p className="text-xs text-muted-foreground">
                    {count.scheduled_for
                      ? new Date(count.scheduled_for).toLocaleString()
                      : "Unscheduled"}
                  </p>
                </div>
                <StatusPill value={count.status} />
              </div>
            ))}
            {data.counts.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No cycle counts have been scheduled.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {tab === "equipment" ? (
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-semibold">Warehouse equipment</h2>
            <p className="text-sm text-muted-foreground">
              Forklifts, pallet jacks, reach trucks, scanners, tablets, and dock equipment track
              assignment and maintenance status.
            </p>
          </div>
          <div className="divide-y">
            {data.equipment.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{item.asset_tag}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.equipment_type?.replaceAll("_", " ")} ·{" "}
                    {item.next_maintenance_at
                      ? `Maintenance ${new Date(item.next_maintenance_at).toLocaleDateString()}`
                      : "No maintenance date"}
                  </p>
                </div>
                <StatusPill value={item.maintenance_status} />
              </div>
            ))}
            {data.equipment.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No warehouse equipment is registered.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        RFID and camera scanning are explicitly planned capabilities. Manual identifier lookup is
        operational and recorded; no automated or AI-generated warehouse decisions are used.
      </p>
    </div>
  );
}
