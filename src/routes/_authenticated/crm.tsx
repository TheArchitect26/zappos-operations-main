/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Handshake,
  HeartPulse,
  Loader2,
  MessageSquare,
  PackageCheck,
  Plus,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/operational-state";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import {
  calculateCrmReport,
  crmCapabilities,
  type CrmRole,
  type LeadStage,
} from "@/lib/crm/phase17";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({ meta: [{ title: "CRM & customer success — ZappOS" }] }),
  component: CrmPage,
});

type CrmTab = "overview" | "leads" | "opportunities" | "commercial" | "success" | "activities";

interface CrmData {
  accounts: any[];
  leads: any[];
  opportunities: any[];
  quotes: any[];
  contracts: any[];
  onboarding: any[];
  tasks: any[];
  health: any[];
  cases: any[];
  activities: any[];
  calendar: any[];
  financials: any[];
  documents: any[];
  portalInvitations: any[];
  portalMemberships: any[];
  warehouseOrders: any[];
  jobs: any[];
  incidents: any[];
  requests: any[];
}

const EMPTY_DATA: CrmData = {
  accounts: [],
  leads: [],
  opportunities: [],
  quotes: [],
  contracts: [],
  onboarding: [],
  tasks: [],
  health: [],
  cases: [],
  activities: [],
  calendar: [],
  financials: [],
  documents: [],
  portalInvitations: [],
  portalMemberships: [],
  warehouseOrders: [],
  jobs: [],
  incidents: [],
  requests: [],
};

const crmRoles: CrmRole[] = [
  "admin",
  "sales_manager",
  "sales_representative",
  "customer_success_manager",
  "customer_care",
  "finance_manager",
  "fleet_manager",
  "dispatcher",
  "viewer",
];

const leadNextStage: Partial<Record<LeadStage, LeadStage>> = {
  new: "contacted",
  contacted: "qualified",
  qualified: "proposal",
  proposal: "negotiation",
  negotiation: "won",
};

