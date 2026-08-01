/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { portalApi } from "@/lib/customer-portal-api";

export const Route = createFileRoute("/customer-portal/settings")({
  head: () => ({ meta: [{ title: "Settings — Customer portal" }] }),
  component: CustomerSettingsPage,
});

function CustomerSettingsPage() {
  const { session } = useSession();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      setLoading(true);
      setPreferences(await portalApi.module("preferences"));
      setLoading(false);
    };
    void load();
  }, [session?.user?.id]);

  const save = async () => {
    if (!session?.user?.id || !preferences) return;
    await portalApi.action("update_preferences", preferences);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Portal settings</p>
        <h2 className="mt-2 text-2xl font-semibold">Preferences</h2>
        <p className="mt-2 text-sm text-slate-400">
          Choose which customer-visible updates you would like to receive.
        </p>
      </div>

      {loading ? (
        <Card className="border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
          Loading preferences...
        </Card>
      ) : (
        <Card className="border-white/10 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-slate-400" />
            <p className="font-medium text-white">Email-ready notifications</p>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Preferences are stored only. Email delivery is not configured in this portal.
          </p>
          <div className="mt-4 space-y-3">
            {[
              ["shipment_updates", "Shipment updates"],
              ["delivery_updates", "Delivery"],
              ["delay_updates", "Delay updates"],
              ["proof_updates", "Proof available"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm text-slate-200">
                <span>{label}</span>
                <Switch
                  checked={Boolean(preferences?.[key])}
                  onCheckedChange={(checked) =>
                    setPreferences((current: any) => ({ ...current, [key]: checked }))
                  }
                />
              </label>
            ))}
          </div>
          <Button className="mt-4" onClick={save}>
            Save preferences
          </Button>
        </Card>
      )}
    </div>
  );
}
