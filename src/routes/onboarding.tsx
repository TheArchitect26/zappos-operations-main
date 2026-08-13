import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wordmark } from "@/components/brand/wordmark";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your workspace — ZappOS" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

const BUSINESS_TYPES = [
  ["logistics", "Logistics"],
  ["trucking", "Trucking"],
  ["courier", "Courier"],
  ["food_delivery", "Food Delivery"],
  ["last_mile", "Last Mile Delivery"],
  ["fuel_petroleum", "Fuel / Petroleum"],
  ["passenger_transport", "Passenger Transport"],
  ["other", "Other"],
] as const;
const FLEET_SIZES = ["1-5", "6-20", "21-50", "51-100", "100+"] as const;
const TERMINOLOGIES = [
  ["trips", "Trips"],
  ["jobs", "Jobs"],
  ["deliveries", "Deliveries"],
  ["loads", "Loads"],
  ["orders", "Orders"],
] as const;

function Onboarding() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<string>("logistics");
  const [country, setCountry] = useState("South Africa");
  const [fleetSize, setFleetSize] = useState<string>("6-20");
  const [terminology, setTerminology] = useState<string>("jobs");
  const [busy, setBusy] = useState(false);
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [session, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setSetupError("");
    try {
      // The database function owns the transaction and derives identity/role from auth.uid().
      const { data, error } = await (
        supabase as unknown as {
          rpc: (
            name: string,
            args: Record<string, unknown>,
          ) => Promise<{
            data: { company_id: string; status: string } | null;
            error: Error | null;
          }>;
        }
      ).rpc("bootstrap_workspace", {
        _name: name.trim(),
        _business_type: businessType,
        _country: country.trim() || null,
        _fleet_size: fleetSize,
        _terminology: terminology,
      });
      if (error) throw error;
      if (!data?.company_id) throw new Error("Workspace setup did not return a company context.");

      toast.success("Workspace ready");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const message = /email confirmation required/i.test(raw)
        ? "Your account is not verified yet. Confirm your email, then sign in again."
        : /already linked/i.test(raw)
          ? "A workspace is already linked to this account. Reload to continue."
          : /authentication required|jwt|session/i.test(raw)
            ? "Your session expired. Sign in again."
            : "We couldn't create your workspace. No changes were saved. Please try again.";
      console.warn("[Onboarding] workspace setup failed", {
        category: /42501|permission|policy/i.test(raw) ? "authorization" : "setup",
        message: raw || "unknown",
      });
      setSetupError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Wordmark size="lg" showTagline />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Set up your company workspace</CardTitle>
            <CardDescription>
              Just a few details so we can tailor ZappOS to your operation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Company name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sable Logistics"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Business type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Approximate fleet size</Label>
                  <Select value={fleetSize} onValueChange={setFleetSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FLEET_SIZES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v} vehicles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred terminology</Label>
                  <Select value={terminology} onValueChange={setTerminology}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMINOLOGIES.map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Terminology appears in the UI where practical (dashboard, dispatch, navigation).
              </p>
              <Button type="submit" className="w-full" disabled={busy || !name}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create workspace
              </Button>
              {setupError ? (
                <p role="alert" className="text-sm text-destructive">
                  {setupError}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
