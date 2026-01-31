# Webhook System Implementation Plan

**Last Updated:** 2026-01-29  
**Status:** Planning Phase  
**Owner:** Development Team  
**Estimated Duration:** 4 weeks (no DB changes path)

---

## Executive Summary

This document outlines the implementation plan for completing the MyThirdPlace webhook system. The plan is designed to deliver **80% of functionality without database migrations**, using workarounds and external tooling where needed.

**Current State:**
- ✅ Infrastructure exists (DB tables, dispatch function, dispatcher Edge Function)
- ✅ 1/9 documented events implemented (`user.referred_user`)
- ❌ 8/9 events not wired up
- ❌ No automated dispatcher execution
- ❌ HTTP-only delivery (no SQS, Pub/Sub, Kafka support)
- ❌ No monitoring or observability

**Target State:**
- ✅ All 9 documented events emitting webhooks
- ✅ Multi-protocol support (HTTP, SQS, Pub/Sub)
- ✅ Automated dispatcher execution (external cron)
- ✅ Reliability features (exponential backoff, circuit breaker, idempotency)
- ✅ Observability (health checks, alerts, tracing)

---

## Implementation Phases

### Phase 1: Foundation & Event Wiring (Week 1)
**Goal:** Wire up all missing webhook events  
**DB Changes Required:** ❌ None

#### Tasks

| # | Task | Files to Modify | Status | Assignee | Notes |
|---|------|----------------|--------|----------|-------|
| 1.1 | Add webhook to community join | `src/views/CommunityDetailClient.tsx:172`<br>`src/views/Communities.tsx:124` | ⬜ TODO | | Call `dispatch_webhook` RPC after successful join |
| 1.2 | Add webhook to event registration (free) | `src/hooks/useEventRegistration.ts:89`<br>`src/views/EventDetailClient.tsx:96` | ⬜ TODO | | Emit `user.registered_event` |
| 1.3 | Add webhook to event registration (paid) | `supabase/functions/payment-callback/index.ts:196`<br>`supabase/functions/verify-payment/index.ts:163` | ⬜ TODO | | Emit after registration creation |
| 1.4 | Add webhook to registration cancellation | `src/hooks/useEventRegistration.ts:217` | ⬜ TODO | | Emit `user.cancelled_registration` |
| 1.5 | Add webhook to comment posting | `src/views/DiscussionDetailClient.tsx` | ⬜ TODO | | Emit `user.posted_comment` after insert |
| 1.6 | Add webhook to comment flagging | `src/views/DiscussionDetailClient.tsx:172` | ⬜ TODO | | Emit `user.flagged_comment` |
| 1.7 | Add webhook to user signup | `supabase/functions/welcome-email-trigger/index.ts` | ⬜ TODO | | Emit `user.joined_platform` (replace `user.welcome_email_sent`) |
| 1.8 | Create discussion auto-close Edge Function | `supabase/functions/close-expired-discussions/index.ts` | ⬜ TODO | | New function to close expired discussions |
| 1.9 | Setup external cron for dispatcher | `.github/workflows/webhook-dispatcher.yml` | ⬜ TODO | | GitHub Actions cron every minute |
| 1.10 | Setup external cron for discussion close | `.github/workflows/close-discussions.yml` | ⬜ TODO | | GitHub Actions cron every hour |

**Deliverables:**
- ✅ All 9 events emitting webhooks
- ✅ Automated dispatcher execution
- ✅ Discussion auto-close functionality

**Testing Checklist:**
- [ ] Create webhook configuration in DB
- [ ] Trigger each event type
- [ ] Verify webhook delivery in `webhook_deliveries` table
- [ ] Verify external endpoint receives payload
- [ ] Test dispatcher cron execution

---

### Phase 2: Multi-Protocol Support (Week 2)
**Goal:** Enable delivery to SQS, Pub/Sub, and other protocols  
**DB Changes Required:** ❌ None (using URL scheme workaround)

#### Tasks

