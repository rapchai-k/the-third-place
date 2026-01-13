Set in Supabase/Lovable env, not in repo:
- SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY
- GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET (Supabase Auth → Google provider)
- RZP_KEY_ID, RZP_KEY_SECRET, RZP_WEBHOOK_SECRET (production/test)
- RZP_BASE_URL (https://api.razorpay.com for production, default if not set)
- CASHFREE_APP_ID, CASHFREE_SECRET_KEY (LEGACY - kept for grace period on existing payments)
- RESEND_API_KEY (for automated email notifications)
- EMAIL/WA/SMS provider keys (when enabled)


## Payment Gateway Setup (Razorpay)

### Razorpay Account Setup
1. Create a Razorpay account: https://razorpay.com
2. Get credentials from Dashboard → Settings → API Keys:
   - Test Mode: Key ID starts with `rzp_test_`
   - Live Mode: Key ID starts with `rzp_live_`
3. Set up webhook in Razorpay Dashboard → Settings → Webhooks:
   - Endpoint URL: `{SUPABASE_URL}/functions/v1/payment-callback`
   - Events to enable: `payment_link.paid`, `payment.captured`, `payment.failed`, `payment_link.cancelled`, `payment_link.expired`
   - Copy the Webhook Secret for signature verification

### Supabase Edge Function Secrets
Add these secrets in Supabase Dashboard → Settings → Functions → Secrets:

**For Test Mode:**
- `RZP_TEST_KEY_ID` - Your Razorpay Test Key ID (starts with `rzp_test_`)
- `RZP_TEST_KEY_SECRET` - Your Razorpay Test Key Secret

**For Production Mode:**
- `RZP_KEY_ID` - Your Razorpay Live Key ID (starts with `rzp_live_`)
- `RZP_KEY_SECRET` - Your Razorpay Live Key Secret

**Common (required for both):**
- `RZP_WEBHOOK_SECRET` - Your Razorpay Webhook Secret
- `RZP_BASE_URL` (optional) - Defaults to https://api.razorpay.com

> Note: Production keys take precedence. If both are set, `RZP_KEY_*` will be used.

### Testing Payments
1. Use Razorpay test mode credentials
2. Test card numbers: https://razorpay.com/docs/payments/payments/test-card-details/
3. Check payment_sessions table for gateway='razorpay' entries
4. Verify webhooks in Razorpay Dashboard → Settings → Webhooks → Logs


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

