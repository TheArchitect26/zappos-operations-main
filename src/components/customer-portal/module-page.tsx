/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useEffect, useState, type FormEvent } from "react";
import { Bot, CheckCircle2, Copy, KeyRound, Loader2, Send, ShieldCheck } from "lucide-react";
import { portalApi, type PortalModule } from "@/lib/customer-portal-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const shells: Record<string, { eyebrow: string; title: string; description: string }> = {
  quotes: {
    eyebrow: "Quotes & booking",
    title: "Plan your next shipment",
    description: "Submit customer requests. Internal pricing and approval remain in CRM.",
  },
  invoices: {
    eyebrow: "Invoice centre",
    title: "Financial documents",
    description: "Read-only invoices, credit notes, statements and payment references.",
  },
  messages: {
    eyebrow: "Customer messaging",
    title: "Conversations",
    description:
      "Contact Customer Care, Commercial, Dispatch or Support without exposing staff directories.",
  },
  notifications: {
    eyebrow: "Notifications",
    title: "Portal updates",
    description: "Only persisted portal notifications and their real delivery state appear here.",
  },
  profile: {
    eyebrow: "Company profile",
    title: "Portal identity",
    description: "Manage customer-facing branding and regional preferences.",
  },
  security: {
    eyebrow: "Security",
    title: "Account security",
    description: "Review your own security events and manage account safeguards.",
  },
};

export function PortalDataModule({ module }: { module: PortalModule }) {
  const shell = shells[module] ?? shells.notifications;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await portalApi.module<any[]>(module);
      setRows(Array.isArray(result) ? result : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load portal module");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => void load(), [module]);

  const markRead = async (id: string) => {
    await portalApi.action("read_notification", { id });
    await load();
  };

  return (
    <PortalPageShell {...shell}>
      {module === "quotes" ? <QuoteRequestForm onCreated={load} /> : null}
      {module === "messages" ? <ConversationForm onCreated={load} /> : null}
      {loading ? <LoadingCard /> : null}
      {error ? <ErrorCard message={error} /> : null}
      {!loading && !error && rows.length === 0 ? <EmptyCard /> : null}
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id} className="border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">
                  {row.title ?? row.subject ?? row.reference ?? row.customer_reference ?? row.name}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {[
                    row.document_type,
                    row.request_type,
                    row.category,
                    row.status,
                    row.notification_type,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {row.body ? <p className="mt-3 text-sm text-slate-300">{row.body}</p> : null}
                {row.amount != null ? (
                  <p className="mt-3 text-sm text-slate-300">
                    {row.currency} {Number(row.amount).toFixed(2)}
                    {row.due_date ? ` · Due ${row.due_date}` : ""}
                  </p>
                ) : null}
                {row.delivery_state ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Delivery: {JSON.stringify(row.delivery_state)}
                  </p>
                ) : null}
              </div>
              {module === "notifications" && !row.read_at ? (
                <Button size="sm" variant="outline" onClick={() => void markRead(row.id)}>
                  Mark read
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </PortalPageShell>
  );
}

function QuoteRequestForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({
    request_type: "quote",
    customer_reference: "",
    pickup_summary: "",
    delivery_summary: "",
    cargo_summary: "",
    requested_date: "",
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await portalApi.action("create_quote_request", form);
    setForm({
      ...form,
      customer_reference: "",
      pickup_summary: "",
      delivery_summary: "",
      cargo_summary: "",
    });
    await onCreated();
  };
  return (
    <Card className="border-white/10 bg-slate-900/70 p-5">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <Select
          value={form.request_type}
          onValueChange={(request_type) => setForm({ ...form, request_type })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quote">Request quote</SelectItem>
            <SelectItem value="booking">Book shipment</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={form.customer_reference}
          onChange={(e) => setForm({ ...form, customer_reference: e.target.value })}
          placeholder="Your reference"
        />
        <Input
          required
          value={form.pickup_summary}
          onChange={(e) => setForm({ ...form, pickup_summary: e.target.value })}
          placeholder="Pickup summary"
        />
        <Input
          required
          value={form.delivery_summary}
          onChange={(e) => setForm({ ...form, delivery_summary: e.target.value })}
          placeholder="Delivery summary"
        />
        <Textarea
          required
          value={form.cargo_summary}
          onChange={(e) => setForm({ ...form, cargo_summary: e.target.value })}
          placeholder="Cargo summary"
        />
        <Input
          type="date"
          value={form.requested_date}
          onChange={(e) => setForm({ ...form, requested_date: e.target.value })}
        />
        <Button type="submit" className="md:col-span-2">
          Submit for internal review
        </Button>
      </form>
    </Card>
  );
}

function ConversationForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("support");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await portalApi.action("create_conversation", { subject, category });
    setSubject("");
    await onCreated();
  };
  return (
    <Card className="border-white/10 bg-slate-900/70 p-5">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <Input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Conversation subject"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["shipment", "commercial", "billing", "support", "technical"].map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Start conversation</Button>
      </form>
    </Card>
  );
}

export function PortalAnalyticsPage() {
  const [data, setData] = useState<Record<string, number | null> | null>(null);
  useEffect(() => void portalApi.analytics().then(setData), []);
  return (
    <PortalPageShell
      eyebrow="Customer analytics"
      title="Performance overview"
      description="Customer-scoped aggregates only. Internal BI is never exposed."
    >
      {!data ? (
        <LoadingCard />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data).map(([key, value]) => (
            <Card key={key} className="border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">{key.replaceAll("_", " ")}</p>
              <p className="mt-2 text-2xl font-semibold">{value ?? "Unavailable"}</p>
            </Card>
          ))}
        </div>
      )}
    </PortalPageShell>
  );
}

