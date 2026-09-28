<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/21d8a362-e3f7-4056-b655-a0614cdc0bdb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm ci`
2. Copy `.env.example` to `.env.local` and add the Firebase and Supabase public configuration.
3. Run the app with its local notification API:
   `npm run dev`

## Read-only live-data preview

To review the upgraded interface against the existing v1 Supabase records without
allowing the local app to change them, add these values to `.env.local`:

```env
VITE_READ_ONLY_MODE=true
VITE_LOCAL_DATA_PREVIEW=true
```

Then run `npm run dev:vite`. The local-only Admin preview loads the live
submissions and mentor directory, hides all mutation controls, and rejects any
write that reaches the storage service. The preview bypass is also guarded by
`import.meta.env.DEV`, so it cannot be enabled by a production build.

Keep both flags unset or `false` in Vercel. `.env.local` is ignored by Git and
must never be committed.

## Database compatibility

The upgraded v1 app continues to read and write the original
`leadership_growth_log` table. Existing four-section answer JSON is normalized
in memory so it remains visible alongside the optional Section 5 and Section 6
fields. The SQL in `supabase/schema.sql` is additive and does not drop, rename,
truncate, or copy the submissions table.

## Supabase mentor OTP email

The mentor login uses a six-digit Supabase email OTP. In Supabase, open
**Authentication → Email Templates → Magic Link** and use the code-only template
in `supabase/email-templates/mentor-otp.html`.

The template intentionally contains `{{ .Token }}` and no
`{{ .ConfirmationURL }}`. School mail security tools can pre-open confirmation
links and consume the token before the teacher enters the six-digit code.
