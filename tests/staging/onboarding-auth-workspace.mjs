import { createClient } from "@supabase/supabase-js";

const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}

const runId = process.env.ONBOARDING_RUN_ID || `onboarding-${Date.now()}`;
const password = process.env.ONBOARDING_PERSONA_PASSWORD;
if (!password) throw new Error("Missing ONBOARDING_PERSONA_PASSWORD");
const baseEmail = process.env.E2E_ADMIN_EMAIL || process.env.ZAPPOS_STAGING_TEST_EMAIL;
if (!baseEmail) throw new Error("Missing staging email base");
const [local, domain] = baseEmail.split("@");
const internalEmail = `${local}+${runId}@${domain}`;
const customerEmail = `${local}+${runId}-customer@${domain}`;

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const anonymous = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});
const internal = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});
const customer = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

let assertions = 0;
const check = (condition, label, detail = undefined) => {
  if (!condition) throw new Error(`${label}${detail ? `: ${JSON.stringify(detail)}` : ""}`);
  assertions += 1;
  console.log(`PASS ${assertions}: ${label}`);
};

const createConfirmed = async (email, kind) => {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `ZappOS ${kind} ${runId}`, staging_evidence: true, run_id: runId },
  });
  if (error) throw error;
  return data.user;
};

let customerUser;
let customerMembershipId;
try {
  const unauthenticated = await anonymous.rpc("bootstrap_workspace", { _name: "Denied" });
  check(Boolean(unauthenticated.error), "unauthenticated workspace bootstrap denied");

  const internalUser = await createConfirmed(internalEmail, "onboarding");
  const signIn = await internal.auth.signInWithPassword({ email: internalEmail, password });
  if (signIn.error) throw signIn.error;

  const directInsert = await internal.from("companies").insert({
    name: `Direct denied ${runId}`,
    created_by: internalUser.id,
  });
  check(
    Boolean(directInsert.error),
    "direct company insert denied; controlled RPC is authoritative",
  );

  const payload = {
    _name: `ZappOS onboarding evidence ${runId}`,
    _business_type: "logistics",
    _country: "South Africa",
    _fleet_size: "1-5",
    _terminology: "jobs",
  };
  const created = await internal.rpc("bootstrap_workspace", payload);
  if (created.error) throw created.error;
  const companyId = created.data.company_id;
  check(created.data.status === "created" && Boolean(companyId), "atomic workspace created");

  const [members, roles, profile, audit] = await Promise.all([
    admin.from("company_members").select("id,user_id").eq("company_id", companyId),
    admin.from("user_roles").select("id,user_id,role").eq("company_id", companyId),
    admin.from("profiles").select("active_company_id").eq("id", internalUser.id).single(),
    admin
      .from("platform_audit_logs")
      .select("event_type,actor_id,metadata")
      .eq("company_id", companyId)
      .eq("event_type", "Workspace Setup Completed"),
  ]);
  check(
    members.data?.length === 1 && members.data[0].user_id === internalUser.id,
    "one membership persisted",
  );
  check(
    roles.data?.length === 1 && roles.data[0].role === "admin",
    "creator received existing admin role",
  );
  check(profile.data?.active_company_id === companyId, "active company context persisted");
  check(
    audit.data?.length === 1 && audit.data[0].actor_id === internalUser.id,
    "safe completion audit persisted",
  );

  const retries = await Promise.all([
    internal.rpc("bootstrap_workspace", payload),
    internal.rpc("bootstrap_workspace", payload),
  ]);
  check(
    retries.every((result) => !result.error && result.data.company_id === companyId),
    "parallel retry is idempotent",
    retries.map((result) => result.error?.message),
  );
  const afterRetry = await admin
    .from("companies")
    .select("id", { count: "exact" })
    .eq("created_by", internalUser.id);
  check(afterRetry.count === 1, "duplicate submission did not create another company");

  const arbitraryTarget = await internal.rpc("bootstrap_workspace", {
    ...payload,
    _user_id: crypto.randomUUID(),
  });
  check(Boolean(arbitraryTarget.error), "caller cannot nominate another bootstrap identity");

  const otherCompany = await admin
    .from("companies")
    .select("id")
    .neq("id", companyId)
    .limit(1)
    .single();
  if (otherCompany.error) throw otherCompany.error;
  const crossAttach = await internal.from("company_members").insert({
    company_id: otherCompany.data.id,
    user_id: internalUser.id,
  });
  check(Boolean(crossAttach.error), "self-attachment to another company denied");

  customerUser = await createConfirmed(customerEmail, "customer-boundary");
  const customerRecord = await admin.from("customers").select("id,company_id").limit(1).single();
  if (customerRecord.error) throw customerRecord.error;
  const membership = await admin
    .from("customer_portal_memberships")
    .insert({
      company_id: customerRecord.data.company_id,
      customer_id: customerRecord.data.id,
      user_id: customerUser.id,
      role: "manager",
      status: "active",
    })
    .select("id")
    .single();
  if (membership.error) throw membership.error;
  customerMembershipId = membership.data.id;
  const customerLogin = await customer.auth.signInWithPassword({ email: customerEmail, password });
  if (customerLogin.error) throw customerLogin.error;
  const customerBootstrap = await customer.rpc("bootstrap_workspace", {
    _name: `Customer denied ${runId}`,
  });
  check(
    Boolean(customerBootstrap.error),
    "customer portal identity cannot bootstrap internal access",
  );

  console.log(
    JSON.stringify({
      assertions,
      runId,
      retainedCompanyId: companyId,
      retainedAs: "staging onboarding evidence",
    }),
  );
} finally {
  if (customerMembershipId) {
    await admin.from("customer_portal_memberships").delete().eq("id", customerMembershipId);
  }
  if (customerUser) await admin.auth.admin.deleteUser(customerUser.id);
}
