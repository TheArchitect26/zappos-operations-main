import { describe, expect, it } from "vitest";
import { deriveOnboardingState, onboardingDestination } from "@/lib/onboarding-state";
import { isEmailConfirmationPending, normalizeAuthError } from "@/lib/auth-errors";

describe("authentication and onboarding state", () => {
  it("keeps unauthenticated users at auth", () => {
    const state = deriveOnboardingState({
      authenticated: false,
      emailConfirmed: false,
      internalMemberships: 0,
      customerMemberships: 0,
    });
    expect(state).toBe("unauthenticated");
    expect(onboardingDestination(state)).toBe("/auth");
  });

  it("requires confirmation before workspace setup", () => {
    const state = deriveOnboardingState({
      authenticated: true,
      emailConfirmed: false,
      internalMemberships: 0,
      customerMemberships: 0,
    });
    expect(state).toBe("authenticated_unverified");
    expect(onboardingDestination(state)).toBe("/auth");
  });

  it("routes a confirmed new internal user to onboarding", () => {
    const state = deriveOnboardingState({
      authenticated: true,
      emailConfirmed: true,
      internalMemberships: 0,
      customerMemberships: 0,
    });
    expect(state).toBe("authenticated_no_workspace");
    expect(onboardingDestination(state)).toBe("/onboarding");
  });

  it("routes existing internal and customer users to their own products", () => {
    expect(
      onboardingDestination(
        deriveOnboardingState({
          authenticated: true,
          emailConfirmed: true,
          internalMemberships: 1,
          customerMemberships: 0,
        }),
      ),
    ).toBe("/dashboard");
    expect(
      onboardingDestination(
        deriveOnboardingState({
          authenticated: true,
          emailConfirmed: true,
          internalMemberships: 0,
          customerMemberships: 1,
        }),
      ),
    ).toBe("/customer-portal");
  });

  it("treats a no-session signup response as confirmation pending", () => {
    expect(
      isEmailConfirmationPending({
        session: null,
        user: { email_confirmed_at: null, identities: [{}] },
      }),
    ).toBe(true);
  });

  it("provides useful confirmation and rate-limit errors without internals", () => {
    expect(normalizeAuthError({ code: "email_not_confirmed" })).toMatch(/confirm/i);
    expect(normalizeAuthError({ status: 429, message: "rate limit" })).toMatch(/wait/i);
  });
});
