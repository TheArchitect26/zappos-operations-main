import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, BrainCircuit, FileSearch, LockKeyhole, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/operational-state";
import { StatusBadge } from "@/components/ui/status-badge-detailed";
import { brainCapabilities } from "@/lib/brain/core/security";
import { createZipRequest, ZIP_COPILOT_PROFILES, type ZipModule } from "@/lib/zip";

type Row = Record<string, unknown>;
type QueryResult<T> = PromiseLike<{ data: T | null; error: Error | null }>;
type MutationBuilder = ZipTableBuilder & QueryResult<Row>;
interface ZipTableBuilder {
  select: (columns?: string) => ZipTableBuilder;
  eq: (column: string, value: unknown) => MutationBuilder;
  order: (column: string, options?: { ascending?: boolean }) => ZipTableBuilder;
  limit: (count: number) => QueryResult<Row[]>;
  insert: (values: Row) => MutationBuilder;
  update: (values: Row) => MutationBuilder;
  single: () => QueryResult<Row>;
}
interface ZipDb {
  from: (table: string) => ZipTableBuilder;
}
const TABS = [
  "Assistant",
  "Knowledge",
  "Executive",
  "Copilots",
  "Prompts",
  "Gateway",
  "Memory",
  "Agents",
  "Safety & evaluation",
] as const;
type Tab = (typeof TABS)[number];
const INTERNAL_MODULES: ZipModule[] = [
  "fleet",
  "warehouse",
  "crm",
  "hr",
  "compliance",
  "procurement",
  "executive",
  "business_intelligence",
];