function value(number: unknown) {
  const parsed = Number(number ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusPill({ value: status }: { value: string | null | undefined }) {
  return (
    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
      {(status ?? "unknown").replaceAll("_", " ")}
    </span>
  );
}

function Metric({
  label,
  amount,
  detail,
  icon: Icon,
}: {
  label: string;
  amount: string;
  detail?: string;
  icon: typeof UsersRound;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{amount}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </Card>
  );
}

function CrmPage() {
  const { activeCompany, roles } = useCompany();
  const [data, setData] = useState<CrmData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CrmTab>("overview");
  const [leadName, setLeadName] = useState("");
  const [leadSource, setLeadSource] = useState("manual");
  const [addingLead, setAddingLead] = useState(false);
  const capabilities = useMemo(() => crmCapabilities(roles as CrmRole[]), [roles]);
  const hasCrmAccess = roles.some((role) => crmRoles.includes(role as CrmRole));

  const load = useCallback(async () => {
    if (!activeCompany || !hasCrmAccess) {
      setData(EMPTY_DATA);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const companyId = activeCompany.id;
    const results = await Promise.all([
      (supabase as any)
        .from("crm_accounts")
        .select(
          "id,account_name,account_type,account_status,account_manager_id,credit_status,customer_rating,created_at",
        )
        .eq("company_id", companyId)
        .order("account_name"),
      (supabase as any)
        .from("crm_leads")
        .select("id,company_name,source,stage,estimated_monthly_value,assigned_to,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100),
      (supabase as any)
        .from("crm_opportunities")
        .select("id,name,stage,expected_value,probability,expected_close_date,owner_id,account_id")
        .eq("company_id", companyId)
        .order("expected_close_date", { ascending: true })
        .limit(100),
      (supabase as any)
        .from("crm_quotes")
        .select(
          "id,quote_number,quote_type,status,total_amount,valid_until,account_id,approval_required",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100),
      (supabase as any)
        .from("crm_contracts")
        .select(
          "id,contract_number,contract_type,status,effective_to,renewal_reminder_at,account_id",
        )
        .eq("company_id", companyId)
        .order("effective_to", { ascending: true })
        .limit(100),
      (supabase as any)
        .from("crm_onboarding")
        .select("id,stage,credit_review_status,account_id,updated_at")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(80),
      (supabase as any)
        .from("crm_tasks")
        .select("id,title,priority,status,due_at,assigned_to,account_id,opportunity_id")
        .eq("company_id", companyId)
        .order("due_at", { ascending: true })
        .limit(100),
      (supabase as any)
        .from("crm_customer_health")
        .select(
          "id,account_id,health_score,recent_deliveries,recent_incidents,complaint_count,late_deliveries,invoice_aging_days,open_requests,customer_satisfaction,renewal_likelihood,measured_at",
        )
        .eq("company_id", companyId)
        .order("health_score"),
      (supabase as any)
        .from("crm_cases")
        .select(
          "id,subject,category,priority,status,response_due_at,resolution_due_at,assigned_to,account_id",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100),
      (supabase as any)
        .from("crm_activities")
        .select("id,activity_type,subject,occurred_at,account_id,opportunity_id,direction")
        .eq("company_id", companyId)
        .order("occurred_at", { ascending: false })
        .limit(80),
      (supabase as any)
        .from("crm_calendar_events")
        .select("id,event_type,title,starts_at,ends_at,account_id")
        .eq("company_id", companyId)
        .order("starts_at", { ascending: true })
        .limit(80),
      capabilities.canViewFinance
        ? (supabase as any)
            .from("crm_account_financials")
            .select(
              "id,account_id,revenue_amount,direct_cost_amount,outstanding_balance,invoice_aging_days,period_end",
            )
            .eq("company_id", companyId)
            .order("period_end", { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [], error: null }),
      (supabase as any)
        .from("crm_customer_documents")
        .select("id,document_name,document_type,expires_at,customer_visible,account_id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(80),
      (supabase as any)
        .from("customer_portal_invitations")
        .select("id,status,customer_id,invited_email,expires_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(80),
      (supabase as any)
        .from("customer_portal_memberships")
        .select("id,status,customer_id,role")
        .eq("company_id", companyId)
        .limit(100),
      (supabase as any)
        .from("warehouse_orders")
        .select("id,status,customer_id,requested_dispatch_at")
        .eq("company_id", companyId)
        .limit(100),
      supabase
        .from("jobs")
        .select("id,status,customer_id,completed_at")
        .eq("company_id", companyId)
        .limit(100),
      supabase
        .from("incidents")
        .select("id,status,customer_id,created_at")
        .eq("company_id", companyId)
        .limit(100),
      (supabase as any)
        .from("customer_service_requests")
        .select("id,status,customer_id,priority,created_at")
        .eq("company_id", companyId)
        .limit(100),
    ]);
    const core = results.slice(0, 13).find((result) => result.error);
    if (core?.error) {
      setError(core.error.message);
      setLoading(false);
      return;
    }
    setData({
      accounts: results[0].data ?? [],
      leads: results[1].data ?? [],
      opportunities: results[2].data ?? [],
      quotes: results[3].data ?? [],
      contracts: results[4].data ?? [],
      onboarding: results[5].data ?? [],
      tasks: results[6].data ?? [],
      health: results[7].data ?? [],
      cases: results[8].data ?? [],
      activities: results[9].data ?? [],
      calendar: results[10].data ?? [],
      financials: results[11].data ?? [],
      documents: results[12].data ?? [],
      portalInvitations: results[13].data ?? [],
      portalMemberships: results[14].data ?? [],
      warehouseOrders: results[15].data ?? [],
      jobs: results[16].data ?? [],
      incidents: results[17].data ?? [],
      requests: results[18].data ?? [],
    });
    setLoading(false);
  }, [activeCompany, capabilities.canViewFinance, hasCrmAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  const addLead = async () => {
    if (!activeCompany || !leadName.trim()) return;
    setAddingLead(true);
    const { error: insertError } = await (supabase as any).from("crm_leads").insert({
      company_id: activeCompany.id,
      company_name: leadName.trim(),
      source: leadSource,
      stage: "new",
    });
    setAddingLead(false);
    if (insertError) {
      toast.error(insertError.message);
      return;
    }
    setLeadName("");
    toast.success("Lead added to the CRM pipeline");
    void load();
  };

  const advanceLead = async (lead: any) => {
    const next = leadNextStage[lead.stage as LeadStage];
    if (!next) return;
    const { error: transitionError } = await (supabase as any).rpc("crm_transition_lead", {
      _lead_id: lead.id,
      _to_stage: next,
      _reason: null,
    });
    if (transitionError) {
      toast.error(transitionError.message);
      return;
    }
    toast.success(`Lead moved to ${next.replaceAll("_", " ")}`);
    void load();
  };

  const metrics = useMemo(() => {
    const report = calculateCrmReport({
      leads: data.leads.map((lead) => ({
        stage: lead.stage,
        createdAt: new Date(lead.created_at),
      })),
      opportunities: data.opportunities.map((opportunity) => ({
        stage: opportunity.stage,
        expectedValue: value(opportunity.expected_value),
        ownerId: opportunity.owner_id,
      })),
      accounts: data.accounts.map((account) => ({ createdAt: new Date(account.created_at) })),
    });
    const now = new Date();
    const activeQuotes = data.quotes.filter((quote) =>
      ["draft", "sent", "approved"].includes(quote.status),
    );
    const highValue = data.accounts.filter((account) =>
      data.opportunities.some(
        (opportunity) =>
          opportunity.account_id === account.id && value(opportunity.expected_value) >= 100_000,
      ),
    );
    const slaBreaches = data.cases.filter(
      (customerCase) =>
        !["resolved", "closed"].includes(customerCase.status) &&
        ((customerCase.response_due_at && new Date(customerCase.response_due_at) < now) ||
          (customerCase.resolution_due_at && new Date(customerCase.resolution_due_at) < now)),
    );
    const monthlySales = data.financials
      .filter((entry) => new Date(entry.period_end).getMonth() === now.getMonth())
      .reduce((sum, entry) => sum + value(entry.revenue_amount), 0);
    return {
      ...report,
      newLeads: data.leads.filter((lead) => lead.stage === "new").length,
      qualifiedLeads: data.leads.filter((lead) => lead.stage === "qualified").length,
      activeQuotes: activeQuotes.length,
      awaitingSignature: data.contracts.filter(
        (contract) => contract.status === "awaiting_signature",
      ).length,
      activeCustomers: data.accounts.filter(
        (account) => account.account_type === "customer" && account.account_status === "active",
      ).length,
      highValueCustomers: highValue.length,
      atRisk: data.health.filter((health) => value(health.health_score) < 50).length,
      slaBreaches: slaBreaches.length,
      monthlySales,
      customerSatisfaction: data.health.length
        ? (
            data.health.reduce((sum, health) => sum + value(health.customer_satisfaction), 0) /
            data.health.length
          ).toFixed(1)
        : "—",
      openRequests: data.cases.filter(
        (customerCase) => !["resolved", "closed"].includes(customerCase.status),
      ).length,
      accountManagers: new Set(
        data.accounts.map((account) => account.account_manager_id).filter(Boolean),
      ).size,
      openTasks: data.tasks.filter((task) => !["completed", "cancelled"].includes(task.status))
        .length,
      slaBreachesList: slaBreaches,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <LoadingState label="Loading CRM operations" />
      </div>
    );
  }
  if (!hasCrmAccess || !capabilities.canRead) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState
          title="CRM access is restricted"
          description="Drivers do not have access to customer relationship data."
        />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <ErrorState title="Could not load CRM" description={error} onAction={() => void load()} />
      </div>
    );
  }

  const tabs: Array<{ id: CrmTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "leads", label: "Leads & accounts" },
    { id: "opportunities", label: "Opportunities" },
    { id: "commercial", label: "Quotes & contracts" },
    { id: "success", label: "Success & care" },
    { id: "activities", label: "Activities & calendar" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            CRM & customer success
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Customer relationship operations
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Company-scoped sales, accounts, contracts, customer care, onboarding, and operational
            relationship data.
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
            <Metric
              label="New leads"
              amount={String(metrics.newLeads)}
              detail={`${metrics.qualifiedLeads} qualified`}
              icon={UsersRound}
            />
            <Metric
              label="Opportunities"
              amount={String(metrics.openOpportunities)}
              detail={money(metrics.revenuePipeline)}
              icon={BriefcaseBusiness}
            />
            <Metric
              label="Active quotes"
              amount={String(metrics.activeQuotes)}
              detail={`${metrics.awaitingSignature} awaiting signature`}
              icon={FileText}
            />
            <Metric
              label="Active customers"
              amount={String(metrics.activeCustomers)}
              detail={`${metrics.highValueCustomers} high value`}
              icon={Handshake}
            />
            <Metric
              label="At-risk customers"
              amount={String(metrics.atRisk)}
              detail={`${metrics.slaBreaches} SLA breaches`}
              icon={HeartPulse}
            />
            <Metric
              label="Monthly sales"
              amount={capabilities.canViewFinance ? money(metrics.monthlySales) : "Restricted"}
              detail="Recorded CRM financial periods"
              icon={BarChart3}
            />
            <Metric
              label="Conversion rate"
              amount={`${metrics.conversionRate}%`}
              detail={`${metrics.lostOpportunities} lost opportunities`}
              icon={CheckCircle2}
            />
            <Metric
              label="Customer satisfaction"
              amount={String(metrics.customerSatisfaction)}
              detail={`${metrics.openRequests} open customer requests`}
              icon={MessageSquare}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Customer success watchlist</h2>
                  <p className="text-sm text-muted-foreground">
                    Health indicators are recorded facts, not predictive scores.
                  </p>
                </div>
                <HeartPulse className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                {data.health.slice(0, 6).map((health) => (
                  <div
                    key={health.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">Account {health.account_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {health.recent_deliveries} deliveries · {health.late_deliveries} late ·{" "}
                        {health.open_requests} open requests
                      </p>
                    </div>
                    <StatusPill
                      value={
                        value(health.health_score) < 50
                          ? "at risk"
                          : value(health.health_score) < 75
                            ? "watch"
                            : "healthy"
                      }
                    />
                  </div>
                ))}
                {data.health.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No customer health measurements have been recorded.
                  </p>
                ) : null}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">SLA and account-manager workload</h2>
                  <p className="text-sm text-muted-foreground">
                    Response and resolution due times are calculated from recorded SLA rules.
                  </p>
                </div>
                <ShieldAlert className="h-5 w-5 text-status-warning" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Breached cases</p>
                  <p className="mt-1 text-xl font-semibold">{metrics.slaBreaches}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Account managers</p>
                  <p className="mt-1 text-xl font-semibold">{metrics.accountManagers}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Open tasks</p>
                  <p className="mt-1 text-xl font-semibold">{metrics.openTasks}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Onboarding in progress</p>
                  <p className="mt-1 text-xl font-semibold">
                    {data.onboarding.filter((item) => item.stage !== "completed").length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {tab === "leads" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-semibold">Lead pipeline</h2>
              <p className="text-sm text-muted-foreground">
                Lifecycle stages are validated and recorded in immutable stage history.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Lead</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3 text-right">Value</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map((lead) => (
                    <tr key={lead.id} className="border-t">
                      <td className="p-3 font-medium">{lead.company_name}</td>
                      <td className="p-3 capitalize">{lead.source.replaceAll("_", " ")}</td>
                      <td className="p-3">
                        <StatusPill value={lead.stage} />
                      </td>
                      <td className="p-3 text-right">
                        {money(value(lead.estimated_monthly_value))}
                      </td>
                      <td className="p-3">
                        {capabilities.canManageSales && leadNextStage[lead.stage as LeadStage] ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void advanceLead(lead)}
                          >
                            Advance
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.leads.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No leads have been recorded.</p>
            ) : null}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Add lead</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Creates a real new-stage CRM lead for this company.
            </p>
            {capabilities.canManageSales ? (
              <div className="mt-4 space-y-3">
                <Input
                  value={leadName}
                  onChange={(event) => setLeadName(event.target.value)}
                  placeholder="Company name"
                />
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={leadSource}
                  onChange={(event) => setLeadSource(event.target.value)}
                >
                  <option value="manual">Manual</option>
                  <option value="referral">Referral</option>
                  <option value="website">Website</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="partner">Partner</option>
                  <option value="campaign">Campaign</option>
                  <option value="trade_show">Trade show</option>
                </select>
                <Button
                  className="w-full"
                  disabled={addingLead || !leadName.trim()}
                  onClick={() => void addLead()}
                >
                  {addingLead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add lead
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                Your role has read-only CRM access.
              </p>
            )}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold">Accounts</h3>
              <p className="mt-1 text-2xl font-semibold">{data.accounts.length}</p>
              <p className="text-xs text-muted-foreground">
                Prospects, customers, partners, suppliers, branches, and hierarchies are held in CRM
                accounts.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "opportunities" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Sales opportunities</h2>
                <p className="text-sm text-muted-foreground">
                  Expected value, probability, competitors, and close dates are stored per
                  opportunity.
                </p>
              </div>
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 space-y-2">
              {data.opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{opportunity.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {money(value(opportunity.expected_value))} · {opportunity.probability}% ·{" "}
                      {opportunity.expected_close_date ?? "No close date"}
                    </p>
                  </div>
                  <StatusPill value={opportunity.stage} />
                </div>
              ))}
              {data.opportunities.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No sales opportunities have been recorded.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Performance reporting</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pipeline, conversion, growth, and loss reporting derives from CRM records.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Revenue pipeline</p>
                <p className="mt-1 font-semibold">{money(metrics.revenuePipeline)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Conversion</p>
                <p className="mt-1 font-semibold">{metrics.conversionRate}%</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Customer growth</p>
                <p className="mt-1 font-semibold">{metrics.customerGrowth}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Lost opportunities</p>
                <p className="mt-1 font-semibold">{metrics.lostOpportunities}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "commercial" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-semibold">Quotation engine</h2>
              <p className="text-sm text-muted-foreground">
                Service, transport, warehouse, storage, and contract quote records use deterministic
                totals and approvals.
              </p>
            </div>
            <div className="space-y-2 p-5">
              {data.quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{quote.quote_number}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {quote.quote_type} · {money(value(quote.total_amount))} · valid to{" "}
                      {quote.valid_until}
                    </p>
                  </div>
                  <StatusPill value={quote.status} />
                </div>
              ))}
              {data.quotes.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No quotations have been recorded.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-semibold">Contracts & commercial records</h2>
              <p className="text-sm text-muted-foreground">
                Contracts, rate agreements, revenue, balances, and renewal reminders remain
                company-scoped.
              </p>
            </div>
            <div className="space-y-2 p-5">
              {data.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{contract.contract_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {contract.contract_type.replaceAll("_", " ")} · renew{" "}
                      {contract.renewal_reminder_at ?? "not scheduled"}
                    </p>
                  </div>
                  <StatusPill value={contract.status} />
                </div>
              ))}
              {data.contracts.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No contracts have been recorded.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "success" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-semibold">Customer care cases</h2>
              <p className="text-sm text-muted-foreground">
                Priority, assignment, response/resolution targets, escalation, and resolution are
                audited.
              </p>
            </div>
            <div className="space-y-2 p-5">
              {data.cases.map((customerCase) => (
                <div
                  key={customerCase.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{customerCase.subject}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {customerCase.category} · {customerCase.priority} · response{" "}
                      {customerCase.response_due_at
                        ? new Date(customerCase.response_due_at).toLocaleString()
                        : "not set"}
                    </p>
                  </div>
                  <StatusPill value={customerCase.status} />
                </div>
              ))}
              {data.cases.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No customer care cases have been recorded.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Operational relationship integration</h2>
                <p className="text-sm text-muted-foreground">
                  Read-only operational signals shown alongside customer records.
                </p>
              </div>
              <PackageCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Warehouse orders</p>
                <p className="mt-1 text-xl font-semibold">{data.warehouseOrders.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Dispatch jobs</p>
                <p className="mt-1 text-xl font-semibold">{data.jobs.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Incidents</p>
                <p className="mt-1 text-xl font-semibold">{data.incidents.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Portal memberships</p>
                <p className="mt-1 text-xl font-semibold">
                  {
                    data.portalMemberships.filter((membership) => membership.status === "active")
                      .length
                  }
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Storage usage and inventory status are available from warehouse records when that
              module is populated; dispatch history derives from jobs and incidents.
            </p>
          </Card>
        </div>
      ) : null}

      {tab === "activities" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-semibold">Customer communication timeline</h2>
              <p className="text-sm text-muted-foreground">
                Email, phone, meetings, SMS, WhatsApp metadata, portal notifications, and notes are
                tracked without external sending.
              </p>
            </div>
            <div className="space-y-2 p-5">
              {data.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {activity.activity_type.replaceAll("_", " ")} ·{" "}
                      {new Date(activity.occurred_at).toLocaleString()}
                    </p>
                  </div>
                  <StatusPill value={activity.direction ?? "internal"} />
                </div>
              ))}
              {data.activities.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No CRM activities have been recorded.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Tasks, calendar & documents</h2>
                <p className="text-sm text-muted-foreground">
                  Follow-ups, reviews, renewals, recurring tasks, and customer document metadata.
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 space-y-2">
              {data.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {task.due_at ? new Date(task.due_at).toLocaleString() : "not scheduled"}
                    </p>
                  </div>
                  <StatusPill value={task.status} />
                </div>
              ))}
              {data.calendar.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {event.event_type.replaceAll("_", " ")} ·{" "}
                      {new Date(event.starts_at).toLocaleString()}
                    </p>
                  </div>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              {data.tasks.length === 0 && data.calendar.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No customer tasks or calendar events have been recorded.
                </p>
              ) : null}
            </div>
            <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Customer documents</p>
              <p className="mt-1 text-muted-foreground">
                {data.documents.length} metadata records ·{" "}
                {
                  data.portalInvitations.filter((invitation) => invitation.status === "pending")
                    .length
                }{" "}
                pending portal invitations
              </p>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
