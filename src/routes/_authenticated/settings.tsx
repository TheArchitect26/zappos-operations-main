import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bell, Building2, Plug, Save, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ZappOS" }] }),
  component: SettingsPage,
});

type SaveTarget = "profile" | "company" | "operations" | "notifications";
type NotificationCategory = "jobs" | "incidents" | "messages" | "compliance" | "sync" | "system";
type NotificationSetting = { enabled: boolean; background: boolean };
const notificationCategories: NotificationCategory[] = [
  "jobs",
  "incidents",
  "messages",
  "compliance",
  "sync",
  "system",
];

async function settingsRpc(name: string, args: Record<string, unknown>) {
  const result = await (
    supabase as unknown as {
      rpc: (rpcName: string, rpcArgs: Record<string, unknown>) => Promise<{ error: Error | null }>;
    }
  ).rpc(name, args);
  if (result.error) throw result.error;
}

function SettingsPage() {
  const { activeCompany, roles, refresh } = useCompany();
  const { user } = useSession();
  const companyId = activeCompany?.id;
  const canManageCompany = roles.includes("admin");
  const canManageOperations = roles.some((role) => role === "admin" || role === "fleet_manager");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState<SaveTarget | null>(null);
  const [profile, setProfile] = useState({ fullName: "", phone: "" });
  const [company, setCompany] = useState({
    name: "",
    country: "",
    terminology: "jobs",
    warningDays: 30,
  });
  const [operations, setOperations] = useState({
    liveSeconds: 60,
    recentSeconds: 300,
    offlineSeconds: 1800,
    refreshSeconds: 30,
    timezone: "UTC",
  });
  const [notifications, setNotifications] = useState<
    Record<NotificationCategory, NotificationSetting>
  >(
    Object.fromEntries(
      notificationCategories.map((category) => [category, { enabled: true, background: false }]),
    ) as Record<NotificationCategory, NotificationSetting>,
  );
  const [integrationSummary, setIntegrationSummary] = useState({
    total: 0,
    connected: 0,
    degraded: 0,
  });

  const load = useCallback(async () => {
    if (!companyId || !user) return;
    setLoading(true);
    const [profileResult, trackingResult, notificationResult, integrationResult] =
      await Promise.all([
        supabase.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle(),
        supabase
          .from("tracking_operational_settings")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle(),
        supabase
          .from("mobile_notification_preferences")
          .select("category,enabled,background_allowed")
          .eq("company_id", companyId)
          .eq("user_id", user.id)
          .is("device_id", null),
        supabase.from("integration_connections").select("status").eq("company_id", companyId),
      ]);
    const error =
      profileResult.error ||
      trackingResult.error ||
      notificationResult.error ||
      integrationResult.error;
    if (error) {
      toast.error("Settings could not be loaded. Please refresh and try again.");
      setLoading(false);
      setInitialized(true);
      return;
    }
    setProfile({
      fullName: profileResult.data?.full_name ?? "",
      phone: profileResult.data?.phone ?? "",
    });
    setCompany({
      name: activeCompany.name,
      country: activeCompany.country ?? "",
      terminology: activeCompany.terminology,
      warningDays: activeCompany.document_expiry_warning_days,
    });
    if (trackingResult.data) {
      setOperations({
        liveSeconds: trackingResult.data.live_seconds,
        recentSeconds: trackingResult.data.recent_seconds,
        offlineSeconds: trackingResult.data.offline_seconds,
        refreshSeconds: trackingResult.data.tracking_refresh_seconds,
        timezone: trackingResult.data.timezone,
      });
    }
    setNotifications((current) => {
      const next = { ...current };
      for (const row of notificationResult.data ?? []) {
        if (notificationCategories.includes(row.category as NotificationCategory))
          next[row.category as NotificationCategory] = {
            enabled: row.enabled,
            background: row.background_allowed,
          };
      }
      return next;
    });
    const statuses = (integrationResult.data ?? []).map(({ status }) => status);
    setIntegrationSummary({
      total: statuses.length,
      connected: statuses.filter((status) => status === "connected" || status === "active").length,
      degraded: statuses.filter((status) => status === "degraded" || status === "error").length,
    });
    setLoading(false);
    setInitialized(true);
  }, [activeCompany, companyId, user]);

  useEffect(() => void load(), [load]);

  const save = async (target: SaveTarget, action: () => Promise<void>) => {
    setSaving(target);
    try {
      await action();
      if (target === "company") await refresh();
      else await load();
      toast.success("Settings saved");
    } catch (error) {
      console.warn("[Settings] governed save failed", {
        target,
        message: error instanceof Error ? error.message : "unknown",
      });
      toast.error("Settings could not be saved. Check the values and your access, then try again.");
    } finally {
      setSaving(null);
    }
  };

  if (!companyId || !user) return null;

  if (!initialized)
    return (
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading persisted settings…</p>
        </div>
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Governed account, company, operations, and notification preferences.
        </p>
      </div>

      <fieldset disabled={loading || saving !== null} className="min-w-0">
        <Tabs defaultValue="account">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="account">My account</TabsTrigger>
            {canManageCompany ? <TabsTrigger value="company">Company</TabsTrigger> : null}
            {canManageOperations ? <TabsTrigger value="operations">Operations</TabsTrigger> : null}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <SettingsCard
              icon={UserRound}
              title="My account"
              description="These details belong to your ZappOS profile."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input
                    aria-label="Full name"
                    value={profile.fullName}
                    onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    aria-label="Phone"
                    value={profile.phone}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                  />
                </Field>
              </div>
              <SaveButton
                loading={loading || saving === "profile"}
                onClick={() =>
                  void save("profile", () =>
                    settingsRpc("update_my_profile_settings", {
                      _company_id: companyId,
                      _full_name: profile.fullName,
                      _phone: profile.phone || null,
                    }),
                  )
                }
              />
            </SettingsCard>
          </TabsContent>

          <TabsContent value="company">
            <SettingsCard
              icon={Building2}
              title="Company"
              description="Changes apply to this workspace and are audited."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name">
                  <Input
                    aria-label="Company name"
                    value={company.name}
                    onChange={(event) => setCompany({ ...company, name: event.target.value })}
                  />
                </Field>
                <Field label="Country">
                  <Input
                    aria-label="Country"
                    value={company.country}
                    onChange={(event) => setCompany({ ...company, country: event.target.value })}
                  />
                </Field>
                <Field label="Terminology">
                  <select
                    aria-label="Terminology"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={company.terminology}
                    onChange={(event) =>
                      setCompany({ ...company, terminology: event.target.value })
                    }
                  >
                    {["jobs", "trips", "deliveries", "loads", "orders"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Document expiry warning (days)">
                  <Input
                    aria-label="Document expiry warning (days)"
                    type="number"
                    min={1}
                    max={365}
                    value={company.warningDays}
                    onChange={(event) =>
                      setCompany({ ...company, warningDays: Number(event.target.value) })
                    }
                  />
                </Field>
              </div>
              <SaveButton
                loading={loading || saving === "company"}
                onClick={() =>
                  void save("company", () =>
                    settingsRpc("update_company_settings", {
                      _company_id: companyId,
                      _name: company.name,
                      _country: company.country,
                      _terminology: company.terminology,
                      _document_expiry_warning_days: company.warningDays,
                    }),
                  )
                }
              />
            </SettingsCard>
          </TabsContent>

          <TabsContent value="operations">
            <SettingsCard
              icon={Wrench}
              title="Tracking operations"
              description="Uses the existing live-tracking configuration authority."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField
                  label="Live threshold (seconds)"
                  value={operations.liveSeconds}
                  onChange={(liveSeconds) => setOperations({ ...operations, liveSeconds })}
                />
                <NumberField
                  label="Recent threshold (seconds)"
                  value={operations.recentSeconds}
                  onChange={(recentSeconds) => setOperations({ ...operations, recentSeconds })}
                />
                <NumberField
                  label="Offline threshold (seconds)"
                  value={operations.offlineSeconds}
                  onChange={(offlineSeconds) => setOperations({ ...operations, offlineSeconds })}
                />
                <NumberField
                  label="Map refresh (seconds)"
                  value={operations.refreshSeconds}
                  onChange={(refreshSeconds) => setOperations({ ...operations, refreshSeconds })}
                />
                <Field label="Timezone">
                  <Input
                    aria-label="Timezone"
                    value={operations.timezone}
                    onChange={(event) =>
                      setOperations({ ...operations, timezone: event.target.value })
                    }
                  />
                </Field>
              </div>
              <SaveButton
                loading={loading || saving === "operations"}
                onClick={() =>
                  void save("operations", () =>
                    settingsRpc("upsert_tracking_settings", {
                      _company_id: companyId,
                      _live_seconds: operations.liveSeconds,
                      _recent_seconds: operations.recentSeconds,
                      _offline_seconds: operations.offlineSeconds,
                      _tracking_refresh_seconds: operations.refreshSeconds,
                      _timezone: operations.timezone,
                    }),
                  )
                }
              />
            </SettingsCard>
          </TabsContent>

          <TabsContent value="notifications">
            <SettingsCard
              icon={Bell}
              title="Notification preferences"
              description="Preferences persist per user. Delivery still depends on a configured provider and browser permission."
            >
              <div className="divide-y rounded-md border">
                {notificationCategories.map((category) => (
                  <div key={category} className="flex items-center gap-4 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium capitalize">{category}</div>
                      <div className="text-xs text-muted-foreground">In-app/mobile preference</div>
                    </div>
                    <Switch
                      checked={notifications[category].enabled}
                      aria-label={`Enable ${category} notifications`}
                      onCheckedChange={(enabled) =>
                        setNotifications({
                          ...notifications,
                          [category]: { ...notifications[category], enabled },
                        })
                      }
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <Switch
                        checked={notifications[category].background}
                        aria-label={`Allow ${category} in background`}
                        onCheckedChange={(background) =>
                          setNotifications({
                            ...notifications,
                            [category]: { ...notifications[category], background },
                          })
                        }
                      />
                      Background
                    </label>
                  </div>
                ))}
              </div>
              <SaveButton
                loading={loading || saving === "notifications"}
                onClick={() =>
                  void save("notifications", async () => {
                    for (const category of notificationCategories)
                      await settingsRpc("upsert_my_notification_setting", {
                        _company_id: companyId,
                        _category: category,
                        _enabled: notifications[category].enabled,
                        _background_allowed: notifications[category].background,
                      });
                  })
                }
              />
            </SettingsCard>
          </TabsContent>

          <TabsContent value="integrations">
            <SettingsCard
              icon={Plug}
              title="Integrations"
              description="Provider secrets remain in the approved vault and are never entered here."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Configured" value={integrationSummary.total} />
                <Metric label="Connected" value={integrationSummary.connected} />
                <Metric label="Degraded" value={integrationSummary.degraded} />
              </div>
              <Button asChild variant="outline">
                <Link to="/integrations">Open governed integration workspace</Link>
              </Button>
            </SettingsCard>
          </TabsContent>
          <TabsContent value="security">
            <SettingsCard
              icon={ShieldCheck}
              title="Security"
              description="Sessions, access evidence, and security controls remain in the dedicated governed workspace."
            >
              <p className="text-sm text-muted-foreground">
                Your current roles: {roles.join(", ").replaceAll("_", " ") || "none"}.
              </p>
              <Button asChild variant="outline">
                <Link to="/security">Open security workspace</Link>
              </Button>
            </SettingsCard>
          </TabsContent>
        </Tabs>
      </fieldset>
    </main>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-4 space-y-5 p-5">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <Input
        aria-label={label}
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}
function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <Button disabled={loading} onClick={onClick}>
      <Save className="mr-2 h-4 w-4" />
      {loading ? "Saving…" : "Save changes"}
    </Button>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
