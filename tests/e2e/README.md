# E2E notes

These smoke tests intentionally do not fake authenticated success. They cover public/auth surfaces and verify protected routes redirect when no Supabase session exists.

Authenticated staging scenarios are opt-in and require seeded Supabase credentials and company
data. Run them with `ZAPPOS_RUN_STAGING_E2E=true`, `ZAPPOS_STAGING_TEST_EMAIL`, and
`ZAPPOS_STAGING_TEST_PASSWORD`. The web server receives only the Supabase URL and publishable key;
privileged server credentials are never exposed to the browser.
