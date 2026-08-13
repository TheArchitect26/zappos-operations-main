import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeAuthError } from "@/lib/auth-errors";
import { resolveOnboardingDestination } from "@/lib/onboarding-state";

export const Route = createFileRoute("/auth_/callback")({
  head: () => ({ meta: [{ title: "Confirming your account — ZappOS" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const complete = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const callbackError = params.get("error_description") || params.get("error");
        if (callbackError) throw new Error(callbackError);

        const code = params.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error("Confirmation link is invalid or has expired.");
        console.info("[Auth] confirmation completed", { hasSession: true });
        const destination = await resolveOnboardingDestination(data.session.user);
        if (active) navigate({ to: destination, replace: true });
      } catch (cause) {
        console.warn("[Auth] confirmation failed", {
          message: cause instanceof Error ? cause.message : "unknown",
        });
        if (active) setError(normalizeAuthError(cause, "Could not confirm this account."));
      }
    };
    void complete();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      {error ? (
        <section className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Confirmation could not be completed</h1>
          <p role="alert" className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>
          <a className="mt-5 inline-block text-sm text-primary underline" href="/auth">
            Return to sign in
          </a>
        </section>
      ) : (
        <section className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Confirming your account…</h1>
        </section>
      )}
    </main>
  );
}
