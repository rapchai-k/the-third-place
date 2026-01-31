# Webhook System - Quick Reference Guide

**For:** AI Agents & Developers  
**Last Updated:** 2026-01-29

---

## System Overview

The MyThirdPlace webhook system allows external integrations (n8n, CRMs, analytics tools) to receive real-time notifications when platform events occur.

**Architecture:**
```
Event Occurs → dispatch_webhook() → webhook_deliveries table → webhook-dispatcher → External Endpoint
```

---

## Key Files & Locations

### Database
- **Tables:** `webhook_configurations`, `webhook_deliveries`
- **Function:** `dispatch_webhook(event_type, event_data, actor_user_id)`
- **Migrations:** `supabase/migrations/20250807145041_*.sql`

### Edge Functions
- **Dispatcher:** `supabase/functions/webhook-dispatcher/index.ts`
- **Health Check:** `supabase/functions/webhook-health/index.ts` (to be created)
- **Test Tool:** `supabase/functions/test-webhook/index.ts` (to be created)

### Frontend
- **Activity Logger:** `src/hooks/useActivityLogger.ts` (for analytics, NOT webhooks)
- **Referrals:** `src/hooks/useReferrals.ts:153` (only implemented webhook)

### Documentation
- **Spec:** `docs/03-webhooks.md`
- **Implementation Plan:** `docs/WEBHOOK_SYSTEM_IMPLEMENTATION_PLAN.md`
- **Progress Tracker:** `docs/WEBHOOK_PROGRESS_TRACKER.md`
- **This Guide:** `docs/WEBHOOK_SYSTEM_QUICK_REFERENCE.md`

---

## How to Emit a Webhook

### Method 1: From Frontend/Edge Function (Current Approach)

```typescript
import { supabase } from '@/integrations/supabase/client';

// After successful action
await supabase.rpc('dispatch_webhook', {
  event_type: 'user.joined_community',
  event_data: {
    community_id: communityId,
    community_name: communityName,
    // ... other relevant data
  },
  actor_user_id: user.id
});
```

### Method 2: From Database Trigger (Future - Requires Migration)

```sql
CREATE OR REPLACE FUNCTION emit_community_join_webhook()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM dispatch_webhook(
    'user.joined_community',
    jsonb_build_object('community_id', NEW.community_id),
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_community_member_insert
AFTER INSERT ON community_members
FOR EACH ROW EXECUTE FUNCTION emit_community_join_webhook();
```

---

## Event Types & Payloads

### Standard Payload Structure

```json
{
  "event": "user.joined_community",
  "timestamp": "2026-01-29T12:34:56.789Z",
  "actor_user_id": "uuid-of-user",
  "data": {
    "community_id": "uuid",
    "community_name": "Bangalore Bikers",
    "community_city": "Bangalore"
  },
  "request_id": "unique-uuid-for-tracing"
}
```

### Event Catalog

| Event | Data Fields | When to Emit |
|-------|-------------|--------------|
| `user.joined_platform` | `user_id`, `email`, `name` | After user signup (auth.users INSERT) |
| `user.joined_community` | `community_id`, `community_name`, `community_city` | After community_members INSERT |
| `user.registered_event` | `event_id`, `registration_id`, `payment_id`, `status` | After event_registrations INSERT |
| `user.cancelled_registration` | `event_id`, `registration_id` | After event_registrations DELETE |
| `user.posted_comment` | `discussion_id`, `comment_id`, `comment_text` | After discussion_comments INSERT |
| `user.flagged_comment` | `comment_id`, `flagged_user_id`, `reason` | After comment flag action |
| `user.referred_user` | `referred_user_id`, `referrer_id`, `referral_code` | After referral applied |
| `discussion.auto_closed` | `discussion_id`, `closed_at` | When discussion expires |
| `discussion.extended` | `discussion_id`, `new_expires_at` | When admin extends discussion |

---

## Testing Webhooks

### 1. Create Webhook Configuration

```sql
-- Via Supabase SQL Editor
INSERT INTO webhook_configurations (name, url, events, secret_key, is_active, created_by)
VALUES (
  'Test Webhook',
  'https://webhook.site/your-unique-url',  -- Use webhook.site for testing
  ARRAY['user.joined_community', 'user.registered_event'],
  'your-secret-key',
  true,
  'your-user-id'
);
```

### 2. Trigger Event

```typescript
// Join a community via UI or API
// Or manually call:
await supabase.rpc('dispatch_webhook', {
  event_type: 'user.joined_community',
  event_data: { community_id: 'test-id' },
  actor_user_id: 'test-user-id'
});
```

### 3. Verify Delivery

