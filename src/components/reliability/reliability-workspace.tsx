import { AlertTriangle, CheckCircle2, CircleHelp, Database, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HealthState } from "@/lib/reliability/phase31";

type Status = {
  label: string;
  state: HealthState;
  source: string;
  freshness: string;
  scope: string;
  confidence: string;
  lastSuccess: string;
  nextCheck: string;
  reason?: string;
};
const services: Status[] = [
  {
    label: "Web application",
    state: "unknown",
    source: "No current synthetic evidence",
    freshness: "Unavailable",
    scope: "Production",
    confidence: "None",
    lastSuccess: "Unknown",
    nextCheck: "Not scheduled",
    reason: "Health monitor not configured",
  },
  {
    label: "Supabase database",
    state: "unknown",
    source: "Provider evidence unavailable",
    freshness: "Unavailable",
    scope: "Production",
    confidence: "None",
    lastSuccess: "Unknown",
    nextCheck: "Not scheduled",
  },
  {
    label: "Phase 22 worker",
    state: "not_monitored",
    source: "Phase 22 runtime authority",
    freshness: "No heartbeat loaded",
    scope: "Company",
    confidence: "None",
    lastSuccess: "Unknown",
    nextCheck: "Awaiting monitor",
  },
  {
    label: "Brain runtime",
    state: "not_configured",
    source: "Brain runtime health",
    freshness: "No production worker evidence",
    scope: "Company",
    confidence: "High",
    lastSuccess: "Unknown",
    nextCheck: "On configuration",
  },
  {
    label: "ZIP",
    state: "unknown",
    source: "ZIP runtime records",
    freshness: "No current check",
    scope: "Company",
    confidence: "None",
    lastSuccess: "Unknown",
    nextCheck: "Not scheduled",
  },
  {
    label: "Customer portal",
    state: "unknown",
    source: "Synthetic check pending",
    freshness: "Unavailable",
    scope: "Customer safe",
    confidence: "None",
    lastSuccess: "Unknown",
    nextCheck: "Not scheduled",
  },
];
const sections = [
  "Overview",
  "Service Health",
  "Application Errors",
  "Performance",
  "Database",
  "Workers",
  "Integrations",
  "Telemetry",
  "Queues & Backlogs",
  "SLOs",
  "Incidents",
  "Releases",
  "Deployments",
  "Feature Flags",
  "Maintenance Windows",
  "Backups",
  "Restore Tests",
  "Disaster Recovery",
  "Capacity",
  "Runbooks",
  "Audit",
  "Customer Status",
];
const stateLabel: Record<HealthState, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unavailable: "Unavailable",
  unknown: "Unknown",
  disabled: "Disabled",
  not_configured: "Not Configured",
  not_monitored: "Not Monitored",
};

