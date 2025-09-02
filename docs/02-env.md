Set in Supabase/Lovable env, not in repo:
- SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY
- GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET (Supabase Auth → Google provider)
- CASHFREE_APP_ID, CASHFREE_SECRET_KEY (sandbox/prod)
- RESEND_API_KEY (for automated email notifications)
- EMAIL/WA/SMS provider keys (when enabled)


## Branding & Icons Setup

- Transparent favicon and PWA icons are generated from logo-transparent.png using ImageMagick
- Files in public/: favicon.ico, favicon-16.png, favicon-32.png, favicon-48.png, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest, logo.png, logo-transparent.png
- index.html head includes:
  - <link rel="manifest" href="/site.webmanifest" />
  - <link rel="icon" href="/favicon.ico" sizes="any" />
  - <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
  - <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
- Social cards intentionally use /logo.png (white background):
  - <meta property="og:image" content="/logo.png" />
  - <meta name="twitter:image" content="/logo.png" />


## Email Service Configuration

### Resend API Setup
The application uses Resend for automated email delivery. To enable email functionality:

1. Create a Resend account: https://resend.com
2. In Resend, go to Settings → API Keys → Create API Key (Server)
3. In Supabase project: Dashboard → Settings → Functions → Secrets → Add `RESEND_API_KEY`
4. Verify a sender domain in Resend (DNS): Settings → Domains → Add Domain
   - Current verified sender: onboarding@rapchai.com

Helpful links:
- Resend Dashboard: https://resend.com/dashboard
- Resend Activity (deliveries): https://resend.com/dashboard/activity
- Resend Webhooks: https://resend.com/docs/webhooks

### Verified Sender Domain
Resend requires sending from a verified domain to avoid errors. Use a verified address (e.g., onboarding@rapchai.com). For non-verified testing, you can temporarily use onboarding@resend.dev.

### Email Features
- Welcome Emails: Automatically sent to new users upon signup via Edge Functions
- Event Reminders: Future
- Notifications: Future

### Email Templates
- Location: supabase/functions/shared/email-templates.ts
- Customize generateWelcomeEmailTemplate and add new templates as needed

### Testing Email Delivery
Option A: End-to-end via signup
1. Create a user (Google OAuth or email/password)
2. Check email_logs for a row with subject “Welcome to My Third Place - Your Community Awaits!”
3. Verify inbox delivery; cross-check Resend Activity

Option B: Direct Function call
1. Invoke POST {SUPABASE_URL}/functions/v1/welcome-email-trigger with JSON body:
   { "userId": "<uuid>", "userEmail": "test@rapchai.com", "userName": "Test" }
2. Headers: Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}, Content-Type: application/json
3. Check response JSON for success and correlationId, and inspect email_logs

### Troubleshooting
- Resend API errors: Verify sender domain and RESEND_API_KEY; inspect Resend Activity
- Missing env vars: Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY set in Supabase
- Delivery failures: Inspect email_logs.error_message and provider logs; verify template renders; test with a different recipient
- SQL trigger not calling function: Ensure pg_net is enabled and Postgres settings app.supabase_url and app.service_role_key are configured (migrations reference current_setting)