export function PortalAssistantPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      setAnswer(await portalApi.askZip(question));
    } finally {
      setBusy(false);
    }
  };
  return (
    <PortalPageShell
      eyebrow="ZIP customer assistant"
      title="Ask ZIP"
      description="Deterministic, permission-aware answers with persisted citations. Brain is not available in the portal."
    >
      <Card className="border-white/10 bg-slate-900/70 p-5">
        <form className="flex gap-2" onSubmit={submit}>
          <Input
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Where is my shipment?"
          />
          <Button disabled={busy} type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {answer ? (
          <div className="mt-5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span className="text-xs uppercase text-slate-400">
                {answer.outcome} · deterministic
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-200">{answer.answer}</p>
            <div className="mt-3 space-y-1">
              {answer.citations.map((citation: any) => (
                <p key={citation.id} className="text-xs text-emerald-300">
                  Citation: {citation.type} · {citation.label}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </PortalPageShell>
  );
}

export function PortalApiKeysPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"read_only_api" | "webhook">("read_only_api");
  const [secret, setSecret] = useState("");
  const load = () => portalApi.module<any[]>("api_keys").then(setRows);
  useEffect(() => void load(), []);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    const value = await portalApi.createApiKey(name, type);
    setSecret(value.secret);
    setName("");
    await load();
  };
  return (
    <PortalPageShell
      eyebrow="Customer API"
      title="API and webhook keys"
      description="Keys are customer-scoped, read-only, rotatable and shown once."
    >
      <Card className="border-white/10 bg-slate-900/70 p-5">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={create}>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Key name"
          />
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read_only_api">Read-only API</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">
            <KeyRound className="mr-2 h-4 w-4" />
            Create
          </Button>
        </form>
        {secret ? (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-300">Copy now. This secret will not be shown again.</p>
            <div className="mt-2 flex gap-2">
              <code className="min-w-0 flex-1 overflow-hidden text-ellipsis text-xs">{secret}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(secret)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id} className="border-white/10 bg-slate-900/70 p-4">
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-slate-400">
              {row.key_prefix} · {row.key_type} · {row.revoked_at ? "revoked" : "active"} ·{" "}
              {row.usage_count} uses
            </p>
          </Card>
        ))}
      </div>
    </PortalPageShell>
  );
}

export function PortalProfilePage() {
  const [profile, setProfile] = useState<any>({
    primary_colour: "",
    welcome_message: "",
    timezone: "Africa/Johannesburg",
    language: "en",
  });
  const [saved, setSaved] = useState(false);
  useEffect(
    () =>
      void portalApi
        .module<any>("profile")
        .then((value) => setProfile((current: any) => ({ ...current, ...value }))),
    [],
  );
  const save = async (event: FormEvent) => {
    event.preventDefault();
    await portalApi.action("update_profile", profile);
    setSaved(true);
  };
  return (
    <PortalPageShell {...shells.profile}>
      <Card className="border-white/10 bg-slate-900/70 p-5">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={save}>
          <Input
            value={profile.primary_colour ?? ""}
            onChange={(e) => setProfile({ ...profile, primary_colour: e.target.value })}
            placeholder="#0f766e"
          />
          <Input
            value={profile.timezone ?? ""}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            placeholder="Timezone"
          />
          <Input
            value={profile.language ?? ""}
            onChange={(e) => setProfile({ ...profile, language: e.target.value })}
            placeholder="Language"
          />
          <Textarea
            value={profile.welcome_message ?? ""}
            onChange={(e) => setProfile({ ...profile, welcome_message: e.target.value })}
            placeholder="Portal welcome"
          />
          <Button type="submit">Save profile</Button>
          {saved ? (
            <span className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          ) : null}
        </form>
      </Card>
    </PortalPageShell>
  );
}

export function PortalSecurityPage() {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => void portalApi.module<any[]>("security").then(setEvents), []);
  return (
    <PortalPageShell {...shells.security}>
      <Card className="border-white/10 bg-slate-900/70 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <p className="font-medium">Account safeguards</p>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          MFA, password reset, active-session revocation and trusted-device controls use Supabase
          Auth. No session token is displayed here.
        </p>
      </Card>
      {events.length === 0 ? (
        <EmptyCard />
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <Card key={event.id} className="border-white/10 bg-slate-900/70 p-4">
              <p className="font-medium">{event.event_type.replaceAll("_", " ")}</p>
              <p className="text-sm text-slate-400">
                {event.device_label ?? "Device not recorded"} ·{" "}
                {new Date(event.occurred_at).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </PortalPageShell>
  );
}

function PortalPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}
function LoadingCard() {
  return (
    <Card className="border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
      Loading…
    </Card>
  );
}
function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">{message}</Card>
  );
}
function EmptyCard() {
  return (
    <Card className="border-white/10 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
      No authorised records are available.
    </Card>
  );
}
