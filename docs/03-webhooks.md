### Events to emit (DB log + webhook)
- user.joined_platform
- user.joined_community (community_id)
- user.registered_event (event_id, registration_id, payment_id, status)
- user.cancelled_registration (event_id)
- user.posted_comment (discussion_id)
- user.flagged_comment (comment_id, reason)
- user.referred_user (referred_user_id)
- discussion.auto_closed (discussion_id)
- discussion.extended (discussion_id)

### Payload shape
{
  "event": "user.registered_event",
  "timestamp": "ISO-8601",
  "actor_user_id": "uuid",
  "data": { "event_id": "uuid", "registration_id": "uuid", "payment_id": "string", "status": "success|failed|pending" },
  "request_id": "uuid"
}