| # | Task | Files to Create/Modify | Status | Assignee | Notes |
|---|------|----------------------|--------|----------|-------|
| 2.1 | Create adapter base interface | `supabase/functions/webhook-dispatcher/adapters/base.ts` | ⬜ TODO | | Define `DeliveryAdapter` interface |
| 2.2 | Refactor HTTP logic to adapter | `supabase/functions/webhook-dispatcher/adapters/http.ts` | ⬜ TODO | | Extract existing HTTP code |
| 2.3 | Implement SQS adapter | `supabase/functions/webhook-dispatcher/adapters/sqs.ts` | ⬜ TODO | | AWS SQS integration |
| 2.4 | Implement Pub/Sub adapter | `supabase/functions/webhook-dispatcher/adapters/pubsub.ts` | ⬜ TODO | | Google Cloud Pub/Sub |
| 2.5 | Implement Kafka adapter | `supabase/functions/webhook-dispatcher/adapters/kafka.ts` | ⬜ TODO | | Kafka producer |
| 2.6 | Create adapter factory | `supabase/functions/webhook-dispatcher/adapters/factory.ts` | ⬜ TODO | | Protocol selection logic |
| 2.7 | Update dispatcher to use adapters | `supabase/functions/webhook-dispatcher/index.ts` | ⬜ TODO | | Replace hardcoded HTTP logic |
| 2.8 | Add protocol detection from URL | `supabase/functions/webhook-dispatcher/utils.ts` | ⬜ TODO | | Parse `sqs://`, `pubsub://`, etc. |

**Protocol URL Schemes:**
- HTTP/HTTPS: `https://example.com/webhook`
- AWS SQS: `sqs://queue-url?region=us-east-1`
- Google Pub/Sub: `pubsub://project-id/topic-name`
- Kafka: `kafka://broker:9092/topic-name`

**Deliverables:**
- ✅ Adapter pattern implementation
- ✅ Support for HTTP, SQS, Pub/Sub, Kafka
- ✅ Backward compatible with existing HTTP webhooks

**Testing Checklist:**
- [ ] Test HTTP delivery (existing functionality)
- [ ] Test SQS delivery (create test queue)
- [ ] Test Pub/Sub delivery (create test topic)
- [ ] Test protocol detection from URL
- [ ] Verify error handling for invalid protocols

---

### Phase 3: Reliability & Security (Week 3)
**Goal:** Production-ready reliability features  
**DB Changes Required:** ❌ None (using in-memory state)

#### Tasks

| # | Task | Files to Modify | Status | Assignee | Notes |
|---|------|----------------|--------|----------|-------|
| 3.1 | Implement exponential backoff | `supabase/functions/webhook-dispatcher/index.ts` | ⬜ TODO | | Calculate delay: `2^attempt * 1000ms` |
| 3.2 | Add timestamp to signatures | `supabase/functions/webhook-dispatcher/index.ts:159` | ⬜ TODO | | Prevent replay attacks |
| 3.3 | Add idempotency keys | `supabase/functions/webhook-dispatcher/index.ts` | ⬜ TODO | | Add to payload generation |
| 3.4 | Implement in-memory circuit breaker | `supabase/functions/webhook-dispatcher/circuit-breaker.ts` | ⬜ TODO | | Track failures per config |
| 3.5 | Implement in-memory rate limiter | `supabase/functions/webhook-dispatcher/rate-limiter.ts` | ⬜ TODO | | Limit deliveries per minute |
| 3.6 | Add retry delay logic | `supabase/functions/webhook-dispatcher/index.ts` | ⬜ TODO | | Use `setTimeout` for backoff |

**Deliverables:**
- ✅ Exponential backoff retry strategy
- ✅ Replay attack protection
- ✅ Idempotency keys in all payloads
- ✅ Circuit breaker (in-memory, resets on restart)
- ✅ Rate limiting (in-memory)

**Testing Checklist:**
- [ ] Test retry with exponential backoff
- [ ] Verify timestamp in signature
- [ ] Test circuit breaker opens after 5 failures
- [ ] Test circuit breaker closes after success
- [ ] Verify rate limiting blocks excess requests
- [ ] Test idempotency key uniqueness

---

### Phase 4: Observability & Monitoring (Week 4)
**Goal:** Health checks, alerts, and operational visibility
**DB Changes Required:** ❌ None (query existing tables)

#### Tasks

