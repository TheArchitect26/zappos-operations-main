/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { useSession } from "@/lib/session";
import {
  CONNECTOR_CATALOGUE,
  importValid,
  integrationCapabilities,
  mappingValid,
} from "@/lib/integrations/phase22";

export const Route = createFileRoute("/_authenticated/integrations")({ component: Integrations });
type Row = { id: string; [key: string]: any };
type Data = Record<string, Row[]>;
const sources = [
  ["registry", "integration_registry"],
  ["connections", "integration_connections"],
  ["health", "integration_health"],
  ["apis", "integration_api_catalogue"],
  ["keys", "integration_api_keys"],
  ["webhooks", "integration_webhook_endpoints"],
  ["deliveries", "integration_webhook_deliveries"],
  ["events", "integration_event_bus"],
  ["sync", "integration_sync_jobs"],
  ["retry", "integration_retry_queue"],
  ["dlq", "integration_dead_letter_queue"],
  ["mappings", "integration_field_mappings"],
  ["imports", "integration_import_jobs"],
  ["exports", "integration_export_jobs"],
  ["alerts", "integration_alerts"],
] as const;
const blank = () => Object.fromEntries(sources.map(([key]) => [key, []])) as Data;
const words = (value: string) => value.replaceAll("_", " ");
const secureRef = (value: string) => /^(vault|kms|secret-manager|keychain|external):/.test(value);