```sql
-- Check webhook_deliveries table
SELECT * FROM webhook_deliveries
WHERE event_type = 'user.joined_community'
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Manually Trigger Dispatcher

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/webhook-dispatcher
```

---

## Common Issues & Solutions

### Issue: Webhook not delivered

**Check:**
1. Is webhook configuration `is_active = true`?
2. Does `events` array include the event type?
3. Is delivery in `webhook_deliveries` table?
4. What is the `status`? (pending/delivered/failed)
5. Check `error_message` column for details

**Solution:**
```sql
-- Check configuration
SELECT * FROM webhook_configurations WHERE is_active = true;

-- Check deliveries
SELECT id, event_type, status, attempts, error_message
FROM webhook_deliveries
WHERE webhook_config_id = 'your-config-id'
ORDER BY created_at DESC;
```

### Issue: Dispatcher not running

**Check:**
1. Is GitHub Actions cron job setup?
2. Check workflow runs in GitHub Actions tab
3. Verify `SUPABASE_SERVICE_ROLE_KEY` secret exists

**Solution:**
- Manually trigger: GitHub Actions → Webhook Dispatcher → Run workflow
- Or use curl command above

### Issue: Event not emitting

**Check:**
1. Is `dispatch_webhook` RPC call in the code?
2. Check browser console for errors
3. Verify user has permission to call RPC

**Solution:**
- Add `dispatch_webhook` call after successful action
- Check Supabase logs for RPC errors

---

## Webhook Signature Verification

Webhooks include HMAC-SHA256 signature in `X-Webhook-Signature` header.

### Verify in Receiver

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = 'sha256=' + hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, 'your-secret-key');
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  res.status(200).send('OK');
});
```

---

## Multi-Protocol Support (Phase 2)

### URL Schemes

| Protocol | URL Format | Example |
|----------|-----------|---------|
| HTTP/HTTPS | `https://domain.com/path` | `https://api.example.com/webhooks` |
| AWS SQS | `sqs://queue-url?region=region` | `sqs://my-queue?region=us-east-1` |
| Google Pub/Sub | `pubsub://project-id/topic-name` | `pubsub://my-project/webhooks` |
| Kafka | `kafka://broker:port/topic` | `kafka://localhost:9092/events` |

### Configuration

```sql
-- HTTP (current)
INSERT INTO webhook_configurations (name, url, events, ...)
VALUES ('HTTP Webhook', 'https://example.com/webhook', ...);

-- SQS (Phase 2)
INSERT INTO webhook_configurations (name, url, events, ...)
VALUES ('SQS Queue', 'sqs://my-queue?region=us-east-1', ...);

-- Pub/Sub (Phase 2)
INSERT INTO webhook_configurations (name, url, events, ...)
VALUES ('Pub/Sub Topic', 'pubsub://my-project/webhooks', ...);
```

---

## Monitoring

### Health Check (Phase 4)

```bash
curl https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/webhook-health
```

### Key Metrics

```sql
-- Delivery success rate (last 24 hours)
SELECT 
  COUNT(*) FILTER (WHERE status = 'delivered') * 100.0 / COUNT(*) as success_rate
FROM webhook_deliveries
WHERE created_at > now() - interval '24 hours';

-- Failed deliveries
SELECT event_type, COUNT(*), MAX(error_message)
FROM webhook_deliveries
WHERE status = 'failed'
GROUP BY event_type;

-- Pending deliveries (should be low)
SELECT COUNT(*) FROM webhook_deliveries WHERE status = 'pending';
```

---

## Quick Commands

```bash
# Trigger dispatcher manually
curl -X POST -H "Authorization: Bearer $SERVICE_KEY" \
  https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/webhook-dispatcher

# Test webhook delivery
curl -X POST -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.webhook","event_data":{}}' \
  https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/test-webhook

# Check health
curl https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/webhook-health
```

---

## For AI Agents

When asked to implement webhook functionality:

1. **Check if event is in the catalog** (see Event Catalog above)
2. **Find the trigger point** (where the action occurs in code)
3. **Add `dispatch_webhook` RPC call** after successful action
4. **Include relevant data** in `event_data` object
5. **Test the implementation** (see Testing Webhooks section)
6. **Update progress tracker** (`docs/WEBHOOK_PROGRESS_TRACKER.md`)

**Example workflow:**
```
User asks: "Add webhook for when user joins community"
→ Check catalog: ✅ user.joined_community exists
→ Find trigger: src/views/CommunityDetailClient.tsx:172
→ Add RPC call after successful join
→ Test with webhook.site
→ Update progress tracker
```

---

**Need more details?** See `docs/WEBHOOK_SYSTEM_IMPLEMENTATION_PLAN.md`

