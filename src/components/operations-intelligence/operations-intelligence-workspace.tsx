import { BarChart3, BrainCircuit, Network, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const sections = [
  "Executive Dashboard",
  "Digital Twin Explorer",
  "Operations Overview",
  "Fleet Analytics",
  "Warehouse Analytics",
  "Commercial Analytics",
  "Customer Intelligence",
  "Supplier Intelligence",
  "Workforce Intelligence",
  "Asset Intelligence",
  "Process Intelligence",
  "KPI Explorer",
  "Trends",
  "Forecasts",
  "Bottlenecks",
  "Recommendations",
  "Executive Briefings",
  "Simulation",
  "Benchmarking",
  "Reporting",
];
const Panel = ({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-2 md:grid-cols-2">
      {items.map((x) => (
        <div className="rounded-md border p-3 text-sm" key={x}>
          {x}
        </div>
      ))}
    </CardContent>
  </Card>
);
export function OperationsIntelligenceWorkspace() {
  return (
    <div className="space-y-5" data-testid="operations-intelligence-workspace">
      <div className="flex flex-wrap gap-2">
        {sections.map((x) => (
          <Badge variant="secondary" key={x}>
            {x}
          </Badge>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Enterprise state", "Unavailable", "No governed cross-domain snapshot exists."],
          [
            "Priority bottlenecks",
            "Unknown",
            "Absence of observations is not evidence of efficiency.",
          ],
          [
            "Forecast confidence",
            "Unavailable",
            "At least three source observations are required.",
          ],
          ["Executive briefing", "Unavailable", "No cited briefing evidence is available."],
        ].map(([a, b, c]) => (
          <Card key={a}>
            <CardHeader>
              <CardDescription>{a}</CardDescription>
              <CardTitle>{b}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{c}</CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="twin">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="twin">Digital Twin</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="predict">Predictive</TabsTrigger>
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>
        <TabsContent value="twin">
          <Panel
            title="Enterprise Digital Twin Explorer"
            description="Extends Phase 25 twins with a read-only company hierarchy."
            items={[
              "Company → Branch → Warehouse",
              "Fleet, vehicles, routes and shipments",
              "Assets, devices and inventory",
              "Teams, drivers, customers and suppliers",
              "Health, activity and historical state",
              "Existing platform_digital_twins remain authoritative",
            ]}
          />
        </TabsContent>
        <TabsContent value="analytics">
          <Panel
            title="Governed cross-domain KPI layer"
            description="Correlations are explicitly non-causal and never cross company boundaries."
            items={[
              "Revenue, cost and margin",
              "Fleet utilisation and vehicle downtime",
              "Warehouse throughput and picking efficiency",
              "Delivery success and SLA performance",
              "Customer, supplier and workforce intelligence",
              "Reliability and Security score references",
              "Source, freshness, evidence and confidence",
              "Unavailable when evidence is missing",
            ]}
          />
        </TabsContent>
        <TabsContent value="predict">
          <Panel
            title="Forecasts, bottlenecks and simulations"
            description="Deterministic estimates explain assumptions and cannot execute changes."
            items={[
              "Maintenance, workload and shipment forecasts",
              "Fleet, staffing and inventory pressure",
              "Overloaded warehouses and routes",
              "Repeated delays, failures and queue growth",
              "Add vehicles or hire drivers scenario",
              "Demand, warehouse and supplier-loss scenario",
              "Affected KPIs and missing data",
              "Advisory only — no autonomous intervention",
            ]}
          />
        </TabsContent>
        <TabsContent value="executive">
          <Panel
            title="Executive operations view"
            description="Priorities link to owning evidence and existing experiences."
            items={[
              "Daily and weekly Executive Briefings",
              "What changed, risks and improvements",
              "Critical incidents and deteriorating KPIs",
              "Same-company branch and warehouse Benchmarking",
              "Command Centre enterprise risk signals",
              "BI scorecards and trend dashboards",
              "Export-ready PDF, Excel and CSV definitions",
              "Read-only mobile executive view",
            ]}
          />
        </TabsContent>
        <TabsContent value="governance">
          <Panel
            title="Explainable intelligence boundaries"
            description="Phase 33 aggregates; it does not replace operational authorities."
            items={[
              "Phase 21 BI: KPI and Reporting authority",
              "Phase 25: Digital Twin authority",
              "Brain: advisory recommendations only",
              "ZIP: cited, fresh and read-only explanations",
              "Command Centre: escalation authority",
              "Phase 22: event, retry and DLQ authority",
              "Phase 31 Reliability metrics reused",
              "Phase 32 security and RLS enforced",
            ]}
          />
        </TabsContent>
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2">
            <ShieldCheck className="h-5 w-5" />
            Operational safeguards
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <span>
            <Network className="mr-1 inline h-4 w-4" />
            No cross-company analytics
          </span>
          <span>
            <BrainCircuit className="mr-1 inline h-4 w-4" />
            No autonomous business decisions
          </span>
          <span>
            <BarChart3 className="mr-1 inline h-4 w-4" />
            No fabricated KPI or forecast
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
