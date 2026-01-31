# Edge Functions Catalog

This document lists the Supabase Edge Functions used in "The Third Place". All functions are located in `supabase/functions/`.

## 1. Payments (`razorpay`)

### `create-payment`
- **Purpose**: Initiates a payment session.
- **Input**: `{ amount, currency, description, ... }`
- **Output**: `{ paymentUrl, sessionId }`
- **Integrations**: Razorpay Payment Links API.

### `verify-payment`
- **Purpose**: Polls Razorpay to check the status of a specific payment link.
- **Input**: `{ sessionId }`
- **Output**: `{ status: 'paid' | 'pending' | ... }`

### `payment-callback`
- **Purpose**: Receives webhooks from Razorpay.
- **Trigger**: `payment_link.paid`, `payment.failed`, etc.
- **Action**: Updates `payment_sessions` and creates/cancels `event_registrations`.

## 2. Email System (`resend`)

### `welcome-email-trigger`
- **Purpose**: Sends a welcome email to new users.
- **Trigger**: Database Webhook (on `users` insert) or Manual API call.
- **Action**: Calls `send-email` and updates `users.welcome_email_sent_at`.

### `send-email`
- **Purpose**: Generic email sender wrapper around Resend.
- **Input**: `{ to, subject, html, ... }`
- **Logs**: Writes entry to `email_logs`.

### `manage-email-template` / `get-email-template`
- **Purpose**: CRUD operations for dynamic email templates (if implemented).

### `email-log-check`
- **Purpose**: Periodic check or diagnostic tool for email delivery status.

## 3. Operations & Analytics

### `log-activity`
- **Purpose**: Centralized logging for user actions (e.g., "User joined community").
- **Usage**: Called by other functions or client-side (via RPC/Edge Function).

### `webhook-dispatcher`
- **Purpose**: Fans out internal events to external webhooks (e.g., n8n, Slack).
- **Trigger**: System events (New Event, New Payment).

## 4. Shared Code
- `shared/`: Contains shared TypeScript interfaces, CORS headers, and utility functions used by multiple functions.
