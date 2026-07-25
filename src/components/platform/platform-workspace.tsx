import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Box, Cpu, Factory, Radio, ShieldCheck, Smartphone, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/operational-state";
import { StatusBadge } from "@/components/ui/status-badge-detailed";

type Row = Record<string, unknown>;
type Result<T> = PromiseLike<{ data: T | null; error: Error | null }>;
type Mutation = PlatformTable & Result<Row>;
interface PlatformTable {
  select: (columns?: string) => PlatformTable;
  eq: (column: string, value: unknown) => Mutation;
  order: (column: string, options?: { ascending?: boolean }) => PlatformTable;
  limit: (count: number) => Result<Row[]>;
  insert: (values: Row) => Mutation;
  single: () => Result<Row>;
}
interface PlatformDb {
  from: (table: string) => PlatformTable;
}
interface PlatformRpc {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: Error | null }>;
}

const TABS = [
  "Overview",
  "Devices",
  "Twins & telemetry",
  "Mobile & portal",
  "Partners & marketplace",
  "Billing & tenants",
  "Manufacturing",
  "Edge & pilots",
] as const;
type Tab = (typeof TABS)[number];
const DEVICE_MANAGER_ROLES = [
  "admin",
  "system_administrator",
  "technical_administrator",
  "integration_manager",
  "brain_administrator",
  "fleet_manager",
  "warehouse_manager",
  "warehouse_supervisor",
  "operations_manager",
  "supervisor",
  "quality_manager",
];
const INTERNAL_ROLES = [
  ...DEVICE_MANAGER_ROLES,
  "finance_manager",
  "finance_officer",
  "executive",
  "managing_director",
  "analyst",
  "viewer",
  "procurement_manager",
  "compliance_manager",
];

const db = () => supabase as unknown as PlatformDb;
const rpc = () => supabase as unknown as PlatformRpc;
const value = (item: unknown) => (typeof item === "string" ? item : "—");
const words = (item: string) =>
  item.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const timestamp = (item: unknown) =>
  typeof item === "string" ? new Date(item).toLocaleString() : "—";

