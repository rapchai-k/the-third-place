# Pending Features Implementation Plan

## Current Status: Backend Features Phase

Last updated: 2025-08-25

### Phase 1: Payment Integration ⏳
**Cashfree Payment Integration**

#### 1.1 Payment Edge Functions
- [x] `supabase/functions/create-payment/index.ts` - Initialize payment session
- [x] `supabase/functions/payment-callback/index.ts` - Handle Cashfree webhooks (signature verification placeholder; implement HMAC-SHA256)
- [x] `supabase/functions/verify-payment/index.ts` - Verify payment status

#### 1.2 Database Updates
- [x] Add payment tables (payment_sessions, payment_logs)
- [x] Update event_registrations with payment flow (payment_session_id)
- [x] Add price and currency fields to events table

#### 1.3 Frontend Integration
- [x] Payment component for event registration (PaymentButton)
- [x] Payment status tracking (PaymentSuccess + verify-payment)
- [x] Payment history page (PaymentHistory)

**Required Secrets:**
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`

---

### Phase 2: Analytics & Activity Logging ⏳
**User Activity Logging and Analytics Tracking**

#### 2.1 Activity Logging System
- [x] `supabase/functions/log-activity/index.ts` - Log user actions
- [🟡] Activity logging hooks and utilities (useActivityLogger; certain passive logs temporarily disabled)
- [ ] Real-time activity triggers

#### 2.2 Analytics Dashboard
- [ ] Admin analytics page
- [ ] User engagement metrics
- [ ] Event performance tracking
- [ ] Community growth analytics

#### 2.3 Event Tracking
- [ ] User journey tracking
- [ ] Conversion funnel analysis
- [ ] Retention metrics

---

### Phase 3: Webhook System ⏳
**n8n Compatible Webhook System**

### Completed: Email System ✅
- Welcome email flow implemented via Supabase Edge Functions
  - welcome-email-trigger (orchestrates/guards idempotency)
  - send-email (Resend integration)
  - webhook-dispatcher (optional analytics)
- Database:
  - users.welcome_email_sent_at for idempotency
  - email_logs for delivery tracking
- Tests: see src/test/integration/email-service.integration.test.ts
- Maintenance guide: docs/EMAIL_SYSTEM_MAINTENANCE.md

#### 3.1 Webhook Infrastructure
- [x] `supabase/functions/webhook-dispatcher/index.ts` - Dispatcher for queued deliveries (batch + retries)
- [x] Webhook registration system (`webhook_configurations` table with RLS)
- [x] Event-driven webhook triggers (DB function to enqueue deliveries)

#### 3.2 Webhook Events
- [🟡] User registration webhooks (partially emitted; see welcome email flow)
- [🟡] Community join/leave webhooks (wiring pending)
- [🟡] Event registration webhooks (payment flows emit events/logs; enqueue integration pending)
- [🟡] Discussion activity webhooks (wiring pending)
- [🟡] Payment status webhooks (callback in place; enqueue integration pending)

#### 3.3 Webhook Management (Admin Panel)
- [ ] Webhook configuration UI (admin)
- [ ] Webhook testing tools
- [ ] Webhook delivery status tracking

---

### Phase 4: Referral System ✅ (Core flow complete)
**Referral code copy behavior, signup rules, and dashboard implemented**

#### 4.1 Backend Logic
- [ ] `supabase/functions/process-referral/index.ts` - Not required (handled via app logic + DB)
- [x] Referral code validation system (alphanumeric code handling; no URL input)
- [ ] Referral rewards logic (pending)

#### 4.2 Frontend Components
- [x] Referral code entry during signup (shown in sign-up, hidden in sign-in; OAuth modal)
- [x] Referral dashboard for users
- [🟡] Referral analytics and tracking (basic tracking present; advanced analytics pending in Admin Panel)

#### 4.3 Database Enhancements
- [ ] Referral rewards table
- [ ] Referral campaign tracking
- [ ] Referral performance metrics

---

## Implementation Priority

### High Priority (Week 1-2)
1. **Payment Integration** - Core revenue functionality
2. **Activity Logging** - Essential for analytics and user tracking

### Medium Priority (Week 3-4)  
3. **Webhook System** - Automation and integration capabilities
4. **Referral System** - Growth and user acquisition

---

## Technical Dependencies

### External Services
- **Cashfree**: Payment processing
- **n8n**: Workflow automation (webhook consumer)

### Database Migrations Needed
- Payment-related tables
- Enhanced activity logging structure
- Webhook configuration tables
- Referral rewards system

### Security Considerations
- Payment data encryption
- Webhook signature verification
- Rate limiting for all endpoints
- Audit trails for sensitive operations

---

## Next Development Steps

1. **Immediate**: Start with Cashfree payment integration
2. **Following**: Implement comprehensive activity logging
3. **Then**: Build webhook infrastructure for n8n
4. **Finally**: Complete referral system with rewards

Each phase includes proper testing, error handling, and documentation.