# Standalone Zapp Brain freeze

This project is preserved as an extraction, parity-fixture, and legacy-mapping source for ZappOS
Phase 23A. It is **not** a deployable ZappOS subsystem.

Do not apply `src/lib/db/supabase-migrations.sql` or `src/lib/zapp-brain/db/migrations.sql` to
ZappOS. Do not merge this application's `App.tsx`, mock Supabase client, localStorage persistence,
identity model, business tables, workflows, action queue, connector registry, or simulated results.

ZappOS owns business facts and workflows. Zapp Brain produces evidence-linked derived intelligence.
Only dependency-free deterministic logic may be extracted after executable parity checks pass.
