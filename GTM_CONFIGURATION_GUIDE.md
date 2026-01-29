# GTM Configuration Guide for Analytics Events

This guide provides step-by-step instructions for configuring Google Tag Manager to handle all the analytics events implemented in the `enhancement/analytics-post-ssr` branch.

## Prerequisites

- GTM Container ID: `GTM-ND6D4RDP`
- GA4 Measurement ID configured in GTM
- GA4 Configuration tag already set up (from Phase 1)

## Event Configuration Pattern

For each event below, follow this pattern:

1. **Create Data Layer Variables (DLVs)**
2. **Create Custom Event Trigger**
3. **Create GA4 Event Tag**

---

## 1. Authentication Events

### Event: `login`

**Data Layer Variables:**
- Name: `dlv - method` | Variable Type: Data Layer Variable | Data Layer Variable Name: `method`
- Name: `dlv - user_id` | Variable Type: Data Layer Variable | Data Layer Variable Name: `user_id`

**Trigger:**
- Type: Custom Event
- Event name: `login`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `login`
- Event Parameters:
  - `method`: `{{dlv - method}}`
  - `user_id`: `{{dlv - user_id}}`

### Event: `sign_up`

**Data Layer Variables:**
- Name: `dlv - method` (reuse from login)
- Name: `dlv - user_id` (reuse from login)

**Trigger:**
- Type: Custom Event
- Event name: `sign_up`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `sign_up`
- Event Parameters:
  - `method`: `{{dlv - method}}`
  - `user_id`: `{{dlv - user_id}}`

### Event: `clear_user_properties`

**Trigger:**
- Type: Custom Event
- Event name: `clear_user_properties`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `logout`
- Event Parameters: (none)

---

## 2. E-commerce Events

### Event: `view_item`

**Data Layer Variables:**
- `dlv - currency` | Data Layer Variable Name: `currency`
- `dlv - value` | Data Layer Variable Name: `value`
- `dlv - items` | Data Layer Variable Name: `items`

**Trigger:**
- Type: Custom Event
- Event name: `view_item`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `view_item`
- Event Parameters:
  - `currency`: `{{dlv - currency}}`
  - `value`: `{{dlv - value}}`
  - `items`: `{{dlv - items}}`

### Event: `begin_checkout`

**Data Layer Variables:**
- `dlv - transaction_id` | Data Layer Variable Name: `transaction_id`
- `dlv - currency` (reuse)
- `dlv - value` (reuse)
- `dlv - items` (reuse)

**Trigger:**
- Type: Custom Event
- Event name: `begin_checkout`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `begin_checkout`
- Event Parameters:
  - `transaction_id`: `{{dlv - transaction_id}}`
  - `currency`: `{{dlv - currency}}`
  - `value`: `{{dlv - value}}`
  - `items`: `{{dlv - items}}`

### Event: `purchase`

**Data Layer Variables:**
- `dlv - transaction_id` (reuse)
- `dlv - currency` (reuse)
- `dlv - value` (reuse)
- `dlv - items` (reuse)

**Trigger:**
- Type: Custom Event
- Event name: `purchase`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `purchase`
- Event Parameters:
  - `transaction_id`: `{{dlv - transaction_id}}`
  - `currency`: `{{dlv - currency}}`
  - `value`: `{{dlv - value}}`
  - `items`: `{{dlv - items}}`

---

## 3. Community Events

### Event: `join_community`

**Data Layer Variables:**
- `dlv - community_id` | Data Layer Variable Name: `community_id`
- `dlv - community_name` | Data Layer Variable Name: `community_name`
- `dlv - community_city` | Data Layer Variable Name: `community_city`

**Trigger:**
- Type: Custom Event
- Event name: `join_community`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `join_community`
- Event Parameters:
  - `community_id`: `{{dlv - community_id}}`
  - `community_name`: `{{dlv - community_name}}`
  - `community_city`: `{{dlv - community_city}}`