| # | Task | Files to Create | Status | Assignee | Notes |
|---|------|----------------|--------|----------|-------|
| 4.1 | Create health check endpoint | `supabase/functions/webhook-health/index.ts` | ⬜ TODO | | Query delivery stats |
| 4.2 | Add alerting logic to dispatcher | `supabase/functions/webhook-dispatcher/alerts.ts` | ⬜ TODO | | Slack/email alerts |
| 4.3 | Implement distributed tracing | `supabase/functions/webhook-dispatcher/index.ts` | ⬜ TODO | | Add trace_id to payload |
| 4.4 | Create test webhook tool | `supabase/functions/test-webhook/index.ts` | ⬜ TODO | | Manual webhook testing |
| 4.5 | Add structured logging | All dispatcher files | ⬜ TODO | | JSON logs for parsing |
| 4.6 | Setup uptime monitoring | External service | ⬜ TODO | | UptimeRobot or Pingdom |

**Deliverables:**
- ✅ Health check endpoint (`/functions/v1/webhook-health`)
- ✅ Alerting for high failure rates
- ✅ Distributed tracing support
- ✅ Test webhook tool
- ✅ Structured logging

**Testing Checklist:**
- [ ] Health check returns correct stats
- [ ] Alert triggers on >50% failure rate
- [ ] Trace IDs propagate through system
- [ ] Test webhook tool sends to configured endpoint
- [ ] Logs are parseable JSON

---

## Progress Tracking

### Overall Progress

| Phase | Status | Progress | Completion Date |
|-------|--------|----------|-----------------|
| Phase 1: Foundation | ⬜ Not Started | 0/10 tasks | Target: Week 1 |
| Phase 2: Multi-Protocol | ⬜ Not Started | 0/8 tasks | Target: Week 2 |
| Phase 3: Reliability | ⬜ Not Started | 0/6 tasks | Target: Week 3 |
| Phase 4: Observability | ⬜ Not Started | 0/6 tasks | Target: Week 4 |

**Total Progress:** 0/30 tasks (0%)

### Event Implementation Status

| Event | Status | Implementation Location | Tested |
|-------|--------|------------------------|--------|
| `user.joined_platform` | ⬜ TODO | - | ❌ |
| `user.joined_community` | ⬜ TODO | - | ❌ |
| `user.registered_event` | ⬜ TODO | - | ❌ |
| `user.cancelled_registration` | ⬜ TODO | - | ❌ |
| `user.posted_comment` | ⬜ TODO | - | ❌ |
| `user.flagged_comment` | ⬜ TODO | - | ❌ |
| `user.referred_user` | ✅ DONE | `src/hooks/useReferrals.ts:153` | ✅ |
| `discussion.auto_closed` | ⬜ TODO | - | ❌ |
| `discussion.extended` | ⬜ TODO | - | ❌ |

**Event Progress:** 1/9 events (11%)

### Protocol Support Status

| Protocol | Status | Adapter File | Tested |
|----------|--------|--------------|--------|
| HTTP/HTTPS | ✅ DONE | `webhook-dispatcher/index.ts` | ✅ |
| AWS SQS | ⬜ TODO | - | ❌ |
| Google Pub/Sub | ⬜ TODO | - | ❌ |
| Kafka | ⬜ TODO | - | ❌ |
| AWS Lambda | ⬜ FUTURE | - | ❌ |

**Protocol Progress:** 1/4 protocols (25%)

---

## Code Implementation Examples

### Example 1: Adding Webhook to Community Join

**File:** `src/views/CommunityDetailClient.tsx`

```typescript
// After successful community join (around line 172)
if (community) {
  logCommunityJoin(id!, {
    community_name: community.name,
    community_city: community.city,
    member_count: community.community_members?.[0]?.count || 0
  });

  // ADD THIS: Dispatch webhook
  await supabase.rpc('dispatch_webhook', {
    event_type: 'user.joined_community',
    event_data: {
      community_id: id,
      community_name: community.name,
      community_city: community.city,
      member_count: (community.community_members?.[0]?.count || 0) + 1
    },
    actor_user_id: user.id
  });
}
```

### Example 2: Protocol Detection from URL

**File:** `supabase/functions/webhook-dispatcher/utils.ts`