function db() {
  return supabase as unknown as ZipDb;
}
function text(value: unknown) {
  return typeof value === "string" ? value : "—";
}
function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function date(value: unknown) {
  return typeof value === "string" ? new Date(value).toLocaleString() : "—";
}
function list(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export function ZipWorkspace({
  companyId,
  roles,
}: {
  companyId: string;
  roles: readonly string[];
}) {
  const capabilities = brainCapabilities(roles);
  const [tab, setTab] = useState<Tab>("Assistant");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, Row[]>>({});
  const [question, setQuestion] = useState("");
  const [module, setModule] = useState<ZipModule>("fleet");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [promptName, setPromptName] = useState("");
  const [promptBody, setPromptBody] = useState("");

  const load = useCallback(async () => {
    if (!companyId || !capabilities.canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tables = [
        "zip_intelligence_api_requests",
        "zip_intelligence_api_responses",
        "zip_intelligence_response_citations",
        "zip_knowledge_sources",
        "zip_knowledge_documents",
        "zip_knowledge_document_versions",
        "zip_knowledge_chunks",
        "zip_prompt_templates",
        "zip_prompt_versions",
        "zip_provider_configurations",
        "zip_chat_sessions",
        "zip_memory_records",
        "zip_copilot_profiles",
        "zip_agent_registry",
        "zip_agent_runs",
        "zip_executive_briefings",
        "zip_safety_assessments",
        "zip_ai_evaluations",
        "zip_model_deployment_metadata",
      ];
      const results = await Promise.all(
        tables.map((table) =>
          db()
            .from(table)
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(100),
        ),
      );
      const next: Record<string, Row[]> = {};
      results.forEach((result, index: number) => {
        if (result.error) throw result.error;
        next[tables[index]] = result.data ?? [];
      });
      setRows(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load ZIP records.");
    } finally {
      setLoading(false);
    }
  }, [capabilities.canRead, companyId]);
  useEffect(() => {
    void load();
  }, [load]);

  const requests = rows.zip_intelligence_api_requests ?? [];
  const responses = rows.zip_intelligence_api_responses ?? [];
  const sources = rows.zip_knowledge_sources ?? [];
  const versions = rows.zip_knowledge_document_versions ?? [];
  const chunks = rows.zip_knowledge_chunks ?? [];
  const prompts = rows.zip_prompt_templates ?? [];
  const promptVersions = rows.zip_prompt_versions ?? [];
  const safety = rows.zip_safety_assessments ?? [];
  const availableResponses = responses.filter((row) => row.state === "available");
  const citationsByResponse = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const citation of rows.zip_intelligence_response_citations ?? []) {
      const key = text(citation.response_id);
      map.set(key, [...(map.get(key) ?? []), citation]);
    }
    return map;
  }, [rows.zip_intelligence_response_citations]);

  const ask = async () => {
    setSubmitting(true);
    setNotice(null);
    setError(null);
    try {
      const id = await createZipRequest({
        companyId,
        sourceModule: module,
        requestKind: "chat",
        question,
      });
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Sign in again to start a ZIP chat session.");
      const { data: session, error: sessionError } = await db()
        .from("zip_chat_sessions")
        .insert({
          company_id: companyId,
          user_id: userData.user.id,
          source_module: module,
          title_redacted: `ZIP ${title(module)} question`,
        })
        .select("id")
        .single();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("ZIP chat session was not created.");
      const { error: messageError } = await db()
        .from("zip_chat_messages")
        .insert({
          company_id: companyId,
          session_id: session.id,
          sender_type: "user",
          content_redacted: question.trim(),
          content_hash: `browser-${crypto.randomUUID()}`,
          api_request_id: id,
        });
      if (messageError) throw messageError;
      setQuestion("");
      setNotice(
        `Governed request ${id.slice(0, 8)} recorded. It remains pending until the controlled retrieval worker produces a cited response.`,
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record ZIP request.");
    } finally {
      setSubmitting(false);
    }
  };
  const createPrompt = async () => {
    if (!promptName.trim() || !promptBody.trim()) {
      setError("Enter a prompt name and controlled draft body.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const ownerId = userData.user?.id;
      if (!ownerId) throw new Error("Sign in again to create a prompt draft.");
      const code = `zip-${promptName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}-${Date.now()}`;
      const { data: template, error: templateError } = await db()
        .from("zip_prompt_templates")
        .insert({
          company_id: companyId,
          prompt_code: code,
          name: promptName.trim(),
          purpose: "Governed ZIP prompt",
          target_module: module,
          owner_id: ownerId,
          data_classification_limit: "internal",
        })
        .select("id")
        .single();
      if (templateError) throw templateError;
      if (!template) throw new Error("ZIP prompt template was not created.");
      const { error: versionError } = await db()
        .from("zip_prompt_versions")
        .insert({
          company_id: companyId,
          prompt_template_id: template.id,
          version: 1,
          status: "draft",
          body_template: promptBody.trim(),
          owner_id: ownerId,
          allowed_dataset_contract_ids: [],
          redaction_rules: ["restricted-field-blocking"],
          expected_input_schema: { question: "string", authorised_context: "array" },
          expected_output_schema: { insight: "string", citations: "array", unknowns: "array" },
          safety_metadata: { citations_required: true, advisory_only: true },
        });
      if (versionError) throw versionError;
      setPromptName("");
      setPromptBody("");
      setNotice("Prompt draft created. It cannot be used until a reviewer approves it.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the prompt draft.");
    } finally {
      setSubmitting(false);
    }
  };
  const advancePrompt = async (
    version: Row,
    nextStatus: "under_review" | "approved" | "retired",
  ) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sign in again to change a prompt lifecycle state.");
      const update: Row = { status: nextStatus };
      if (nextStatus === "under_review") update.reviewer_id = userId;
      if (nextStatus === "approved") update.approved_by = userId;
      const { error: updateError } = await db()
        .from("zip_prompt_versions")
        .update(update)
        .eq("id", text(version.id))
        .eq("company_id", companyId);
      if (updateError) throw updateError;
      setNotice(
        nextStatus === "approved"
          ? "Prompt version approved. Its dataset and redaction contract remain enforced."
          : `Prompt moved to ${title(nextStatus)}.`,
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not advance the prompt lifecycle.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!capabilities.canRead)
    return (
      <ErrorState
        title="ZIP is restricted"
        description="Customers, drivers, and ordinary employees cannot access the internal intelligence platform."
      />
    );
  if (loading) return <LoadingState label="Loading governed ZIP records" />;
  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Governed intelligence only</p>
            <p className="text-sm text-muted-foreground">
              ZIP never changes operational records. Provider access is disabled in production;
              answers require persisted evidence citations and human action remains separate.
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
      {error ? <ErrorState title="ZIP action unavailable" description={error} /> : null}
      {notice ? (
        <Card className="border-emerald-500/30 p-3 text-sm text-muted-foreground">{notice}</Card>
      ) : null}
      {tab === "Assistant" ? (
        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              <h2 className="font-semibold">Company assistant</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask about authorised operational evidence. Unknowns stay unknown; no uncited answer is
              published.
            </p>
            <div className="mt-4 grid gap-3">
              <select
                aria-label="Source module"
                value={module}
                onChange={(e) => setModule(e.target.value as ZipModule)}
                className="h-9 rounded-md border bg-background px-2"
              >
                {INTERNAL_MODULES.map((item) => (
                  <option key={item} value={item}>
                    {title(item)}
                  </option>
                ))}
              </select>
              <textarea
                aria-label="ZIP question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Why are shipments late? Show supporting evidence."
                className="min-h-28 rounded-md border bg-background p-3 text-sm"
              />
              <Button disabled={submitting || !question.trim()} onClick={() => void ask()}>
                <Send className="mr-2 h-4 w-4" />
                Request grounded intelligence
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Response lifecycle</h2>
            <div className="mt-3 space-y-3">
              {requests.slice(0, 6).map((request) => (
                <div key={text(request.id)} className="rounded-md border p-3">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-medium">
                      {title(text(request.source_module))}
                    </span>
                    <StatusBadge status={text(request.status)} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {text(request.question_redacted)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{date(request.created_at)}</p>
                </div>
              ))}
              {requests.length === 0 ? (
                <EmptyState
                  title="No intelligence requests"
                  description="Requests are auditable before any response is generated."
                />
              ) : null}
            </div>
          </Card>
        </section>
      ) : null}
      {tab === "Knowledge" ? (
        <section className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Approved sources"
            value={String(sources.filter((row) => row.status === "approved").length)}
            note="Role and classification checked by RLS"
          />
          <Metric
            label="Indexed versions"
            value={String(
              versions.filter((row) => row.status === "approved" || row.status === "indexed")
                .length,
            )}
            note="Versioned; only redacted content is stored"
          />
          <Metric
            label="Retrieval chunks"
            value={String(chunks.filter((row) => row.embedding_status === "indexed").length)}
            note="Lexical retrieval now; vector adapter metadata only"
          />
          <Card className="p-5 md:col-span-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5" />
              Authorised knowledge sources
            </h2>
            <div className="mt-3 space-y-2">
              {sources.map((source) => (
                <div
                  key={text(source.id)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                >
                  <span>
                    {text(source.title)}{" "}
                    <span className="text-muted-foreground">
                      · {title(text(source.source_type))}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <StatusBadge status={text(source.status)} />
                    <span className="text-xs text-muted-foreground">
                      {title(text(source.data_classification))}
                    </span>
                  </span>
                </div>
              ))}
              {sources.length === 0 ? (
                <EmptyState
                  title="No approved sources"
                  description="Knowledge must be approved, redacted, versioned, and authorised before retrieval."
                />
              ) : null}
            </div>
          </Card>
        </section>
      ) : null}
      {tab === "Executive" ? (
        <section className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold">Executive copilot</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Briefings are evidence-led, advisory, and require executive review. ZIP does not
              manufacture financial or satisfaction values.
            </p>
          </Card>
          <Rows
            rows={rows.zip_executive_briefings ?? []}
            empty="No executive briefing has been generated from authorised evidence."
            fields={["briefing_date", "status", "summary_redacted", "confidence"]}
          />
        </section>
      ) : null}
      {tab === "Copilots" ? (
        <section className="grid gap-4 md:grid-cols-2">
          {ZIP_COPILOT_PROFILES.map((profile) => (
            <Card key={profile.module} className="p-5">
              <h2 className="font-semibold">{profile.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{profile.purpose}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Cannot: {profile.prohibitedActions.join(", ")}.
              </p>
            </Card>
          ))}
          <Rows
            rows={rows.zip_copilot_profiles ?? []}
            empty="Copilot profiles may be configured by administrators; execution is always advisory."
            fields={["module_code", "name", "enabled"]}
          />
        </section>
      ) : null}
      {tab === "Prompts" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Controlled prompt registry</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Draft → review → approved → retired. Only approved versions can reach a provider
              gateway.
            </p>
            {capabilities.canManageContracts ? (
              <div className="mt-4 space-y-3">
                <input
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  placeholder="Prompt name"
                  className="h-9 w-full rounded-md border bg-background px-2"
                />
                <textarea
                  value={promptBody}
                  onChange={(e) => setPromptBody(e.target.value)}
                  placeholder="Draft body — no secrets or personal data"
                  className="min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                />
                <Button disabled={submitting} onClick={() => void createPrompt()}>
                  Create controlled draft
                </Button>
              </div>
            ) : (
              <p className="mt-4 rounded border p-3 text-sm text-muted-foreground">
                Viewer access is read-only.
              </p>
            )}
          </Card>
          <div className="space-y-3">
            <Rows
              rows={prompts}
              empty="No prompts registered."
              fields={["name", "target_module", "data_classification_limit"]}
            />
            <Card className="p-3">
              <h3 className="text-sm font-medium">Version review queue</h3>
              <div className="mt-3 space-y-2">
                {promptVersions.map((version) => {
                  const status = text(version.status);
                  return (
                    <div key={text(version.id)} className="rounded border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>Version {text(version.version)}</span>
                        <StatusBadge status={status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {status === "draft" && capabilities.canReview ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitting}
                            onClick={() => void advancePrompt(version, "under_review")}
                          >
                            Submit as reviewer
                          </Button>
                        ) : null}
                        {status === "under_review" && capabilities.canManageContracts ? (
                          <Button
                            size="sm"
                            disabled={submitting}
                            onClick={() => void advancePrompt(version, "approved")}
                          >
                            Approve version
                          </Button>
                        ) : null}
                        {status !== "retired" && capabilities.canManageContracts ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitting}
                            onClick={() => void advancePrompt(version, "retired")}
                          >
                            Retire
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {promptVersions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No prompt versions registered.</p>
                ) : null}
              </div>
            </Card>
          </div>
        </section>
      ) : null}
      {tab === "Gateway" ? (
        <section className="space-y-4">
          <Card className="border-amber-500/30 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="font-semibold">Production provider calls are disabled</h2>
                <p className="text-sm text-muted-foreground">
                  Every provider request is permission-checked, classified, redacted,
                  prompt-governed, safety-validated, and audited. Direct module-to-provider calls
                  are prohibited.
                </p>
              </div>
            </div>
          </Card>
          <Rows
            rows={rows.zip_provider_configurations ?? []}
            empty="No provider configuration exists."
            fields={[
              "provider_code",
              "environment",
              "model_reference",
              "enabled",
              "production_enabled",
            ]}
          />
        </section>
      ) : null}
      {tab === "Memory" ? (
        <section>
          <Card className="p-5">
            <h2 className="font-semibold">Controlled memory</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Session and user memory are owner-scoped. Team/company memory requires an
              administrator. Cross-company access is denied.
            </p>
          </Card>
          <div className="mt-4">
            <Rows
              rows={rows.zip_memory_records ?? []}
              empty="No memory records stored."
              fields={["memory_scope", "memory_key", "status", "expires_at"]}
            />
          </div>
        </section>
      ) : null}
      {tab === "Agents" ? (
        <section className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold">Specialist-agent registry</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agents analyse and recommend only. The schema and safety layer reject autonomous
              actions.
            </p>
          </Card>
          <Rows
            rows={rows.zip_agent_registry ?? []}
            empty="No specialist agents registered."
            fields={["agent_code", "module_code", "status", "autonomous_actions_allowed"]}
          />
          <Rows
            rows={rows.zip_agent_runs ?? []}
            empty="No agent runs recorded."
            fields={["status", "requires_human_review", "recommendation_redacted"]}
          />
        </section>
      ) : null}
      {tab === "Safety & evaluation" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Safety controls</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Citation enforcement, confidence thresholds, PII/restricted-field blocking,
              prompt-injection and jailbreak detection, output validation, and human escalation are
              recorded per request.
            </p>
            <p className="mt-3 text-sm font-medium">
              Published cited answers: {availableResponses.length}
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Evaluation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quality, groundedness, citations, hallucination rate, latency, token usage, cost, and
              feedback remain measured—not fabricated.
            </p>
            <p className="mt-3 text-sm font-medium">Safety checks: {safety.length}</p>
          </Card>
          <Rows
            rows={safety}
            empty="No safety assessments yet."
            fields={["assessment_type", "status", "action"]}
          />
          <Rows
            rows={rows.zip_ai_evaluations ?? []}
            empty="No evaluation records yet."
            fields={["evaluation_type", "availability", "score"]}
          />
          <Card className="p-5 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileSearch className="h-5 w-5" />
              Published response evidence
            </h2>
            <div className="mt-3 space-y-3">
              {availableResponses.map((response) => (
                <div key={text(response.id)} className="rounded border p-3 text-sm">
                  <p>{text(response.insight_redacted)}</p>
                  <p className="mt-1 text-muted-foreground">
                    Confidence {text(response.confidence)} ·{" "}
                    {citationsByResponse.get(text(response.id))?.length ?? 0} persisted citations
                  </p>
                </div>
              ))}
              {availableResponses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cited answer has been published.</p>
              ) : null}
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </Card>
  );
}
function Rows({ rows, empty, fields }: { rows: Row[]; empty: string; fields: string[] }) {
  if (!rows.length)
    return (
      <Card className="p-5">
        <EmptyState title="Nothing to show" description={empty} />
      </Card>
    );
  return (
    <Card className="overflow-auto p-3">
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={text(row.id)} className="grid gap-2 rounded border p-3 sm:grid-cols-3">
            {fields.map((field) => (
              <div key={field} className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground">{title(field)}</p>
                <p className="truncate text-sm">
                  {Array.isArray(row[field])
                    ? list(row[field]).join(", ")
                    : String(row[field] ?? "—")}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
