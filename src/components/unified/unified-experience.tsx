/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Bot, Clock3, Command, History, Link2, Search, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { useSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  quickActions,
  rankResults,
  unifiedTimeline,
  workspaceSections,
  type UnifiedAction,
  type UnifiedResult,
} from "@/lib/unified-work-experience";
import { HIGH_VALUE_SEARCH_ADAPTERS } from "@/lib/unified-search-adapters";

const sources = [
  {
    table: "vehicles",
    type: "Vehicle",
    title: "registration",
    status: "status",
    metadata: "make,model",
    path: "/vehicles",
    time: "updated_at",
  },
  {
    table: "drivers",
    type: "Driver",
    title: "full_name",
    status: "status",
    metadata: "phone",
    path: "/drivers",
    time: "updated_at",
  },
  {
    table: "customers",
    type: "Customer",
    title: "name",
    status: "status",
    metadata: "email",
    path: "/customers",
    time: "updated_at",
  },
  {
    table: "jobs",
    type: "Shipment",
    title: "reference",
    status: "status",
    metadata: "pickup_address,delivery_address",
    path: "/operations",
    time: "updated_at",
  },
  {
    table: "incidents",
    type: "Incident",
    title: "description",
    status: "status",
    metadata: "severity",
    path: "/incidents",
    time: "created_at",
  },
  {
    table: "suppliers",
    type: "Supplier",
    title: "name",
    status: "status",
    metadata: "supplier_type",
    path: "/procurement",
    time: "updated_at",
  },
  {
    table: "integration_registry",
    type: "Integration",
    title: "name",
    status: "status",
    metadata: "vendor",
    path: "/integrations",
    time: "updated_at",
  },
  {
    table: "zapp_brain_insights",
    type: "Brain recommendation",
    title: "title",
    status: "status",
    metadata: "severity,confidence",
    path: "/brain",
    time: "created_at",
  },
  {
    table: "zip_conversations",
    type: "ZIP conversation",
    title: "title",
    status: "status",
    metadata: "copilot",
    path: "/intelligence",
    time: "updated_at",
  },
] as const;

function mapRow(source: (typeof sources)[number], row: any, companyId: string): UnifiedResult {
  const metadata = source.metadata
    .split(",")
    .map((key) => row[key])
    .filter(Boolean)
    .join(" · ");
  return {
    id: String(row.id),
    type: source.type,
    title: String(row[source.title] ?? source.type),
    status: String(row[source.status] ?? "available"),
    companyId,
    metadata,
    path: source.path,
    source: source.table,
    occurredAt: row[source.time] ? String(row[source.time]) : undefined,
  };
}

