import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type OnboardingState =
  | "unauthenticated"
  | "authenticated_unverified"
  | "authenticated_no_workspace"
  | "active_internal_user"
  | "customer_portal_user"
  | "access_disabled";

export function deriveOnboardingState(input: {
  authenticated: boolean;
  emailConfirmed: boolean;
  internalMemberships: number;
  customerMemberships: number;
  disabled?: boolean;
}): OnboardingState {
  if (!input.authenticated) return "unauthenticated";
  if (input.disabled) return "access_disabled";
  if (!input.emailConfirmed) return "authenticated_unverified";
  if (input.customerMemberships > 0) return "customer_portal_user";
  if (input.internalMemberships > 0) return "active_internal_user";
  return "authenticated_no_workspace";
}

export async function resolveOnboardingState(user: User): Promise<OnboardingState> {
  const [{ count: internalMemberships, error: internalError }, { count: customerMemberships }] =
    await Promise.all([
      supabase
        .from("company_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("customer_portal_memberships")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);

  return deriveOnboardingState({
    authenticated: true,
    emailConfirmed: Boolean(user.email_confirmed_at),
    internalMemberships: internalError ? 0 : (internalMemberships ?? 0),
    customerMemberships: customerMemberships ?? 0,
  });
}

export function onboardingDestination(state: OnboardingState) {
  switch (state) {
    case "customer_portal_user":
      return "/customer-portal" as const;
    case "authenticated_no_workspace":
      return "/onboarding" as const;
    case "active_internal_user":
      return "/dashboard" as const;
    default:
      return "/auth" as const;
  }
}

export async function resolveOnboardingDestination(user: User) {
  return onboardingDestination(await resolveOnboardingState(user));
}
