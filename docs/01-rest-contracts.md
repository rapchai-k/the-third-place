
# API Reference: The Third Place

This document outlines the REST API endpoints for both user and admin access. All endpoints return consistent responses in the following format:

```
Success:
{
  "status": "success",
  "data": { ... }
}

Error:
{
  "status": "error",
  "message": "Something went wrong",
  "code": "ERR_CODE",
  "details": { ... } // optional
}
```

## Auth

### `POST /auth/signup`
Creates a new user (triggered by Supabase auth).
- Body: `{ email, password, name }`
- Returns: `200 OK`

### `POST /auth/login`
Logs in an existing user.
- Body: `{ email, password }`
- Returns: `{ token }`

## Users

### `GET /user/profile`
Returns logged-in user profile.

### `PATCH /user/profile`
Update basic user profile.
- Body: `{ name, photo_url, preferences }`

### `GET /user/communities`
Returns list of joined communities.

### `GET /user/events`
Returns events user has registered for.

### `GET /user/discussions`
Returns all discussion threads in communities the user has joined.

### `GET /user/badge-status`
Returns active badges for the user.

### `GET /user/activity`
Returns high-intent user actions (tracked).

---

## Communities

### `GET /communities`
Returns all communities (with city filter)

### `GET /communities/:id`
Returns full details for a specific community.

### `GET /communities/:id/events`
Returns upcoming/past events.

### `GET /communities/:id/discussions?active=true|false`
Fetch all or active/expired threads.

### `POST /admin/community`
Create a new community (admin only).

### `PATCH /admin/community/:id`
Update community (admin only)

### `DELETE /admin/community/:id`
Delete a community

---

## Events

### `GET /events`
Returns list of all upcoming events (tag/city filters).

### `GET /events/:id`
Returns full event detail.

### `POST /events/:id/register`
Triggers payment and registration flow (user).
- Body: `{ payment_mode, coupon_code? }`

### `GET /events/:id/participants`
Backend toggle: list of users in an event (admin view).

### `PATCH /admin/event/:id`
Edit all fields including capacity, host, visibility.

### `DELETE /admin/event/:id`
Cancel/delete event.

---

## Event Registration

### `POST /payments/callback`
Handle Cashfree callback
- Body: `{ payment_id, status, metadata }`

### `POST /events/:id/cancel-registration`
For user or admin to cancel registration

---

## Discussions

### `POST /admin/discussion`
Start a new thread (admin only)
- Body: `{ community_id, title, prompt, expires_at }`

### `PATCH /admin/discussion/:id/override`
Keep thread open after expiry

### `DELETE /admin/discussion/:id`
Remove thread manually

### `POST /discussions/:id/comment`
User comment in open discussion

### `GET /discussions/:id/comments`
Return all comments for a thread

---

## Flags

### `POST /flags`
Flags a comment or user
- Body: `{ type: "comment" | "user", id: "uuid", reason }`

### `GET /admin/flags`
Returns all flagged content

### `PATCH /admin/flags/:id/resolve`
Admin override or approve action

---

## Admin Analytics

### `GET /admin/users/:id/activity`
Returns all actions for that user

### `GET /admin/events/:id/analytics`
Returns engagement, payment success, etc.

---

## Internal APIs

### `GET /internal/comms/preferences`
Notification toggle for the user

### `POST /internal/comms/track`
Tracks user actions with type
- Body: `{ type: "joined_community", user_id, object_id }`

---

## Referrals

### `GET /referral/:code`
Check referral code

### `POST /referral/apply`
Apply referral

---

## Notes

- All endpoints are RESTful
- Follow Supabase RLS for authorization
- Responses are cached (where relevant)
- All mutating routes validate auth token via Supabase JWT