export function UnifiedExperienceBar() {
  const { activeCompany } = useCompany();
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedResult[]>([]);
  const [selected, setSelected] = useState<UnifiedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!user || !activeCompany) return;
    const key = `zappos:phase29:${user.id}:${activeCompany.id}`;
    const stored = JSON.parse(localStorage.getItem(key) ?? "{}") as { searches?: string[] };
    setHistory(stored.searches ?? []);
    localStorage.setItem(`${key}:last-path`, location.pathname);
  }, [activeCompany, location.pathname, user]);

  const search = useCallback(async () => {
    if (!activeCompany || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const requests = sources.map(async (source) => {
      const columns = `id,company_id,${source.title},${source.status},${source.metadata},${source.time}`;
      const response = await (supabase as any)
        .from(source.table)
        .select(columns)
        .eq("company_id", activeCompany.id)
        .ilike(source.title, `%${query.trim()}%`)
        .limit(8);
      return response.error
        ? []
        : (response.data ?? []).map((row: any) => mapRow(source, row, activeCompany.id));
    });
    const adapterRequests = HIGH_VALUE_SEARCH_ADAPTERS.map((adapter) =>
      adapter.search({ client: supabase, companyId: activeCompany.id, query: query.trim() }),
    );
    const found = rankResults(
      (await Promise.all([...requests, ...adapterRequests])).flat(),
      query,
    ).slice(0, 40);
    setResults(found);
    const nextHistory = [query.trim(), ...history.filter((item) => item !== query.trim())].slice(
      0,
      8,
    );
    setHistory(nextHistory);
    if (user) {
      const key = `zappos:phase29:${user.id}:${activeCompany.id}`;
      localStorage.setItem(key, JSON.stringify({ searches: nextHistory }));
      void (supabase as any).from("unified_search_history").insert({
        company_id: activeCompany.id,
        user_id: user.id,
        query: query.trim(),
        result_count: found.length,
      });
      void (supabase as any).from("unified_experience_events").insert({
        company_id: activeCompany.id,
        user_id: user.id,
        event_type: "search",
        module: "unified_search",
        metadata: { result_count: found.length },
      });
    }
    setLoading(false);
  }, [activeCompany, history, query, user]);
  useEffect(() => {
    const timer = window.setTimeout(() => void search(), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const openResult = (result: UnifiedResult) => {
    setSelected(result);
  };
  return (
    <>
      <div
        className="sticky top-0 z-20 hidden items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur lg:flex"
        aria-label="Unified productivity bar"
      >
        <Button
          variant="outline"
          className="min-w-72 justify-start text-muted-foreground"
          onClick={() => setOpen(true)}
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Search className="mr-2 h-4 w-4" /> Search everything{" "}
          <kbd className="ml-auto rounded border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </Button>
        <Button variant="ghost" onClick={() => navigate({ to: "/command-centre" })}>
          <Sparkles className="mr-2 h-4 w-4" />
          Action centre
        </Button>
        <Button variant="ghost" onClick={() => navigate({ to: "/intelligence" })}>
          <Bot className="mr-2 h-4 w-4" />
          Ask ZIP
        </Button>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => navigate({ to: "/notifications" })}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-3xl gap-0 overflow-hidden p-0"
          aria-describedby="universal-search-description"
        >
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Command palette
            </DialogTitle>
            <DialogDescription id="universal-search-description">
              Search, navigate, open records, and use permission-safe quick actions.
            </DialogDescription>
          </DialogHeader>
          <div className="border-b p-3">
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vehicles, people, work, documents, Brain, ZIP…"
              aria-label="Universal search"
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Searching authorized records…</p>
            ) : null}
            {!query && history.length ? (
              <div>
                <p className="px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
                  Recent searches
                </p>
                {history.map((item) => (
                  <Button
                    key={item}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setQuery(item)}
                  >
                    <History className="mr-2 h-4 w-4" />
                    {item}
                  </Button>
                ))}
              </div>
            ) : null}
            {query.length >= 2 && !loading && results.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-medium">No authorized results</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a name, reference, registration, or status. Records outside your role remain
                  hidden.
                </p>
              </div>
            ) : null}
            {results.map((result) => (
              <button
                key={`${result.source}:${result.id}`}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openResult(result)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{result.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {result.type} · {result.metadata || activeCompany?.name}
                  </span>
                </span>
                <Badge variant="outline">{result.status.replaceAll("_", " ")}</Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <EntityContextPanel
        item={selected}
        onOpenChange={(value) => !value && setSelected(null)}
        onNavigate={(path) => {
          setOpen(false);
          setSelected(null);
          navigate({ to: path as any });
        }}
      />
    </>
  );
}

function EntityContextPanel({
  item,
  onOpenChange,
  onNavigate,
}: {
  item: UnifiedResult | null;
  onOpenChange: (open: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  const timeline = item ? unifiedTimeline([item]) : [];
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{item?.title}</SheetTitle>
          <SheetDescription>
            {item?.type} · {item?.status.replaceAll("_", " ")}
          </SheetDescription>
        </SheetHeader>
        {item ? (
          <Tabs defaultValue="summary" className="mt-5">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="space-y-4">
              <Card className="p-4">
                <p className="text-sm">{item.metadata || "No additional metadata is available."}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Company scoped · source: {item.source}
                </p>
              </Card>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Quick actions</h3>
                <div className="flex flex-wrap gap-2">
                  {quickActions(item.type).map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        action === "Open" || action.startsWith("View")
                          ? onNavigate(item.path)
                          : undefined
                      }
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
              <Card className="p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Bot className="h-4 w-4" />
                  ZIP assistance
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explain, summarise, show evidence, or find related records. ZIP remains read-only.
                </p>
                <Button className="mt-3" size="sm" onClick={() => onNavigate("/intelligence")}>
                  Ask ZIP
                </Button>
              </Card>
            </TabsContent>
            <TabsContent value="timeline">
              {timeline.map((entry) => (
                <Card key={entry.id} className="mb-2 p-4">
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-medium">{entry.type} updated</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.occurredAt!).toLocaleString()} · {entry.source}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="related">
              <Card className="p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Link2 className="h-4 w-4" />
                  Connected records
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the owning module to view RLS-authorized relationships, documents, Brain
                  insights, and ZIP evidence.
                </p>
                <Button className="mt-3" onClick={() => onNavigate(item.path)}>
                  Open record
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function UnifiedHomeWorkspace() {
  const { activeCompany, roles } = useCompany();
  const { user } = useSession();
  const navigate = useNavigate();
  const [actions, setActions] = useState<UnifiedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const sections = workspaceSections(roles);
  useEffect(() => {
    if (!activeCompany || !user) return;
    void (async () => {
      setLoading(true);
      const [notifications, brain, maintenance, incidents] = await Promise.all([
        (supabase as any)
          .from("command_centre_notifications")
          .select("id,title,priority,status,created_at")
          .eq("company_id", activeCompany.id)
          .eq("user_id", user.id)
          .in("status", ["unread", "read"])
          .limit(25),
        (supabase as any)
          .from("fleet_intelligence_recommendations")
          .select("id,title,risk_level,status,created_at")
          .eq("company_id", activeCompany.id)
          .in("status", ["new", "reviewing"])
          .limit(10),
        supabase
          .from("maintenance")
          .select("id,title,status,scheduled_date,created_at")
          .eq("company_id", activeCompany.id)
          .neq("status", "completed")
          .limit(15),
        supabase
          .from("incidents")
          .select("id,description,severity,status,created_at")
          .eq("company_id", activeCompany.id)
          .neq("status", "resolved")
          .limit(15),
      ]);
      const mapped: UnifiedAction[] = [];
      for (const item of notifications.data ?? [])
        mapped.push({
          id: item.id,
          type: "Notification",
          title: item.title,
          status: item.status,
          companyId: activeCompany.id,
          metadata: "Assignment or alert",
          path: "/notifications",
          source: "command_centre_notifications",
          occurredAt: item.created_at,
          priority: item.priority ?? "medium",
        });
      for (const item of brain.data ?? [])
        mapped.push({
          id: item.id,
          type: "Brain recommendation",
          title: item.title,
          status: item.status,
          companyId: activeCompany.id,
          metadata: "Human decision required",
          path: "/fleet-intelligence",
          source: "fleet_intelligence_recommendations",
          occurredAt: item.created_at,
          priority: item.risk_level ?? "medium",
        });
      for (const item of maintenance.data ?? [])
        mapped.push({
          id: item.id,
          type: "Maintenance",
          title: item.title,
          status: item.status,
          companyId: activeCompany.id,
          metadata: "Maintenance review",
          path: "/maintenance",
          source: "maintenance",
          occurredAt: item.created_at,
          dueAt: item.scheduled_date ?? undefined,
          priority:
            item.scheduled_date && item.scheduled_date < new Date().toISOString().slice(0, 10)
              ? "high"
              : "medium",
        });
      for (const item of incidents.data ?? [])
        mapped.push({
          id: item.id,
          type: "Incident",
          title: item.description,
          status: item.status,
          companyId: activeCompany.id,
          metadata: "Operational incident",
          path: "/incidents",
          source: "incidents",
          occurredAt: item.created_at,
          priority: item.severity ?? "medium",
        });
      setActions(
        mapped
          .sort(
            (a, b) =>
              ({ critical: 4, high: 3, medium: 2, low: 1 })[b.priority] -
              { critical: 4, high: 3, medium: 2, low: 1 }[a.priority],
          )
          .slice(0, 20),
      );
      setLoading(false);
    })();
  }, [activeCompany, user]);
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8" data-testid="unified-home">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 29 · Unified workspace
        </p>
        <h1 className="mt-1 text-3xl font-semibold">My Work</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What needs attention, what changed, and what to do next.
        </p>
      </header>
      <section aria-label="Role workspace" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sections.slice(0, 8).map((section) => (
          <Card key={section} className="p-4">
            <p className="text-sm font-medium">{section}</p>
            <p className="mt-2 text-2xl font-semibold">
              {actions.filter((action) =>
                action.type.toLowerCase().includes(section.split(" ")[0].toLowerCase()),
              ).length || "—"}
            </p>
            <p className="text-xs text-muted-foreground">Authorized company data only</p>
          </Card>
        ))}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Action centre</h2>
            <p className="text-sm text-muted-foreground">
              One priority-ordered inbox across existing modules.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/command-centre" })}>
            Open full centre
          </Button>
        </div>
        {loading ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Loading authorized work…
          </Card>
        ) : actions.length === 0 ? (
          <Card className="p-8 text-center">
            <Star className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 font-medium">You are all caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New assignments, approvals, alerts, and recommendations will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => (
              <Card
                key={`${action.source}:${action.id}`}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
              >
                <Badge
                  variant={
                    action.priority === "critical" || action.priority === "high"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {action.priority}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.type} · {action.status.replaceAll("_", " ")}
                    {action.dueAt ? ` · due ${action.dueAt}` : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate({ to: action.path as any })}>
                  Review
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4" />
            Brain in context
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Governed recommendations appear in My Work and the Action Centre; people remain the
            decision-makers.
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="h-4 w-4" />
            ZIP everywhere
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask, explain, summarise, show evidence, and find related records without granting write
            authority.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/intelligence" })}
          >
            Ask ZIP
          </Button>
        </Card>
      </section>
    </main>
  );
}