```typescript
export function getProtocolFromUrl(url: string): string {
  if (url.startsWith('sqs://')) return 'sqs';
  if (url.startsWith('pubsub://')) return 'pubsub';
  if (url.startsWith('kafka://')) return 'kafka';
  if (url.startsWith('http://') || url.startsWith('https://')) return 'http';
  throw new Error(`Unsupported protocol in URL: ${url}`);
}

export function parseProtocolConfig(url: string): ProtocolConfig {
  const protocol = getProtocolFromUrl(url);

  switch (protocol) {
    case 'sqs':
      // Parse: sqs://queue-url?region=us-east-1
      const sqsUrl = new URL(url);
      return {
        queueUrl: sqsUrl.hostname + sqsUrl.pathname,
        region: sqsUrl.searchParams.get('region') || 'us-east-1'
      };
    case 'pubsub':
      // Parse: pubsub://project-id/topic-name
      const [projectId, topicName] = url.replace('pubsub://', '').split('/');
      return { projectId, topicName };
    // ... other protocols
  }
}
```

### Example 3: Exponential Backoff

**File:** `supabase/functions/webhook-dispatcher/index.ts`

```typescript
function calculateBackoff(attempt: number): number {
  // 2^attempt * 1000ms, max 60 seconds
  return Math.min(Math.pow(2, attempt) * 1000, 60000);
}

// In retry logic
if (!response.ok) {
  const backoffMs = calculateBackoff(delivery.attempts);

  // Log the retry schedule
  logStep("Scheduling retry", {
    deliveryId: delivery.id,
    attempt: delivery.attempts + 1,
    backoffMs
  });

  // Update delivery record with backoff info
  await supabaseClient
    .from("webhook_deliveries")
    .update({
      status: "pending",
      attempts: delivery.attempts + 1,
      last_attempt_at: new Date().toISOString(),
      error_message: errorMessage.substring(0, 500),
    })
    .eq("id", delivery.id);
}
```

---

## External Dependencies

### GitHub Actions Cron Jobs

**File:** `.github/workflows/webhook-dispatcher.yml`

```yaml
name: Webhook Dispatcher
on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:  # Allow manual trigger

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Webhook Dispatcher
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/webhook-dispatcher
```

**File:** `.github/workflows/close-discussions.yml`

```yaml
name: Close Expired Discussions
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  close:
    runs-on: ubuntu-latest
    steps:
      - name: Close Expired Discussions
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/close-expired-discussions
```

### Required Secrets

Add to GitHub repository secrets:
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for Supabase

---

## Testing Strategy

### Unit Tests

Create test files for each adapter:
- `supabase/functions/webhook-dispatcher/adapters/__tests__/http.test.ts`
- `supabase/functions/webhook-dispatcher/adapters/__tests__/sqs.test.ts`
- `supabase/functions/webhook-dispatcher/adapters/__tests__/pubsub.test.ts`

### Integration Tests

1. **End-to-End Webhook Flow**
   - Create webhook configuration
   - Trigger event (e.g., join community)
   - Verify delivery in `webhook_deliveries` table
   - Verify external endpoint receives payload

2. **Multi-Protocol Testing**
   - Setup test SQS queue
   - Setup test Pub/Sub topic
   - Send test webhooks to each
   - Verify message delivery

3. **Reliability Testing**
   - Test retry logic with failing endpoint
   - Test circuit breaker opens/closes
   - Test rate limiting blocks excess requests

### Manual Testing Checklist

- [ ] Create webhook configuration via Supabase dashboard
- [ ] Join a community and verify webhook delivery
- [ ] Register for event and verify webhook delivery
- [ ] Cancel registration and verify webhook delivery
- [ ] Post comment and verify webhook delivery
- [ ] Flag comment and verify webhook delivery
- [ ] Test SQS delivery with real queue
- [ ] Test Pub/Sub delivery with real topic
- [ ] Verify health check endpoint returns stats
- [ ] Trigger alert by causing failures
- [ ] Test webhook with invalid signature
- [ ] Test webhook with expired timestamp

---

## Monitoring & Alerts

### Health Check Endpoint

**URL:** `https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/webhook-health`