function StateBadge({ state }: { state: HealthState }) {
  const Icon =
    state === "healthy"
      ? CheckCircle2
      : state === "unknown" || state.startsWith("not_")
        ? CircleHelp
        : AlertTriangle;
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="h-3 w-3" />
      {stateLabel[state]}
    </Badge>
  );
}
function EvidenceCard({ status }: { status: Status }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{status.label}</CardTitle>
          <StateBadge state={status.state} />
        </div>
        <CardDescription>{status.source}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span>Freshness: {status.freshness}</span>
        <span>Scope: {status.scope}</span>
        <span>Confidence: {status.confidence}</span>
        <span>Last successful check: {status.lastSuccess}</span>
        <span>Next expected check: {status.nextCheck}</span>
        {status.reason && <span className="sm:col-span-2">Reason: {status.reason}</span>}
      </CardContent>
    </Card>
  );
}
function GovernancePanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="rounded-md border p-3 text-sm">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
export function ReliabilityWorkspace() {
  return (
    <div className="space-y-5" data-testid="reliability-workspace">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Badge key={section} variant="secondary">
            {section}
          </Badge>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Overall platform state</CardDescription>
            <CardTitle>Unknown</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            No complete fresh evidence set exists.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Current incidents</CardDescription>
            <CardTitle>Unknown</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Absence of records is not evidence of health.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last successful backup</CardDescription>
            <CardTitle>Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Backup status unavailable from provider.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last restore test</CardDescription>
            <CardTitle>Not recorded</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            No restore success is claimed.
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="health">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="health">Service Health</TabsTrigger>
          <TabsTrigger value="observe">Observability</TabsTrigger>
          <TabsTrigger value="response">Incidents & SLOs</TabsTrigger>
          <TabsTrigger value="release">Release Governance</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="runbooks">Runbooks & Status</TabsTrigger>
        </TabsList>
        <TabsContent value="health" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <EvidenceCard key={service.label} status={service} />
          ))}
        </TabsContent>
        <TabsContent value="observe">
          <GovernancePanel
            title="Application, infrastructure and runtime observability"
            description="Evidence is aggregated from owning systems; Phase 31 does not create another worker, queue or integration monitor."
            items={[
              "Application Errors · deterministic fingerprints and redacted stacks",
              "Performance · percentiles only with sufficient samples",
              "Database Health · provider evidence required",
              "Worker Health · Phase 22, Brain, ZIP and integration records",
              "Queues & Backlogs · Phase 22 retry and DLQ authority",
              "Telemetry Health · no device credentials",
              "Integration Health · existing integration_health and alerts",
              "Cost Observability · Actual, Estimated, Forecast or Unavailable",
            ]}
          />
        </TabsContent>
        <TabsContent value="response">
          <GovernancePanel
            title="SLOs, error budgets and incident response"
            description="Human review governs exhausted budgets and incident closure."
            items={[
              "SLO registry and measurement sources",
              "Error budgets and burn rate",
              "SEV-1 Critical through SEV-4 Low",
              "Append-only incident timeline",
              "Post-Incident Review",
              "MTTA and MTTR",
              "Customer impact and communication evidence",
              "Brain advisory pattern detection",
            ]}
          />
        </TabsContent>
        <TabsContent value="release">
          <GovernancePanel
            title="Release, deployment and rollout governance"
            description="No deployment, rollback or feature activation is claimed without evidence and human approval."
            items={[
              "Release Registry",
              "Deployment lifecycle",
              "Release Approvals",
              "Rollback Management",
              "Feature Flags",
              "Progressive Rollout",
              "Maintenance Windows",
              "Operational Readiness Reviews",
            ]}
          />
        </TabsContent>
        <TabsContent value="recovery">
          <GovernancePanel
            title="Backup, restore and disaster recovery"
            description="Production restore tests are prohibited; provider evidence remains authoritative."
            items={[
              "Backup Policies",
              "Backup Inventory",
              "Restore Tests",
              "Disaster Recovery Plans",
              "RTO / RPO",
              "Capacity Planning",
              "Migration parity",
              "Recovery validation and evidence",
            ]}
          />
        </TabsContent>
        <TabsContent value="runbooks">
          <GovernancePanel
            title="Runbooks, audit and status communication"
            description="Approved runbook versions and audit/timeline evidence are immutable."
            items={[
              "Runbook Library",
              "E2E server failure",
              "Credential rotation",
              "Deployment rollback",
              "Reliability Audit",
              "Internal Status",
              "Customer-safe Status",
              "Command Centre and BI links",
            ]}
          />
        </TabsContent>
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Operational boundaries
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <span>ZIP: cited, fresh, read-only</span>
          <span>Brain: advisory only</span>
          <span>Phase 22: event/retry/DLQ authority</span>
          <span>Deployments: human gated</span>
          <span>Incident closure: authorised human only</span>
          <span>Backups: provider evidence required</span>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="h-4 w-4" />
        No secrets, raw database errors, customer identities or unrestricted payloads are displayed.
      </div>
    </div>
  );
}
