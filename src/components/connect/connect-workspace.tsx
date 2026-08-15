import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock3,
  Inbox,
  MessageSquare,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  brainConnectBoundary,
  generateDryRun,
  handoverCompleteness,
  zipConnectBoundary,
} from "@/lib/connect/phase30";

const sections = [
  "Inbox",
  "Conversations",
  "Team Channels",
  "Tasks",
  "Approvals",
  "Escalations",
  "Shift Handovers",
  "Templates",
  "Automation Rules",
  "Delivery Status",
  "Provider Connections",
  "Audit & Analytics",
] as const;
const inboxFilters = [
  "Unread",
  "Assigned to me",
  "Mentions",
  "High priority",
  "Waiting for reply",
  "Customer",
  "Supplier",
  "Internal",
  "Failed delivery",
  "Archived",
];
const entityTypes = [
  "Shipment",
  "Job",
  "Vehicle",
  "Driver",
  "Customer",
  "Supplier",
  "Purchase order",
  "Invoice",
  "Incident",
  "Maintenance record",
  "Warehouse task",
  "Employee",
  "Support case",
  "Device",
  "Integration failure",
  "Brain recommendation",
];
const providerChannels = [
  "Email · Microsoft 365 / Gmail / SMTP",
  "WhatsApp Business · Meta Cloud API / approved BSP",
  "SMS · transactional provider",
  "Push · provider connection",
];