**Response:**
```json
{
  "healthy": true,
  "stats": {
    "last_hour": {
      "total": 150,
      "pending": 5,
      "delivered": 140,
      "failed": 5
    },
    "last_24_hours": {
      "total": 3600,
      "pending": 20,
      "delivered": 3500,
      "failed": 80
    }
  },
  "circuit_breakers": {
    "open": 0,
    "configs": []
  }
}
```

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Failure rate | >50% in last hour | Send Slack alert |
| Pending deliveries | >100 | Send email alert |
| Circuit breaker opens | Any | Send immediate alert |
| Dispatcher not running | >5 minutes | Send critical alert |

### Uptime Monitoring

Setup external monitoring for:
- Webhook dispatcher endpoint (should return 200)
- Health check endpoint (should return `healthy: true`)
- Discussion close function (should run hourly)

---

## Future Enhancements (Requires DB Changes)

These features are **deferred** until database migrations are approved:

### Database Migrations Needed

1. **Multi-Protocol Configuration**
   ```sql
   ALTER TABLE webhook_configurations
   ADD COLUMN delivery_protocol TEXT NOT NULL DEFAULT 'http',
   ADD COLUMN protocol_config JSONB;
   ```

2. **Dead Letter Queue**
   ```sql
   CREATE TABLE webhook_dead_letter_queue (...);
   ```

3. **Circuit Breaker Persistence**
   ```sql
   CREATE TABLE webhook_circuit_breakers (...);
   ```

4. **Metrics Aggregation**
   ```sql
   CREATE TABLE webhook_metrics (...);
   ```

5. **Database Triggers for Auto-Emission**
   ```sql
   CREATE TRIGGER on_community_member_insert ...
   CREATE TRIGGER on_event_registration_insert ...
   ```

6. **pg_cron for Automation**
   ```sql
   SELECT cron.schedule('webhook-dispatcher', '* * * * *', ...);
   ```

---

## Success Criteria

### Phase 1 Success
- [ ] All 9 events emitting webhooks
- [ ] External cron jobs running
- [ ] At least 1 successful webhook delivery per event type
- [ ] Discussion auto-close working

### Phase 2 Success
- [ ] SQS adapter delivering to test queue
- [ ] Pub/Sub adapter delivering to test topic
- [ ] Protocol detection working from URL
- [ ] Backward compatibility maintained

### Phase 3 Success
- [ ] Exponential backoff implemented
- [ ] Circuit breaker opens after 5 failures
- [ ] Idempotency keys in all payloads
- [ ] Timestamp signatures preventing replay

### Phase 4 Success
- [ ] Health check endpoint live
- [ ] Alerts triggering on failures
- [ ] Trace IDs in all deliveries
- [ ] Test webhook tool functional

### Overall Success
- [ ] 100% of documented events implemented
- [ ] 4+ protocols supported
- [ ] <5% failure rate in production
- [ ] <1 minute delivery latency (p95)
- [ ] Zero data loss (all events captured)

---

## Rollback Plan

If issues arise during implementation:

1. **Phase 1 Rollback**
   - Remove `dispatch_webhook` RPC calls from frontend
   - Disable GitHub Actions cron jobs
   - System returns to current state (only `user.referred_user` emitting)

2. **Phase 2 Rollback**
   - Revert dispatcher to HTTP-only
   - Remove adapter pattern
   - Existing HTTP webhooks continue working

3. **Phase 3 Rollback**
   - Remove backoff logic (immediate retry)
   - Disable circuit breaker
   - Remove idempotency keys

4. **Phase 4 Rollback**
   - Remove health check endpoint
   - Disable alerting
   - Remove tracing

---

## Contact & Support

**Questions or Issues?**
- Create GitHub issue with label `webhook-system`
- Tag: `@development-team`
- Slack: `#webhook-implementation`

**Documentation:**
- Webhook Spec: `docs/03-webhooks.md`
- Implementation Plan: `docs/WEBHOOK_SYSTEM_IMPLEMENTATION_PLAN.md` (this file)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Initial plan created | AI Agent |
|  |  |  |

---

## Next Steps

1. ✅ Review this plan with team
2. ⬜ Assign tasks to developers
3. ⬜ Setup GitHub Actions secrets
4. ⬜ Begin Phase 1 implementation
5. ⬜ Update progress tracking weekly

**To update progress:** Edit the status checkboxes (⬜ → ✅) and update the progress tables as tasks are completed.

