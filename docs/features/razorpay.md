# Razorpay Payment Integration

**Last Updated:** January 29, 2026  
**Status:** Active (Cashfree migration complete)  
**Payment Gateway:** Razorpay (Payment Links API)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Payment Flow](#payment-flow)
4. [Components](#components)
5. [Database Schema](#database-schema)
6. [Environment Variables](#environment-variables)
7. [Known Issues & Fixes](#known-issues--fixes)
8. [Testing Guide](#testing-guide)
9. [Migration from Cashfree](#migration-from-cashfree)

---

## Overview

The platform uses **Razorpay Payment Links** for processing event registration payments. This approach:
- Provides a hosted payment page (no PCI compliance burden)
- Supports multiple payment methods (UPI, cards, netbanking, wallets)
- Uses webhooks for reliable payment confirmation
- Falls back to polling if webhooks fail

### Payment Gateways

| Gateway | Status | Notes |
|---------|--------|-------|
| Razorpay | ✅ Active | Primary payment gateway |
| Cashfree | ❌ Deprecated | Legacy - removed Jan 2026 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PAYMENT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Client (Browser)              Edge Functions              Database │
│   ─────────────────             ──────────────              ──────── │
│                                                                      │
│   PaymentButton.tsx ──────────► create-payment ────────► payment_   │
│         │                             │                    sessions  │
│         │                             │                       │      │
│         │                             ▼                       │      │
│         │                    Razorpay API                     │      │
│         │                 (Create Payment Link)               │      │
│         │                             │                       │      │
│         ◄─────────────────────────────┘                       │      │
│         │                                                     │      │
│    Opens payment                                              │      │
│    page in new tab                                            │      │
│         │                                                     │      │
│         │                                                     │      │
│   (User pays)                                                 │      │
│         │                                                     │      │
│         ├───────────────► Callback URL ──────────────────────►│      │
│         │                  (payment-success page)             │      │
│         │                                                     │      │
│         │                payment-callback ◄── Razorpay Webhook│      │
│         │                      │                              │      │
│         │                      ▼                              │      │
│         │               Update payment_sessions               │      │
│         │               Create event_registrations            │      │
│         │                                                     │      │
│   PaymentButton ──────► verify-payment ─────────────────────►│      │
│   (polling fallback)         │                                │      │
│         │                    ▼                                │      │
│         │              Check Razorpay API                     │      │
│         │              Update if paid                         │      │
│         │              Create registration (fallback)         │      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow

### Step-by-Step Flow

1. **User Initiates Payment**
   - User clicks "Pay {currency} {price}" button
   - `PaymentButton.tsx` validates user authentication

2. **Payment Session Created**
   - `create-payment` Edge Function called
   - Creates `payment_sessions` record with `status: pending`, `payment_status: yet_to_pay`
   - Creates Razorpay Payment Link via API
   - Returns payment URL to client

3. **User Completes Payment**
   - Payment page opens in new tab
   - User completes payment on Razorpay
   - Razorpay redirects to `/payment-success?session_id={id}`

4. **Payment Confirmation (Dual Path)**
   
   **Path A: Webhook (Primary)**
   - Razorpay sends webhook to `payment-callback` Edge Function
   - Signature verified using `RZP_WEBHOOK_SECRET`
   - `payment_sessions` updated to `status: completed`, `payment_status: paid`
   - `event_registrations` record created

   **Path B: Polling (Fallback)**
   - `PaymentButton.tsx` polls `verify-payment` every 5 seconds
   - Checks Razorpay API for payment status
   - Creates registration if webhook failed

5. **User Sees Confirmation**
   - `PaymentSuccess.tsx` shows payment status
   - Auto-refreshes until payment is confirmed or timeout

---

## Components

### Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| PaymentButton | `src/components/PaymentButton.tsx` | Initiates payment, handles polling |
| PaymentSuccess | `src/views/PaymentSuccess.tsx` | Shows payment result page |

### Edge Functions

| Function | Path | Purpose |
|----------|------|---------|
| create-payment | `supabase/functions/create-payment/` | Creates payment session & Razorpay link |
| verify-payment | `supabase/functions/verify-payment/` | Verifies payment status via Razorpay API |
| payment-callback | `supabase/functions/payment-callback/` | Handles Razorpay webhooks |

---

## Database Schema

### payment_sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (used as `reference_id` in Razorpay) |
| user_id | UUID | User making the payment |
| event_id | UUID | Event being registered for |
| amount | DECIMAL(10,2) | Payment amount |
| currency | TEXT | Currency code (INR) |
| status | TEXT | Session status: pending/completed/expired/cancelled |
| payment_status | payment_status | Payment state: yet_to_pay/paid/failed/expired/cancelled/refunded |
| gateway | TEXT | Always 'razorpay' |
| razorpay_payment_link_id | TEXT | Razorpay Payment Link ID |
| razorpay_payment_id | TEXT | Razorpay Payment ID (after success) |
| payment_url | TEXT | Razorpay short URL |
| created_at | TIMESTAMPTZ | Creation timestamp |
| expires_at | TIMESTAMPTZ | Session expiry (default: 1 hour) |

### Status Transitions

```
                                    ┌──────────────────────────────────────┐
                                    │                                      │
payment_status: yet_to_pay ─────────┼──────────────────────► paid          │
                    │               │                          │           │
                    │  (user pays)  │                          │           │
                    │               │                          ▼           │
                    │               │              registration created    │
                    │               │                                      │
                    │  (link expires)                                      │
                    ├───────────────┼──────────────────────► expired       │
                    │               │                                      │
                    │  (user cancels registration after paying)            │
                    │               └──────────────────────► cancelled ◄───┘
                    │
                    │  (payment fails)
                    └──────────────────────────────────────► failed

status:        pending ─────► completed (if paid)
                    │
                    ├─────► expired (if link expires)
                    │
                    └─────► cancelled (if user cancels)
```

**Terminal States (allow retry):** `failed`, `expired`, `cancelled`
**Success State:** `paid`
**Pending State:** `yet_to_pay`
**Future State:** `refunded` (for refund processing)

---

## Environment Variables

### Required Secrets (Supabase Edge Functions)

| Variable | Description | Example |
|----------|-------------|---------|
| `RZP_LIVE_KEY_ID` | Live Razorpay Key ID | `rzp_live_xxxxx` |
| `RZP_LIVE_KEY_SECRET` | Live Razorpay Key Secret | `xxxxx` |
| `RZP_LIVE_WEBHOOK_SECRET` | Live Webhook signature secret | `xxxxx` |
| `RZP_TEST_KEY_ID` | Test mode Key ID (fallback) | `rzp_test_xxxxx` |
| `RZP_TEST_KEY_SECRET` | Test mode Key Secret (fallback) | `xxxxx` |
| `RZP_WEBHOOK_SECRET` | Test Webhook secret (fallback) | `xxxxx` |
| `RZP_BASE_URL` | API base URL (optional) | `https://api.razorpay.com` |

> **Note:** Live keys (`RZP_LIVE_*`) take precedence over test keys (`RZP_TEST_*`).

### Setting Up Secrets

```bash
# Via Supabase CLI
supabase secrets set RZP_LIVE_KEY_ID="rzp_live_xxx"
supabase secrets set RZP_LIVE_KEY_SECRET="secret_xxx"
supabase secrets set RZP_LIVE_WEBHOOK_SECRET="webhook_xxx"
```

Or via Supabase Dashboard: **Settings → Functions → Secrets**

---

## Known Issues & Fixes

### Issue #1: Race Condition on Registration Creation

**Problem:** Both webhook and polling can create registrations simultaneously.

**Fix:** Add unique constraint and use upsert:

```sql
ALTER TABLE event_registrations
ADD CONSTRAINT event_registrations_event_user_unique
UNIQUE (event_id, user_id);
```

### Issue #2: Missing Payment ID in verify-payment

**Problem:** `verify-payment` doesn't update `razorpay_payment_id`.

**Fix:** Extract from Razorpay Payment Link response's `payments` array.

### Issue #3: No Failed Payment UI

**Problem:** `PaymentSuccess.tsx` doesn't show failure state.

**Fix:** Add case for failed status with `XCircle` icon.

---

## Testing Guide

### Test Mode Setup

1. Use test credentials (`RZP_TEST_KEY_ID`, `RZP_TEST_KEY_SECRET`)
2. Test cards: https://razorpay.com/docs/payments/payments/test-card-details/

### Test Card Numbers

| Card Number | Description |
|-------------|-------------|
| 4111 1111 1111 1111 | Success |
| 5267 3181 8797 5449 | Mastercard Success |
| 4000 0000 0000 0002 | Failure |

### Webhook Testing

1. Configure webhook in Razorpay Dashboard
2. Enable events: `payment_link.paid`, `payment.captured`, `payment.failed`
3. Check Razorpay Dashboard → Webhooks → Logs

### End-to-End Test

1. Create a paid event (price > 0)
2. Click "Pay" button as authenticated user
3. Complete payment with test card
4. Verify:
   - `payment_sessions` has `status: completed`, `payment_status: paid`
   - `event_registrations` has matching record
   - `payment_logs` has webhook events logged

---

## Migration from Cashfree

### Background

The platform originally used Cashfree (July-December 2025). Migration to Razorpay was completed in January 2026.

### What Changed

| Before (Cashfree) | After (Razorpay) |
|-------------------|------------------|
| `cashfree_order_id` | `razorpay_payment_link_id` |
| `cashfree_payment_id` | `razorpay_payment_id` |
| Gateway: 'cashfree' | Gateway: 'razorpay' |
| Cashfree Orders API | Razorpay Payment Links API |

### Cleanup Completed

1. ✅ Edge functions updated for Razorpay-only
2. ✅ Frontend components updated
3. ✅ Environment documentation updated
4. ✅ Database columns cleaned up (migration: `20260129000001_remove_cashfree_columns.sql`)
5. ✅ TypeScript types updated to remove Cashfree fields

### Environment Cleanup

Remove from Supabase secrets (if not already done):
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`

---

## Troubleshooting

### 500 Error on create-payment

1. Check Supabase Function logs
2. Verify `RZP_KEY_ID` and `RZP_KEY_SECRET` are set
3. Enable `DEBUG_MODE=true` for verbose logging

### Webhook Not Firing

1. Verify webhook URL: `{SUPABASE_URL}/functions/v1/payment-callback`
2. Check Razorpay Dashboard → Webhooks → Logs
3. Verify `RZP_WEBHOOK_SECRET` matches dashboard

### Stuck "Processing..." State

1. Check `payment_sessions` for session status
2. Verify Razorpay API reachable from Edge Functions
3. Manually call verify-payment to force status check

### Duplicate Registrations

1. Add unique constraint (see Issue #1 fix)
2. Check `event_registrations` for duplicates
3. Review `payment_logs` for multiple webhook deliveries