export function ConnectWorkspace({ roles }: { companyId: string; roles: readonly string[] }) {
  const [section, setSection] = useState<(typeof sections)[number]>("Inbox");
  const viewer = roles.includes("viewer") && !roles.includes("admin");
  const dryRun = useMemo(
    () =>
      generateDryRun({
        triggerMatched: true,
        conditionsPassed: true,
        actions: ["create_task", "queue_approved_communication", "dispatch_vehicle"],
        recordIds: ["shipment-reference"],
      }),
    [],
  );
  const handover = handoverCompleteness([
    { required: true, complete: true },
    { required: true, complete: false },
    { required: false, complete: false },
  ]);
  return (
    <div className="space-y-4" data-testid="connect-workspace">
      <div className="flex flex-wrap gap-2" aria-label="Zapp Connect sections">
        {sections.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={section === item ? "default" : "outline"}
            onClick={() => setSection(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      {viewer && (
        <Card className="p-4 text-sm">
          <ShieldCheck className="mr-2 inline size-4" />
          Viewer read-only access — messages, approvals, templates and automation cannot be changed.
        </Card>
      )}
      {section === "Inbox" && <InboxView />}
      {section === "Conversations" && <ConversationView />}
      {section === "Team Channels" && <ChannelsView />}
      {section === "Tasks" && <TaskView />}
      {section === "Approvals" && <ApprovalView />}
      {section === "Escalations" && <EscalationView />}
      {section === "Shift Handovers" && <HandoverView percentage={handover.percentage} />}
      {section === "Templates" && <TemplateView />}
      {section === "Automation Rules" && <AutomationView dryRun={dryRun} />}
      {section === "Delivery Status" && <DeliveryView />}
      {section === "Provider Connections" && <ProviderView />}
      {section === "Audit & Analytics" && <AuditView />}
    </div>
  );
}

function InboxView() {
  const [filter, setFilter] = useState("High priority");
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card className="p-4">
        <h2 className="font-semibold">
          <Inbox className="mr-2 inline size-4" />
          Unified inbox
        </h2>
        <div className="mt-3 space-y-1">
          {inboxFilters.map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={filter === x}
              onClick={() => setFilter(x)}
              className="block min-h-9 w-full rounded px-2 text-left text-sm hover:bg-muted aria-pressed:bg-muted aria-pressed:font-medium"
            >
              {x}
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <Badge>{filter}</Badge>
            <h3 className="mt-2 font-semibold">Operations handover requires acknowledgement</h3>
            <p className="text-sm text-muted-foreground">
              Internal · Assigned to Fleet Control · Waiting for reply
            </p>
          </div>
          <Clock3 className="size-5 text-muted-foreground" />
        </div>
        <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
          CRM threads, customer portal conversations, mentions, assignments, approval requests and
          delivery failures are governed projections from their owning source.
        </div>
      </Card>
    </div>
  );
}
function ConversationView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">
        <MessageSquare className="mr-2 inline size-4" />
        Contextual conversations
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Company, participants, visibility, status, owner, creator, last activity and immutable audit
        history accompany every thread.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {entityTypes.map((x) => (
          <Badge key={x} variant="outline">
            {x}
          </Badge>
        ))}
      </div>
      <div className="mt-5 rounded border p-4">
        <h3 className="font-medium">Call and meeting notes</h3>
        <p className="text-sm text-muted-foreground">
          User-recorded customer, supplier, driver and internal discussions capture participants,
          time, commitments, follow-up tasks, attachments, visibility and consent metadata.
        </p>
      </div>
    </Card>
  );
}
function ChannelsView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">
        <Users className="mr-2 inline size-4" />
        Operational team channels
      </h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          "Operations",
          "Fleet Control",
          "Dispatch",
          "Warehouse",
          "Workshop",
          "Customer Care",
          "HR",
          "Finance",
          "Compliance",
          "Procurement",
          "Management",
          "Incident rooms",
        ].map((x) => (
          <div key={x} className="rounded border p-3 text-sm">
            # {x}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Company, branch, shift and incident membership governs messages, replies,
        @user/@role/@team/@branch mentions, pins, attachments, linked records and read state.
      </p>
    </Card>
  );
}
function TaskView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">
        <CheckCircle2 className="mr-2 inline size-4" />
        Shared tasks
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Tasks coordinate work across domains without replacing authoritative jobs, maintenance
        records, cases, purchase orders, Brain recommendations or ZIP follow-ups.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          "Open · Verify missing POD",
          "In Progress · Supplier confirmation",
          "Blocked · Maintenance evidence",
        ].map((x) => (
          <div className="rounded border p-3 text-sm" key={x}>
            {x}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Task creation is managed in the owning operations workspace.
      </p>
    </Card>
  );
}
function ApprovalView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Approval inbox</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Cards project request, requester, amount or impact, evidence, policy, due date, stage, prior
        approvals, conflicts and audit history.
      </p>
      <div className="mt-4 rounded border p-4">
        <b>Owning-domain enforcement</b>
        <p className="text-sm text-muted-foreground">
          Approve and reject actions execute only through the owning domain's controlled RPC. Direct
          status mutation is unavailable.
        </p>
      </div>
    </Card>
  );
}
function EscalationView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Escalation management</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Team", "Supervisor", "Manager", "Executive", "External escalation"].map((x) => (
          <Badge key={x} variant="outline">
            {x}
          </Badge>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Severity, owner, reason, SLA, required response, related records, resolution and closure
        verification are tracked. No disciplinary or financial action is automatic.
      </p>
    </Card>
  );
}
function HandoverView({ percentage }: { percentage: number }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Shift handover</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Fleet control, dispatch, warehouse, workshop, security, customer care, support and incident
        teams submit structured outstanding work.
      </p>
      <div className="mt-4 rounded border p-4">
        <b>Example completeness: {percentage}%</b>
        <p className="text-sm text-muted-foreground">
          Incoming shift acknowledgement is mandatory. Acknowledged handovers are immutable.
        </p>
      </div>
    </Card>
  );
}
function TemplateView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Governed communication templates</h2>
      <div className="mt-3 flex gap-2">
        <Badge>Draft</Badge>
        <Badge variant="secondary">Under Review</Badge>
        <Badge variant="outline">Approved</Badge>
        <Badge variant="outline">Retired</Badge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Channel, audience, language, subject, body, variables, owner, reviewer, version and approved
        use cases are controlled. Approved versions are immutable.
      </p>
    </Card>
  );
}
function AutomationView({ dryRun }: { dryRun: ReturnType<typeof generateDryRun> }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">
        <Workflow className="mr-2 inline size-4" />
        Human-gated automation builder
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Phase 22 events trigger allow-listed coordination actions. Protected domain mutations and
        autonomous operational, disciplinary, financial or external communication actions are
        prohibited.
      </p>
      <div className="mt-4 rounded border p-4" data-testid="dry-run">
        <b>Dry Run · non-mutating</b>
        <p className="text-sm">
          Trigger matched: {String(dryRun.triggerMatched)} · Conditions passed:{" "}
          {String(dryRun.conditionsPassed)} · Actions that would occur:{" "}
          {dryRun.actionsThatWouldOccur.length}
        </p>
        <p className="text-sm text-destructive">{dryRun.safetyFailures.join(" · ")}</p>
        <p className="text-xs text-muted-foreground">
          Sent: {String(dryRun.sent)} · Mutated: {String(dryRun.mutated)}
        </p>
      </div>
    </Card>
  );
}
function DeliveryView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Delivery monitoring</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "Queued",
          "Sent",
          "Delivered",
          "Read",
          "Failed",
          "Retrying",
          "Suppressed",
          "Opted out",
        ].map((x) => (
          <Badge variant="outline" key={x}>
            {x}
          </Badge>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Delivered and Read require provider confirmation. Failure attempts are append-only and
        reference the Phase 22 retry queue and DLQ.
      </p>
    </Card>
  );
}
function ProviderView() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Provider connections</h2>
      <div className="mt-3 space-y-2">
        {providerChannels.map((x) => (
          <div key={x} className="flex items-center justify-between rounded border p-3 text-sm">
            <span>{x}</span>
            <Badge variant="destructive">Provider not configured</Badge>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Credentials use Phase 22 secure-reference metadata. Mailbox passwords and provider secrets
        are never stored here. External execution remains disabled.
      </p>
    </Card>
  );
}
function AuditView() {
  const zip = zipConnectBoundary(),
    brain = brainConnectBoundary();
  return (
    <Card className="p-5">
      <h2 className="font-semibold">
        <Archive className="mr-2 inline size-4" />
        Audit & analytics
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Thread, participant, delivery, task, approval, escalation, handover, template and automation
        lifecycle events are append-only.
      </p>
      <Tabs defaultValue="zip" className="mt-4">
        <TabsList>
          <TabsTrigger value="zip">ZIP</TabsTrigger>
          <TabsTrigger value="brain">Brain</TabsTrigger>
        </TabsList>
        <TabsContent value="zip" className="text-sm">
          ZIP can cite, summarise, explain and draft authorised content. Send: {String(zip.canSend)}{" "}
          · Mutate: {String(zip.canMutate)}.
        </TabsContent>
        <TabsContent value="brain" className="text-sm">
          Brain identifies patterns and remains advisory. Send: {String(brain.canSend)} · Escalate:{" "}
          {String(brain.canEscalate)}.
        </TabsContent>
      </Tabs>
    </Card>
  );
}