### Event: `leave_community`

**Data Layer Variables:**
- (Reuse community DLVs from above)

**Trigger:**
- Type: Custom Event
- Event name: `leave_community`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Configuration Tag: [Your GA4 Config Tag]
- Event Name: `leave_community`
- Event Parameters: (same as join_community)

### Event: `view_community`

**Data Layer Variables:**
- (Reuse community DLVs)
- `dlv - member_count` | Data Layer Variable Name: `member_count`

**Trigger:**
- Type: Custom Event
- Event name: `view_community`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Event Name: `view_community`
- Event Parameters:
  - `community_id`: `{{dlv - community_id}}`
  - `community_name`: `{{dlv - community_name}}`
  - `community_city`: `{{dlv - community_city}}`
  - `member_count`: `{{dlv - member_count}}`

---

## 4. Discussion & Comment Events

### Event: `view_discussion`

**Data Layer Variables:**
- `dlv - discussion_id` | Data Layer Variable Name: `discussion_id`
- `dlv - discussion_title` | Data Layer Variable Name: `discussion_title`
- `dlv - community_id` (reuse)

**Trigger:**
- Type: Custom Event
- Event name: `view_discussion`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Event Name: `view_discussion`
- Event Parameters:
  - `discussion_id`: `{{dlv - discussion_id}}`
  - `discussion_title`: `{{dlv - discussion_title}}`
  - `community_id`: `{{dlv - community_id}}`

### Event: `create_comment`

**Data Layer Variables:**
- `dlv - comment_id` | Data Layer Variable Name: `comment_id`
- `dlv - discussion_id` (reuse)
- `dlv - comment_length` | Data Layer Variable Name: `comment_length`

**Trigger:**
- Type: Custom Event
- Event name: `create_comment`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Event Name: `create_comment`
- Event Parameters:
  - `comment_id`: `{{dlv - comment_id}}`
  - `discussion_id`: `{{dlv - discussion_id}}`
  - `comment_length`: `{{dlv - comment_length}}`

---

## 5. Search Event

### Event: `search`

**Data Layer Variables:**
- `dlv - search_term` | Data Layer Variable Name: `search_term`
- `dlv - search_type` | Data Layer Variable Name: `search_type`
- `dlv - results_count` | Data Layer Variable Name: `results_count`

**Trigger:**
- Type: Custom Event
- Event name: `search`

**GA4 Event Tag:**
- Tag Type: GA4 Event
- Event Name: `search`
- Event Parameters:
  - `search_term`: `{{dlv - search_term}}`
  - `search_type`: `{{dlv - search_type}}`
  - `results_count`: `{{dlv - results_count}}`

---

## Testing in GTM Preview Mode

1. **Enable Preview Mode** in GTM
2. **Navigate to your site** and perform actions
3. **Verify in GTM Preview:**
   - Event appears in the event stream
   - Data Layer Variables populate correctly
   - GA4 Event Tag fires
4. **Check GA4 Realtime:**
   - Event appears with correct name
   - Parameters are captured
   - Values are accurate

## Quick Setup Checklist

- [ ] Create all Data Layer Variables
- [ ] Create all Custom Event Triggers
- [ ] Create all GA4 Event Tags
- [ ] Test each event in Preview Mode
- [ ] Verify in GA4 Realtime
- [ ] Submit and Publish GTM Container

## Summary of Events

Total events to configure: **13**

- Authentication: 3 events (login, sign_up, logout)
- E-commerce: 3 events (view_item, begin_checkout, purchase)
- Community: 3 events (join_community, leave_community, view_community)
- Discussion: 2 events (view_discussion, create_comment)
- Search: 1 event (search)
- Page Views: 1 event (tp_page_view - already configured in Phase 1)

## Notes

- All events follow GA4 recommended event names where applicable
- E-commerce events use GA4's standard e-commerce schema
- Custom events (community, discussion) use descriptive naming
- All events include relevant context parameters for analysis

