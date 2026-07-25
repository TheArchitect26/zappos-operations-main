/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingCart, Truck, ReceiptText, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/operational-state";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { procurementCapabilities } from "@/lib/procurement/phase20";
export const Route = createFileRoute("/_authenticated/procurement")({
  component: ProcurementPage,
  head: () => ({ meta: [{ title: "Procurement — ZappOS" }] }),
});
function ProcurementPage() {
  const { activeCompany, roles } = useCompany();
  const [data, setData] = useState<any>({
    suppliers: [],
    requests: [],
    orders: [],
    receipts: [],
    invoices: [],
    contracts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cap = useMemo(() => procurementCapabilities(roles), [roles]);
  const load = useCallback(async () => {
    if (!activeCompany) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = activeCompany.id;
    const r = await Promise.all(
      [
        "proc_suppliers",
        "proc_purchase_requests",
        "proc_purchase_orders",
        "proc_receipts",
        "proc_supplier_invoices",
        "proc_supplier_contracts",
      ].map((t) => (supabase as any).from(t).select("*").eq("company_id", id).limit(200)),
    );
    const bad = r.find((x) => x.error);
    if (bad) {
      setError(bad.error.message);
    } else
      setData({
        suppliers: r[0].data ?? [],
        requests: r[1].data ?? [],
        orders: r[2].data ?? [],
        receipts: r[3].data ?? [],
        invoices: r[4].data ?? [],
        contracts: r[5].data ?? [],
      });
    setLoading(false);
  }, [activeCompany]);
  useEffect(() => {
    void load();
  }, [load]);
  if (loading)
    return (
      <div className="mx-auto max-w-7xl p-6">
        <LoadingState label="Loading procurement" />
      </div>
    );
  if (!cap.canRead)
    return (
      <div className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="Procurement access is restricted"
          description="Drivers and customers cannot access purchasing."
        />
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-7xl p-6">
        <ErrorState
          title="Could not load procurement"
          description={error}
          onAction={() => void load()}
        />
      </div>
    );
  const spend = data.orders
    .filter((o: any) => !["rejected", "cancelled"].includes(o.status))
    .reduce((n: number, o: any) => n + Number(o.total_amount || 0), 0);
  const metrics = [
    [
      "Open requests",
      data.requests.filter((x: any) => !["converted", "rejected", "cancelled"].includes(x.status))
        .length,
      ShoppingCart,
    ],
    [
      "Awaiting approval",
      data.orders.filter((x: any) => x.status === "submitted").length,
      ReceiptText,
    ],
    [
      "Outstanding deliveries",
      data.orders.filter((x: any) => ["ordered", "partially_received"].includes(x.status)).length,
      Truck,
    ],
    ["Suppliers", data.suppliers.filter((x: any) => x.status === "active").length, UsersRound],
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Procurement & suppliers</p>
          <h1 className="text-2xl font-semibold">Purchasing control</h1>
          <p className="text-sm text-muted-foreground">
            Supplier onboarding, requests, approvals, orders, receipts and invoice metadata.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([l, v, I]: any) => (
          <Card key={l} className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{l}</p>
                <p className="mt-2 text-2xl font-semibold">{v}</p>
              </div>
              <I className="h-5 w-5 text-primary" />
            </div>
          </Card>
        ))}
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Procurement spend</p>
          <p className="mt-2 text-2xl font-semibold">R {spend.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Outstanding invoices</p>
          <p className="mt-2 text-2xl font-semibold">
            {data.invoices.filter((x: any) => x.status === "outstanding").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Contract expiry</p>
          <p className="mt-2 text-2xl font-semibold">
            {
              data.contracts.filter(
                (x: any) =>
                  x.expires_on && new Date(x.expires_on) < new Date(Date.now() + 30 * 864e5),
              ).length
            }
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Receipts</p>
          <p className="mt-2 text-2xl font-semibold">{data.receipts.length}</p>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Purchase orders</h2>
          <div className="mt-3 space-y-2">
            {data.orders.slice(0, 8).map((o: any) => (
              <div key={o.id} className="flex justify-between rounded border p-3">
                <span>{o.order_number}</span>
                <span className="capitalize">{o.status.replaceAll("_", " ")}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Supplier management</h2>
          <div className="mt-3 space-y-2">
            {data.suppliers.slice(0, 8).map((s: any) => (
              <div key={s.id} className="flex justify-between rounded border p-3">
                <span>{s.name}</span>
                <span className="capitalize">{s.status.replaceAll("_", " ")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