function Integrations() {
  const { activeCompany, roles } = useCompany();
  const { user } = useSession();
  const caps = integrationCapabilities(roles);
  const [data, setData] = useState<Data>(blank);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [registry, setRegistry] = useState({
    name: "",
    vendor: "",
    type: "custom",
    auth: "api_key",
  });
  const [connection, setConnection] = useState({
    integrationId: "",
    auth: "api_key",
    reference: "",
  });
  const [api, setApi] = useState({
    name: "",
    endpoint: "",
    version: "v1",
    exposure: "internal",
    auth: "api_key",
  });
  const [key, setKey] = useState({ name: "", prefix: "", reference: "", scopes: "" });
  const [webhook, setWebhook] = useState({
    integrationId: "",
    direction: "outbound",
    url: "",
    event: "",
  });
  const [mapping, setMapping] = useState({
    integrationId: "",
    sourceEntity: "",
    destinationEntity: "",
    sourceField: "",
    destinationField: "",
    transform: "direct",
    defaultValue: "",
  });
  const [importForm, setImportForm] = useState({ entity: "customers", format: "csv" });
  const [exportForm, setExportForm] = useState({ domain: "fleet", format: "csv" });
  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    setError(null);
    const results = await Promise.all(
      sources.map(async ([key, table]) => ({
        key,
        ...(await (supabase as any)
          .from(table)
          .select("*")
          .eq("company_id", activeCompany.id)
          .limit(200)),
      })),
    );
    const failed = results.find((x) => x.error);
    if (failed?.error) setError(failed.error.message);
    else setData(Object.fromEntries(results.map((x) => [x.key, x.data ?? []])));
    setLoading(false);
  }, [activeCompany]);
  useEffect(() => {
    void load();
  }, [load]);
  const write = async (
    operation: () => Promise<{ error: { message: string } | null }>,
    success: string,
  ) => {
    const result = await operation();
    if (result.error) setNotice(result.error.message);
    else {
      setNotice(success);
      await load();
    }
  };
  if (!caps.canRead)
    return (
      <div className="p-6">
        <ErrorState
          title="Integration access denied"
          description="Drivers, ordinary employees and customer portal users cannot access the integration platform."
        />
      </div>
    );
  if (loading)
    return (
      <div className="p-6">
        <LoadingState label="Loading integration platform" />
      </div>
    );
  if (error)
    return (
      <div className="p-6">
        <ErrorState
          title="Could not load integrations"
          description={error}
          onAction={() => void load()}
        />
      </div>
    );
  const createRegistry = () => {
    if (!activeCompany || !user || !registry.name || !registry.vendor)
      return setNotice("Integration name and vendor are required.");
    void write(
      () =>
        (supabase as any).from("integration_registry").insert({
          company_id: activeCompany.id,
          name: registry.name,
          vendor: registry.vendor,
          integration_type: registry.type,
          authentication_type: registry.auth,
          owner_id: user.id,
          status: registry.auth === "none" ? "configured" : "awaiting_authentication",
        }),
      "Integration registered. It is not connected until a real connection succeeds.",
    );
  };
  const createConnection = () => {
    if (!activeCompany || !connection.integrationId || !secureRef(connection.reference))
      return setNotice(
        "Select an integration and use a secure reference such as vault:provider/key; plaintext secrets are rejected.",
      );
    void write(
      () =>
        (supabase as any).from("integration_connections").insert({
          company_id: activeCompany.id,
          integration_id: connection.integrationId,
          authentication_type: connection.auth,
          secret_reference: connection.reference,
          status: "awaiting_authentication",
        }),
      "Authentication metadata saved. No credentials or live connection were fabricated.",
    );
  };
  const createKey = () => {
    if (!activeCompany || !user || !key.name || !key.prefix || !secureRef(key.reference))
      return setNotice("Name, non-secret prefix and secure secret reference are required.");
    void write(
      () =>
        (supabase as any).from("integration_api_keys").insert({
          company_id: activeCompany.id,
          name: key.name,
          key_prefix: key.prefix,
          secret_reference: key.reference,
          owner_id: user.id,
          scopes: key.scopes
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      "API key metadata created. The secret value is never displayed or stored in the workspace.",
    );
  };
  const createWebhook = () => {
    if (!activeCompany || !webhook.url || !webhook.event)
      return setNotice("Webhook URL and event are required.");
    void write(
      () =>
        (supabase as any).from("integration_webhook_endpoints").insert({
          company_id: activeCompany.id,
          integration_id: webhook.integrationId || null,
          direction: webhook.direction,
          url: webhook.url,
          event_type: webhook.event,
        }),
      "Webhook endpoint configured. Delivery stays queued until an actual event is delivered.",
    );
  };
  const createMapping = () => {
    if (
      !activeCompany ||
      !mapping.integrationId ||
      !mappingValid({
        sourceField: mapping.sourceField,
        destinationField: mapping.destinationField,
        transform: mapping.transform,
        required: false,
        defaultValue: mapping.defaultValue,
      })
    )
      return setNotice("Mapping requires approved fields and a supported deterministic transform.");
    void write(
      () =>
        (supabase as any).from("integration_field_mappings").insert({
          company_id: activeCompany.id,
          integration_id: mapping.integrationId,
          source_entity: mapping.sourceEntity,
          destination_entity: mapping.destinationEntity,
          source_field: mapping.sourceField || null,
          destination_field: mapping.destinationField,
          transform_type: mapping.transform,
          default_value: mapping.defaultValue || null,
        }),
      "Deterministic field mapping saved.",
    );
  };
  const queueSync = (registryRow: Row) =>
    activeCompany &&
    user &&
    void write(
      () =>
        (supabase as any).from("integration_sync_jobs").insert({
          company_id: activeCompany.id,
          integration_id: registryRow.id,
          source_name: "ZappOS",
          destination_name: registryRow.name,
          trigger_type: "manual",
          status: "queued",
          created_by: user.id,
        }),
      "Sync queued. It will not be shown as synchronised until a worker records success.",
    );
  const queueImport = () => {
    if (!activeCompany || !user || !importValid(importForm.entity, importForm.format))
      return setNotice("Choose a supported import entity and format.");
    void write(
      () =>
        (supabase as any).from("integration_import_jobs").insert({
          company_id: activeCompany.id,
          entity_type: importForm.entity,
          format: importForm.format,
          status: "queued",
          requested_by: user.id,
        }),
      "Import validation job queued; no records were fabricated.",
    );
  };
  const queueExport = () => {
    if (!activeCompany || !user) return;
    void write(
      () =>
        (supabase as any).from("integration_export_jobs").insert({
          company_id: activeCompany.id,
          domain: exportForm.domain,
          format: exportForm.format,
          status: "requested",
          requested_by: user.id,
        }),
      "Export requested. No completed file is claimed until delivery metadata is verified.",
    );
  };
  return (
    <main className="mx-auto max-w-7xl space-y-5 p-6">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Integration platform</p>
          <h1 className="text-2xl font-semibold">External connectivity</h1>
          <p className="text-sm text-muted-foreground">
            Connector metadata, deterministic queues and secure references only.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      {notice && <div className="rounded border p-3 text-sm">{notice}</div>}
      <div className="flex gap-2 overflow-x-auto">
        {[
          ["dashboard", "Dashboard"],
          ["registry", "Registry"],
          ["api", "APIs & keys"],
          ["webhooks", "Webhooks & events"],
          ["jobs", "Jobs & queues"],
          ["mapping", "Mappings & files"],
          ["health", "Health & developer portal"],
        ].map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "dashboard" && <Dashboard data={data} />}{" "}
      {tab === "registry" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Integration registry</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Adapters are foundations, not live vendor claims.
            </p>
            {caps.canManage && (
              <div className="space-y-2">
                <Input
                  placeholder="Integration name"
                  value={registry.name}
                  onChange={(e) => setRegistry({ ...registry, name: e.target.value })}
                />
                <select
                  className="w-full rounded border bg-background p-2"
                  value={registry.vendor}
                  onChange={(e) => setRegistry({ ...registry, vendor: e.target.value })}
                >
                  <option value="">Select supported connector</option>
                  {CONNECTOR_CATALOGUE.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select
                  className="w-full rounded border bg-background p-2"
                  value={registry.type}
                  onChange={(e) => setRegistry({ ...registry, type: e.target.value })}
                >
                  {[
                    "telematics",
                    "erp",
                    "accounting",
                    "crm",
                    "wms",
                    "cloud_storage",
                    "email",
                    "sms",
                    "identity",
                    "iot",
                    "file_import",
                    "file_export",
                    "custom",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select
                  className="w-full rounded border bg-background p-2"
                  value={registry.auth}
                  onChange={(e) => setRegistry({ ...registry, auth: e.target.value })}
                >
                  {["api_key", "oauth2", "client_credentials", "service_account", "none"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
                <Button onClick={createRegistry}>Register integration</Button>
              </div>
            )}
            <Rows
              rows={data.registry}
              fields={["name", "vendor", "integration_type", "status", "updated_at"]}
              action={caps.canManage ? queueSync : undefined}
              actionLabel="Queue sync"
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Authentication metadata</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Only secure secret references are accepted. Awaiting authentication is truthful.
            </p>
            {caps.canManage && (
              <div className="space-y-2">
                <IntegrationSelect
                  rows={data.registry}
                  value={connection.integrationId}
                  onChange={(x) => setConnection({ ...connection, integrationId: x })}
                />
                <select
                  className="w-full rounded border bg-background p-2"
                  value={connection.auth}
                  onChange={(e) => setConnection({ ...connection, auth: e.target.value })}
                >
                  {["api_key", "oauth2", "client_credentials", "service_account"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <Input
                  placeholder="vault:provider/secret-reference"
                  value={connection.reference}
                  onChange={(e) => setConnection({ ...connection, reference: e.target.value })}
                />
                <Button onClick={createConnection}>Save auth metadata</Button>
              </div>
            )}
            <Rows
              rows={data.connections}
              fields={[
                "authentication_type",
                "status",
                "token_expires_at",
                "last_successful_sync_at",
              ]}
            />
          </Card>
        </section>
      )}
      {tab === "api" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">API gateway catalogue</h2>
            {caps.canDevelop && (
              <div className="my-3 space-y-2">
                <Input
                  placeholder="API name"
                  value={api.name}
                  onChange={(e) => setApi({ ...api, name: e.target.value })}
                />
                <Input
                  placeholder="/v1/example"
                  value={api.endpoint}
                  onChange={(e) => setApi({ ...api, endpoint: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Version"
                    value={api.version}
                    onChange={(e) => setApi({ ...api, version: e.target.value })}
                  />
                  <select
                    className="rounded border bg-background p-2"
                    value={api.exposure}
                    onChange={(e) => setApi({ ...api, exposure: e.target.value })}
                  >
                    {["internal", "external", "public", "service"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => {
                    if (!activeCompany || !user || !api.name || !api.endpoint)
                      return setNotice("API name and endpoint required.");
                    void write(
                      () =>
                        (supabase as any).from("integration_api_catalogue").insert({
                          company_id: activeCompany.id,
                          name: api.name,
                          endpoint: api.endpoint,
                          version: api.version,
                          exposure: api.exposure,
                          owner_id: user.id,
                          authentication_type: api.auth,
                        }),
                      "API catalogue metadata saved.",
                    );
                  }}
                >
                  Add endpoint metadata
                </Button>
              </div>
            )}
            <Rows
              rows={data.apis}
              fields={["name", "endpoint", "version", "exposure", "status", "documentation_url"]}
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">API-key metadata</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Key values are never rendered after creation.
            </p>
            {caps.canDevelop && (
              <div className="space-y-2">
                <Input
                  placeholder="Key name"
                  value={key.name}
                  onChange={(e) => setKey({ ...key, name: e.target.value })}
                />
                <Input
                  placeholder="Visible prefix only"
                  value={key.prefix}
                  onChange={(e) => setKey({ ...key, prefix: e.target.value })}
                />
                <Input
                  placeholder="vault:provider/key"
                  value={key.reference}
                  onChange={(e) => setKey({ ...key, reference: e.target.value })}
                />
                <Input
                  placeholder="Scopes, comma-separated"
                  value={key.scopes}
                  onChange={(e) => setKey({ ...key, scopes: e.target.value })}
                />
                <Button onClick={createKey}>Create key metadata</Button>
              </div>
            )}
            <Rows
              rows={data.keys}
              fields={["name", "key_prefix", "status", "expires_at", "last_used_at"]}
              action={
                caps.canDevelop
                  ? (row) =>
                      void write(
                        () =>
                          (supabase as any)
                            .from("integration_api_keys")
                            .update({ status: "revoked", revoked_at: new Date().toISOString() })
                            .eq("id", row.id),
                        "API key revoked. Its secret value was never exposed.",
                      )
                  : undefined
              }
              actionLabel="Revoke"
            />
          </Card>
        </section>
      )}
      {tab === "webhooks" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Webhook endpoints</h2>
            {caps.canManage && (
              <div className="my-3 space-y-2">
                <IntegrationSelect
                  rows={data.registry}
                  value={webhook.integrationId}
                  onChange={(x) => setWebhook({ ...webhook, integrationId: x })}
                />
                <select
                  className="w-full rounded border bg-background p-2"
                  value={webhook.direction}
                  onChange={(e) => setWebhook({ ...webhook, direction: e.target.value })}
                >
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
                <Input
                  placeholder="https://authorised.example/webhook"
                  value={webhook.url}
                  onChange={(e) => setWebhook({ ...webhook, url: e.target.value })}
                />
                <Input
                  placeholder="Event type"
                  value={webhook.event}
                  onChange={(e) => setWebhook({ ...webhook, event: e.target.value })}
                />
                <Button onClick={createWebhook}>Configure webhook</Button>
              </div>
            )}
            <Rows
              rows={data.webhooks}
              fields={[
                "direction",
                "url",
                "event_type",
                "status",
                "last_delivery_at",
                "retry_count",
              ]}
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Delivery and event bus</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Queued, delivering, succeeded, failed, retry scheduled and dead-letter states are
              recorded by real processing only.
            </p>
            <Rows
              rows={data.deliveries}
              fields={["event_type", "status", "attempt_count", "last_error", "delivered_at"]}
            />
            <h3 className="mt-4 font-medium">Registered events</h3>
            <Rows
              rows={data.events}
              fields={["event_type", "aggregate_type", "source_module", "occurred_at", "version"]}
            />
          </Card>
        </section>
      )}
      {tab === "jobs" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Sync jobs</h2>
            <Rows
              rows={data.sync}
              fields={[
                "source_name",
                "destination_name",
                "trigger_type",
                "status",
                "records_processed",
                "created_at",
              ]}
            />
            <h3 className="mt-4 font-medium">Retry queue</h3>
            <Rows
              rows={data.retry}
              fields={[
                "source_type",
                "attempt",
                "maximum_attempts",
                "next_retry_at",
                "status",
                "reason",
              ]}
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Dead Letter Queue</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Retries are bounded; exhausted work moves here deterministically.
            </p>
            <Rows
              rows={data.dlq}
              fields={["source_type", "last_error", "resolution", "closed_at", "created_at"]}
            />
            <h3 className="mt-4 font-medium">Export lifecycle</h3>
            <Rows rows={data.exports} fields={["domain", "format", "status", "completed_at"]} />
          </Card>
        </section>
      )}
      {tab === "mapping" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Mapping engine</h2>
            {caps.canManage && (
              <div className="my-3 space-y-2">
                <IntegrationSelect
                  rows={data.registry}
                  value={mapping.integrationId}
                  onChange={(x) => setMapping({ ...mapping, integrationId: x })}
                />
                <Input
                  placeholder="Source entity"
                  value={mapping.sourceEntity}
                  onChange={(e) => setMapping({ ...mapping, sourceEntity: e.target.value })}
                />
                <Input
                  placeholder="Destination entity"
                  value={mapping.destinationEntity}
                  onChange={(e) => setMapping({ ...mapping, destinationEntity: e.target.value })}
                />
                <Input
                  placeholder="Source field"
                  value={mapping.sourceField}
                  onChange={(e) => setMapping({ ...mapping, sourceField: e.target.value })}
                />
                <Input
                  placeholder="Destination field"
                  value={mapping.destinationField}
                  onChange={(e) => setMapping({ ...mapping, destinationField: e.target.value })}
                />
                <select
                  className="w-full rounded border bg-background p-2"
                  value={mapping.transform}
                  onChange={(e) => setMapping({ ...mapping, transform: e.target.value })}
                >
                  {["direct", "lookup", "constant", "format", "concatenate", "split"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <Input
                  placeholder="Default value for constant"
                  value={mapping.defaultValue}
                  onChange={(e) => setMapping({ ...mapping, defaultValue: e.target.value })}
                />
                <Button onClick={createMapping}>Save mapping</Button>
              </div>
            )}
            <Rows
              rows={data.mappings}
              fields={[
                "source_entity",
                "destination_entity",
                "source_field",
                "destination_field",
                "transform_type",
                "version",
              ]}
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Import/export pipelines</h2>
            {caps.canManage && (
              <div className="space-y-2">
                <select
                  className="w-full rounded border bg-background p-2"
                  value={importForm.entity}
                  onChange={(e) => setImportForm({ ...importForm, entity: e.target.value })}
                >
                  {[
                    "customers",
                    "suppliers",
                    "employees",
                    "vehicles",
                    "inventory",
                    "shipments",
                    "purchase_orders",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select
                  className="w-full rounded border bg-background p-2"
                  value={importForm.format}
                  onChange={(e) => setImportForm({ ...importForm, format: e.target.value })}
                >
                  {["csv", "json", "spreadsheet_metadata"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <Button onClick={queueImport}>Queue import validation</Button>
                <select
                  className="w-full rounded border bg-background p-2"
                  value={exportForm.domain}
                  onChange={(e) => setExportForm({ ...exportForm, domain: e.target.value })}
                >
                  {["fleet", "warehouse", "crm", "hr", "compliance", "procurement", "bi"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
                <Button variant="outline" onClick={queueExport}>
                  Request export
                </Button>
              </div>
            )}
            <Rows
              rows={data.imports}
              fields={[
                "entity_type",
                "format",
                "status",
                "imported_count",
                "skipped_count",
                "duplicate_count",
              ]}
            />
          </Card>
        </section>
      )}
      {tab === "health" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Integration health</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Status is company-scoped and timestamped; unavailable is never replaced with an
              estimate.
            </p>
            <Rows rows={data.health} fields={["health_area", "status", "checked_at"]} />
            <h3 className="mt-4 font-medium">Alerts</h3>
            <Rows
              rows={data.alerts}
              fields={["alert_type", "severity", "title", "acknowledged_at", "created_at"]}
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Developer portal foundations</h2>
            <p className="text-sm text-muted-foreground">
              Catalogue metadata below is documentation foundation only: endpoint versions,
              authentication type, rate limit and deprecation notices. No interactive documentation
              is generated.
            </p>
            <Rows
              rows={data.apis}
              fields={[
                "name",
                "endpoint",
                "version",
                "authentication_type",
                "rate_limit_per_minute",
                "deprecation_notice",
              ]}
            />
          </Card>
        </section>
      )}
    </main>
  );
}
function IntegrationSelect({
  rows,
  value,
  onChange,
}: {
  rows: Row[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="w-full rounded border bg-background p-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select integration</option>
      {rows.map((row) => (
        <option key={row.id} value={row.id}>
          {row.name} · {row.status}
        </option>
      ))}
    </select>
  );
}
function Dashboard({ data }: { data: Data }) {
  const metric = (label: string, value: number | string, detail: string) => (
    <Card key={label} className="p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metric(
          "Active integrations",
          data.registry.filter((row) => row.enabled).length,
          "registry · current",
        )}
        {metric(
          "Connected systems",
          data.connections.filter((row) => row.status === "connected").length,
          "connection status · current",
        )}
        {metric(
          "Failed connections",
          data.connections.filter((row) => row.status === "failed").length,
          "connection status · current",
        )}
        {metric(
          "Sync jobs running",
          data.sync.filter((row) => row.status === "running").length,
          "sync jobs · current",
        )}
        {metric(
          "Pending retries",
          data.retry.filter((row) => row.status === "scheduled").length,
          "retry queue · current",
        )}
        {metric(
          "Dead Letter Queue",
          data.dlq.filter((row) => !row.closed_at).length,
          "DLQ · current",
        )}
        {metric(
          "Webhook failures",
          data.deliveries.filter((row) => row.status === "failed").length,
          "deliveries · current",
        )}
        {metric(
          "API errors",
          data.health.filter((row) => row.health_area === "api_errors" && row.status !== "healthy")
            .length,
          "health checks · timestamped",
        )}
        {metric("Webhook deliveries", data.deliveries.length, "deliveries · current")}
        {metric("API requests", "Unavailable", "no verified request telemetry")}
        {metric(
          "Rate-limit status",
          data.health.some((row) => row.health_area === "rate_limits" && row.status !== "healthy")
            ? "Warning"
            : "Healthy",
          "health checks · timestamped",
        )}
        {metric("Import jobs", data.imports.length, "import jobs · current")}
        {metric("Export jobs", data.exports.length, "export jobs · current")}
        {metric(
          "Auth expiry",
          data.connections.filter(
            (row) =>
              row.token_expires_at &&
              new Date(row.token_expires_at).getTime() < Date.now() + 7 * 86400000,
          ).length,
          "connection metadata · current",
        )}
        {metric(
          "Stale integrations",
          data.connections.filter(
            (row) =>
              row.last_successful_sync_at &&
              new Date(row.last_successful_sync_at).getTime() < Date.now() - 86400000,
          ).length,
          "last successful sync · current",
        )}
      </div>
      <Card className="p-5">
        <h2 className="font-semibold">Connection health and freshness</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Each metric is from the company-scoped registry or job tables. Missing records are
          unavailable, not inferred.
        </p>
        <Rows rows={data.registry} fields={["name", "status", "updated_at", "environment"]} />
      </Card>
    </section>
  );
}
function Rows({
  rows,
  fields,
  action,
  actionLabel,
}: {
  rows: Row[];
  fields: string[];
  action?: (row: Row) => void;
  actionLabel?: string;
}) {
  if (!rows.length)
    return <p className="mt-3 text-sm text-muted-foreground">No authorised records.</p>;
  return (
    <div className="mt-3 space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded border p-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              {fields.map((field) => (
                <span key={field} className="mr-2">
                  <b>{words(field)}:</b>{" "}
                  {row[field] === null || row[field] === undefined
                    ? "Unavailable"
                    : typeof row[field] === "object"
                      ? "metadata"
                      : String(row[field])}
                </span>
              ))}
            </div>
            {action && (
              <Button size="sm" variant="outline" onClick={() => action(row)}>
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
