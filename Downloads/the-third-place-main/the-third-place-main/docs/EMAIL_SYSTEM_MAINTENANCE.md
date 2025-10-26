# Email System Maintenance

This document provides practical guidance to maintain, debug, and extend the email system.

## Overview

The email system consists of Supabase Edge Functions and database structures:
- Edge Functions:
  - welcome-email-trigger: Orchestrates welcome email sending on signup
  - send-email: Sends emails via Resend API
  - webhook-dispatcher: (optional) Dispatches analytics webhooks for email events
- Database:
  - email_logs: Tracks email delivery attempts and outcomes
  - users.welcome_email_sent_at: Prevents duplicate welcome emails

## Tables and Fields

### email_logs
Purpose: Persist delivery tracking for all outbound emails.

Columns:
- id (uuid, PK, default gen_random_uuid())
- recipient (text, required)
- subject (text, required)
- message_id (text, provider message id if available)
- status (text, one of: pending, sent, failed, pending_trigger, failed_trigger)
- provider (text, e.g., "resend")
- error_message (text, optional)
- sent_at (timestamptz, when provider accepted the send)
- created_at (timestamptz)
- updated_at (timestamptz, maintained by trigger)

Indexes: recipient, status, sent_at, created_at

RLS: Insert/Update allowed to service; admins can select. See migrations for exact policies.

### users.welcome_email_sent_at
Purpose: Marks when the welcome email was sent to enforce idempotency.

Behavior:
- welcome-email-trigger checks this field before sending
- On successful send, the field is updated to current timestamp

## Correlation IDs

A correlationId is generated per request by welcome-email-trigger and propagated to downstream calls (e.g., send-email and webhook-dispatcher) via the `x-correlation-id` header and tags. Use it to stitch logs across functions and to search provider logs if supported.

## Deploy Checklist

Use this before/after deploying email-related functions.

1) Preconditions
- Supabase project ref present in supabase/config.toml (project_id)
- Secrets configured in Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
- Verified sender configured in Resend (currently: onboarding@rapchai.com)

2) Deploy
- supabase functions deploy send-email
- supabase functions deploy welcome-email-trigger
- supabase functions deploy webhook-dispatcher (if used)

3) Verify
- supabase functions list (check ACTIVE status, version bump)
- Send a test request to welcome-email-trigger with a test user payload
- Check email_logs for a new row with status sent and message_id
- Confirm the test email is received

4) Rollback Plan
- Keep previous function code in git
- If deploy causes issues, redeploy previous commit or set the sender to onboarding@resend.dev temporarily

## Troubleshooting

- Resend API error / Unknown error
  - Ensure the From address uses a verified domain (onboarding@rapchai.com)
  - Verify RESEND_API_KEY, no typos, correct environment
  - Check Resend dashboard Activity for the event and error message

- Missing environment variables
  - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for server-side supabase-js
  - RESEND_API_KEY must be set for send-email

- Duplicate emails
  - Confirm welcome_email_sent_at logic; ensure DB update succeeds post-send
  - Check that SQL triggers aren’t firing multiple times

- Emails not sending from SQL trigger
  - DB functions use pg_net with current_setting('app.supabase_url') and current_setting('app.service_role_key')
  - If these settings aren’t configured, email_logs may show pending_trigger; configure settings or trigger via application code

## Extending the System

- Add new templates in supabase/functions/shared/email-templates.ts
- Add a new Edge Function for specific email types or reuse send-email
- Consider an EMAIL_FROM secret to control sender per environment
- Add provider webhooks to update email_logs on delivered/bounced events (via webhook-dispatcher)