export function PlatformWorkspace({
  companyId,
  roles,
}: {
  companyId: string;
  roles: readonly string[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<Record<string, Row[]>>({});
  const [serialNumber, setSerialNumber] = useState("");
  const [modelId, setModelId] = useState("");
  const [provisionId, setProvisionId] = useState<string | null>(null);
  const [certificateReference, setCertificateReference] = useState("");
  const [identityReference, setIdentityReference] = useState("");
  const [tokenHash, setTokenHash] = useState("");
  const denied =
    roles.includes("driver") ||
    roles.includes("customer") ||
    (roles.includes("employee") &&
      !roles.some((role) => role.startsWith("brain_") || role === "admin"));
  const canRead = !denied && roles.some((role) => INTERNAL_ROLES.includes(role));
  const canManageDevices = !denied && roles.some((role) => DEVICE_MANAGER_ROLES.includes(role));

  const load = useCallback(async () => {
    if (!companyId || !canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const companyTables = [
        "platform_tenant_settings",
        "platform_feature_licenses",
        "platform_devices",
        "platform_device_groups",
        "platform_firmware_rollouts",
        "platform_device_health_snapshots",
        "platform_telemetry_events",
        "platform_digital_twins",
        "platform_mobile_installations",
        "platform_partner_applications",
        "platform_partner_subscriptions",
        "platform_plugin_installations",
        "platform_subscriptions",
        "platform_billing_statements",
        "platform_pilot_projects",
        "platform_pilot_installations",
        "platform_pilot_feedback",
        "platform_edge_profiles",
        "platform_edge_sync_states",
      ];
      const [
        companyResults,
        modelResult,
        firmwareResult,
        mobileResult,
        marketplaceResult,
        planResult,
        bomResult,
        batchResult,
      ] = await Promise.all([
        Promise.all(
          companyTables.map((table) =>
            db()
              .from(table)
              .select("*")
              .eq("company_id", companyId)
              .order("created_at", { ascending: false })
              .limit(100),
          ),
        ),
        db()
          .from("platform_device_models")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db()
          .from("platform_firmware_releases")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db()
          .from("platform_mobile_app_releases")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db()
          .from("platform_marketplace_plugins")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db()
          .from("platform_billing_plans")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db()
          .from("platform_bom_revisions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db()
          .from("platform_manufacturing_batches")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      const next: Record<string, Row[]> = {};
      companyResults.forEach((result, index) => {
        if (result.error) throw result.error;
        next[companyTables[index]] = result.data ?? [];
      });
      const globals: Array<[string, { data: Row[] | null; error: Error | null }]> = [
        ["platform_device_models", modelResult],
        ["platform_firmware_releases", firmwareResult],
        ["platform_mobile_app_releases", mobileResult],
        ["platform_marketplace_plugins", marketplaceResult],
        ["platform_billing_plans", planResult],
        ["platform_bom_revisions", bomResult],
        ["platform_manufacturing_batches", batchResult],
      ];
      globals.forEach(([name, result]) => {
        if (result.error) throw result.error;
        next[name] = result.data ?? [];
      });
      setRecords(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Zapp Platform records.");
    } finally {
      setLoading(false);
    }
  }, [canRead, companyId]);
  useEffect(() => {
    void load();
  }, [load]);

  const models = records.platform_device_models ?? [];
  const devices = records.platform_devices ?? [];
  const selectedModel = models.find((model) => value(model.id) === modelId) ?? null;
  const healthByDevice = useMemo(
    () =>
      new Map(
        (records.platform_device_health_snapshots ?? []).map((health) => [
          value(health.device_id),
          health,
        ]),
      ),
    [records.platform_device_health_snapshots],
  );

  const registerDevice = async () => {
    if (!serialNumber.trim() || !selectedModel) {
      setError("Choose an approved device model and enter its physical serial number.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { error: insertError } = await db().from("platform_devices").insert({
        company_id: companyId,
        device_model_id: selectedModel.id,
        serial_number: serialNumber.trim(),
        device_kind: selectedModel.device_kind,
        status: "inventory",
      });
      if (insertError) throw insertError;
      setSerialNumber("");
      setModelId("");
      setNotice(
        "Device registered as inventory. It cannot send telemetry until secure provisioning is completed.",
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not register device.");
    } finally {
      setSaving(false);
    }
  };
  const provisionDevice = async () => {
    if (!provisionId || !certificateReference || !identityReference || tokenHash.length < 16) {
      setError(
        "Certificate reference, identity reference, and a 16+ character token hash are required. Do not paste a raw secret.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: provisionError } = await rpc().rpc("platform_start_device_provisioning", {
        _company_id: companyId,
        _device_id: provisionId,
        _certificate_reference: certificateReference,
        _identity_reference: identityReference,
        _token_hash: tokenHash,
      });
      if (provisionError) throw provisionError;
      setProvisionId(null);
      setCertificateReference("");
      setIdentityReference("");
      setTokenHash("");
      setNotice(
        "Provisioning identity recorded. Device activation requires the controlled device service and certificate validation.",
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not begin secure provisioning.");
    } finally {
      setSaving(false);
    }
  };

  if (!canRead)
    return (
      <ErrorState
        title="Platform access is restricted"
        description="Drivers, customers, and ordinary employees cannot access internal device, tenant, partner, billing, or manufacturing controls."
      />
    );
  if (loading) return <LoadingState label="Loading Zapp Platform ecosystem" />;
  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Governed multi-product platform</p>
            <p className="text-sm text-muted-foreground">
              ZappOS remains the operational system of record. Device commands are
              diagnostics/configuration only; predictive and edge intelligence stay advisory.
            </p>
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={tab === item ? "default" : "outline"}
            onClick={() => setTab(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      {error ? <ErrorState title="Platform action unavailable" description={error} /> : null}
      {notice ? (
        <Card className="border-emerald-500/30 p-3 text-sm text-muted-foreground">{notice}</Card>
      ) : null}
      {tab === "Overview" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Cpu}
            label="Connected devices"
            value={String(devices.filter((device) => device.status === "active").length)}
            note="Only activated devices are counted"
          />
          <Metric
            icon={Radio}
            label="Telemetry events"
            value={String((records.platform_telemetry_events ?? []).length)}
            note="Received through governed ingestion"
          />
          <Metric
            icon={Box}
            label="Digital twins"
            value={String((records.platform_digital_twins ?? []).length)}
            note="Current state and history are separated"
          />
          <Metric
            icon={Users}
            label="Pilot projects"
            value={String((records.platform_pilot_projects ?? []).length)}
            note="No fabricated pilot metrics"
          />
          <Card className="p-5 md:col-span-2 xl:col-span-4">
            <h2 className="font-semibold">Platform services</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lightstream is the declared compression mode for telemetry. The existing Phase 22
              Event Bus receives accepted/correlated device telemetry; ZIP consumes authorised
              evidence rather than device internals.
            </p>
          </Card>
        </section>
      ) : null}
      {tab === "Devices" ? (
        <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
          <Card className="p-5">
            <h2 className="font-semibold">Device registry</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Zapp Box P1, home, pocket, mesh, CPE, and future industrial devices use immutable
              serial identities and referenced credentials.
            </p>
            {canManageDevices ? (
              <div className="mt-4 space-y-3">
                <select
                  value={modelId}
                  onChange={(event) => setModelId(event.target.value)}
                  aria-label="Device model"
                  className="h-9 w-full rounded-md border bg-background px-2"
                >
                  <option value="">Select an approved model</option>
                  {models
                    .filter((model) => model.status === "approved")
                    .map((model) => (
                      <option key={value(model.id)} value={value(model.id)}>
                        {value(model.model_code)} · {words(value(model.device_kind))}
                      </option>
                    ))}
                </select>
                <input
                  value={serialNumber}
                  onChange={(event) => setSerialNumber(event.target.value)}
                  placeholder="Physical serial number"
                  className="h-9 w-full rounded-md border bg-background px-2"
                />
                <Button disabled={saving || !selectedModel} onClick={() => void registerDevice()}>
                  Register inventory device
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Your role can view devices but cannot register or provision them.
              </p>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Secure provisioning</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only references and token hashes are stored. Raw certificates, private keys, and
              provisioning secrets never enter the browser or database.
            </p>
            {provisionId ? (
              <div className="mt-4 space-y-3">
                <input
                  value={certificateReference}
                  onChange={(event) => setCertificateReference(event.target.value)}
                  placeholder="Certificate reference (vault: …)"
                  className="h-9 w-full rounded-md border bg-background px-2"
                />
                <input
                  value={identityReference}
                  onChange={(event) => setIdentityReference(event.target.value)}
                  placeholder="Identity key reference (kms: …)"
                  className="h-9 w-full rounded-md border bg-background px-2"
                />
                <input
                  value={tokenHash}
                  onChange={(event) => setTokenHash(event.target.value)}
                  placeholder="Provisioning token hash—not the token"
                  className="h-9 w-full rounded-md border bg-background px-2"
                />
                <div className="flex gap-2">
                  <Button disabled={saving} onClick={() => void provisionDevice()}>
                    Begin provisioning
                  </Button>
                  <Button variant="outline" onClick={() => setProvisionId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Choose an inventory device below to begin the audited provisioning flow.
              </p>
            )}
          </Card>
          <Card className="p-3 lg:col-span-2">
            <DeviceRows
              devices={devices}
              healthByDevice={healthByDevice}
              canManage={canManageDevices}
              onProvision={setProvisionId}
            />
          </Card>
        </section>
      ) : null}
      {tab === "Twins & telemetry" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Rows
            title="Digital twins"
            rows={records.platform_digital_twins ?? []}
            fields={["twin_type", "health_state", "firmware_version", "last_telemetry_at"]}
            empty="No digital twin exists until a connected asset is registered and synchronised."
          />
          <Rows
            title="Telemetry timeline"
            rows={records.platform_telemetry_events ?? []}
            fields={[
              "transport",
              "observed_at",
              "sequence_number",
              "processing_state",
              "compression_type",
            ]}
            empty="No telemetry has been received. Devices cannot write directly to operational tables."
          />
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-semibold">Twin safety</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              State deltas, history, configuration, health, firmware, relationships, and maintenance
              advisories are stored separately. Forecasts are evidence-led and require human action
              in the owning module.
            </p>
          </Card>
        </section>
      ) : null}
      {tab === "Mobile & portal" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Rows
            title="Mobile app releases"
            rows={records.platform_mobile_app_releases ?? []}
            fields={["app_code", "platform", "version", "status"]}
            empty="No native/PWA release has been registered."
          />
          <Rows
            title="Secure mobile installations"
            rows={records.platform_mobile_installations ?? []}
            fields={["device_platform", "offline_sync_state", "last_sync_at"]}
            empty="No application installation has been enrolled."
          />
          <Card className="p-5 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <Smartphone className="h-5 w-5" />
              Customer portal separation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer mobile/portal users remain in the existing customer portal boundary. They do
              not receive direct access to platform devices, twins, provider credentials, billing
              controls, or internal ZIP records.
            </p>
          </Card>
        </section>
      ) : null}
      {tab === "Partners & marketplace" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Rows
            title="Partner applications"
            rows={records.platform_partner_applications ?? []}
            fields={["name", "partner_name", "status", "rate_limit_per_minute"]}
            empty="No partner application has been approved."
          />
          <Rows
            title="Marketplace plugins"
            rows={records.platform_marketplace_plugins ?? []}
            fields={["plugin_code", "name", "category", "status"]}
            empty="No plugin is published."
          />
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-semibold">Integration boundary</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Partner APIs, OAuth references, scoped API keys, webhooks, usage limits, and
              subscriptions extend the existing Phase 22 Integration Platform. No independent event
              bus or direct database access is introduced.
            </p>
          </Card>
        </section>
      ) : null}
      {tab === "Billing & tenants" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Rows
            title="Tenant configuration"
            rows={records.platform_tenant_settings ?? []}
            fields={["tenant_status", "region_code", "data_residency_region"]}
            empty="Tenant provisioning has not been recorded."
          />
          <Rows
            title="Feature licensing"
            rows={records.platform_feature_licenses ?? []}
            fields={["feature_code", "status", "starts_at", "expires_at"]}
            empty="No feature licenses have been configured."
          />
          <Rows
            title="Subscriptions"
            rows={records.platform_subscriptions ?? []}
            fields={["status", "started_at", "trial_ends_at"]}
            empty="No subscription exists."
          />
          <Rows
            title="Billing statements"
            rows={records.platform_billing_statements ?? []}
            fields={["status", "period_start", "period_end", "external_invoice_reference"]}
            empty="No statement exists. This screen never fabricates an invoice or download."
          />
        </section>
      ) : null}
      {tab === "Manufacturing" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Rows
            title="BOM revisions"
            rows={records.platform_bom_revisions ?? []}
            fields={["product_code", "revision", "status"]}
            empty="No BOM revision is registered."
          />
          <Rows
            title="Manufacturing batches"
            rows={records.platform_manufacturing_batches ?? []}
            fields={["batch_code", "product_code", "status", "quantity_planned", "quantity_passed"]}
            empty="No manufacturing batch is registered."
          />
          <Card className="p-5 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <Factory className="h-5 w-5" />
              Production traceability
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              BOM, PCB revisions, batches, serialisation, QA, warranty and RMA records provide
              hardware traceability for Zapp Box, routers, UPS units, and future equipment.
            </p>
          </Card>
        </section>
      ) : null}
      {tab === "Edge & pilots" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Rows
            title="Edge profiles"
            rows={records.platform_edge_profiles ?? []}
            fields={["profile_name", "compression_policy", "status"]}
            empty="No edge profile has been approved."
          />
          <Rows
            title="Pilot projects"
            rows={records.platform_pilot_projects ?? []}
            fields={["name", "status", "created_at"]}
            empty="No pilot project has been created."
          />
          <Rows
            title="Pilot installations"
            rows={records.platform_pilot_installations ?? []}
            fields={["status", "installed_at", "accepted_at"]}
            empty="No pilot installation has been scheduled."
          />
          <Card className="p-5">
            <h2 className="font-semibold">Offline resilience</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edge profiles allow local alerts, Lightstream compression, cached recommendations and
              store-and-forward sync. Rules cannot dispatch, approve, pay, unlock, or otherwise
              execute a business decision.
            </p>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value: metricValue,
  note,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{metricValue}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </Card>
  );
}
function Rows({
  title,
  rows,
  fields,
  empty,
}: {
  title: string;
  rows: Row[];
  fields: string[];
  empty: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.slice(0, 20).map((row) => (
          <div key={value(row.id)} className="grid gap-2 rounded border p-3 sm:grid-cols-3">
            {fields.map((field) => (
              <div key={field} className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground">{words(field)}</p>
                <p className="truncate text-sm">
                  {field.endsWith("_at") ? timestamp(row[field]) : String(row[field] ?? "—")}
                </p>
              </div>
            ))}
          </div>
        ))}
        {rows.length === 0 ? <EmptyState title="Nothing to show" description={empty} /> : null}
      </div>
    </Card>
  );
}
function DeviceRows({
  devices,
  healthByDevice,
  canManage,
  onProvision,
}: {
  devices: Row[];
  healthByDevice: Map<string, Row>;
  canManage: boolean;
  onProvision: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="px-2 pt-2 font-semibold">Registered devices</h2>
      <div className="mt-3 space-y-2">
        {devices.map((device) => {
          const health = healthByDevice.get(value(device.id));
          return (
            <div
              key={value(device.id)}
              className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
            >
              <div>
                <p className="font-medium">{value(device.serial_number)}</p>
                <p className="text-xs text-muted-foreground">
                  {words(value(device.device_kind))} · last seen {timestamp(device.last_seen_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={value(device.status)} />
                <span className="text-xs text-muted-foreground">
                  {health
                    ? `${value(health.health_state)} · ${value(health.health_score)}`
                    : "No health sample"}
                </span>
                {canManage && device.status === "inventory" ? (
                  <Button size="sm" variant="outline" onClick={() => onProvision(value(device.id))}>
                    Provision
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
        {devices.length === 0 ? (
          <EmptyState
            title="No devices"
            description="Register an approved model with its physical serial number before provisioning."
          />
        ) : null}
      </div>
    </div>
  );
}
