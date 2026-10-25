# Clinic and optional AI service

The app has real service integration code but no connected Supabase project, clinic accounts, AI provider key, or deployed HTTPS website. Disconnected installations state this explicitly. No sample plan is presented as if a doctor sent it; imported JSON plan authors are unverified. Normal camera coaching does not record or upload.

## Configure a staging service

1. Create your own Supabase project. Apply `supabase/migrations/202610250001_clinic.sql` through the project's migration workflow. It creates the private video bucket, approved-clinician records, single-use expiring invitations, care connections, plans, clip metadata, row-level security, and an AI request budget.
2. Enable email authentication. Configure the actual web origin and allowed redirect URLs in Supabase Auth. Customize the magic-link email template to include the one-time `{{ .Token }}` code. The in-app code field is needed on iPhone because opening an email link in Safari does not share the WKWebView's PKCE storage. Do not include any secret in the template.
3. Copy `.env.example` to `.env.local` at the repository root. Set `VITE_SUPABASE_URL` and the project's **public publishable key**. The legacy public anon key also works with the SDK. Rebuild/restart Vite after changing these. Never use a service-role or OpenAI key in any `VITE_*` or `EXPO_PUBLIC_*` variable.
4. Create staging patient and clinician accounts. Verify clinician identity/professional status outside the app, then have a service administrator insert an approved `clinician_profiles` record for that account. Patients cannot approve themselves; there is no client-accessible role assignment.
5. The approved clinician can create a 24-hour one-use invitation. The patient enters it, verifies the care connection, and receives plans for that connection. Clinicians choose each movement, individual instructions, and optional rep target; patient guides show those instructions and targets. Existing exercise safety holds still apply.
6. Record or select a clip, review its contents, verify the selected care connection, and explicitly consent to upload. The patient inserts metadata, uploads into the private bucket, and finalizes the record. Only successfully finalized uploads appear as shared. Video is never included in an AI request.

The server enforces participation rather than trusting a client-selected ID. Clip links expire after 180 seconds. Disconnecting removes the clinician's ability to request new links, but cannot revoke already downloaded copies or immediately invalidate an issued signed link. Patients retain access to delete their own stored clips, including after disconnecting. Cleanup errors and partially completed uploads need operational monitoring on a real service. There is no unattended retention/deletion job or account-deletion workflow yet; build those before a patient-facing release.

Plan-file shape for offline review:

```json
{
  "title": "My clinician's plan",
  "notes": "Individual restrictions and progression supplied by the clinician.",
  "items": [
    {
      "exerciseId": "bicep-curl",
      "note": "Individual range and equipment instructions.",
      "reps": 3
    }
  ]
}
```

This is a format example, not a treatment recommendation. Importing a file does not authenticate its author. Maximum 12 unique known exercises, bounded notes, and optional integer targets of 1–200 are accepted. Equipment protocols still require clinician instruction.

## Optional AI explanation

The soreness follow-up works locally without AI. It screens the written description plus onset, discomfort, normal function, and warning-sign answers. It does not diagnose delayed-onset soreness or distinguish it from an injury. Only a mild, post-activity, normally functioning, no-warning-sign check-in can produce a general recovery-day draft; this draft does not prescribe stretches or strengthening. Concerning or unclear cases pause exercise suggestions.

To enable an AI explanation, deploy `supabase/functions/recovery-assistant/index.ts`. The function imports the same screening rules as the UI. Its CORS allowlist must contain your actual app origin(s) in `APP_ALLOWED_ORIGINS`. It verifies the bearer token with Supabase Auth itself (see `supabase/config.toml`), limits requests to 3/minute and 20/day per user, and requires `OPENAI_API_KEY` **as a server-side Supabase function secret**. `OPENAI_MODEL` can optionally select a compatible Responses API model. The default is `gpt-4.1-mini`.

The user must deliberately opt in before sending the description and follow-up answers to the configured OpenAI service. No journal, clinic messages, or video are attached. The request uses `store:false`; this is not a claim about all provider retention or contractual handling. Review the actual provider agreement and privacy disclosures. The model can explain the fixed general draft and suggest clinician questions; it cannot supply an individualized exercise prescription, override the screening gate, or mark a movement as safe. Provider availability, cost, and real staging responses have not been verified with a live key.

## Validation and release limits

`npm run test:clinic` executes the actual migration against an embedded PostgreSQL engine (PGlite), including its real SQL row-level policies and pgcrypto invitation functions. It checks role escalation, invitation reuse, account isolation, plan permissions, clip ownership/finalization, disconnect, deletion, and rate limits. Auth and storage schemas are fixtures resembling Supabase; this is not an end-to-end test of Supabase Auth, Storage HTTP, signed links, email delivery, or a deployed Edge Function.

`deno check supabase/functions/recovery-assistant/index.ts` checks the function's types. Browser checks cover plan import, metadata validation, recording/stop/review cleanup, no automatic upload, native bridge messages, and disconnected states. Before real patient use, validate deployed Auth/Storage policies with separate real accounts, establish verified clinician onboarding, explicit consent, data minimization/retention, account deletion, audit/incident processes, and applicable health-data agreements. Do not describe this implementation as clinically validated, HIPAA certified, or approved for clinical use.
