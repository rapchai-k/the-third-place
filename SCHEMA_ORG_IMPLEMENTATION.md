# Schema.org Implementation for SEO

This document outlines the Schema.org structured data implementation across The Third Place platform for improved SEO and search engine understanding.

## Overview

All Schema.org implementations use JSON-LD format and are managed through the `@/utils/schema.ts` utility file.

Reference: https://schema.org/

## Implemented Schemas

### Global Schemas (Shared Across Site)

1. **Organization Schema** - Describes The Third Place as an organization
2. **Website Schema** - Describes the website with search capabilities

### Page-Specific Schemas

| Page | Schema Types | Purpose |
|------|--------------|---------|
| Index (Homepage) | WebSite, Organization, CollectionPage | Site identity, community listings |
| Communities | CollectionPage, BreadcrumbList | Community catalog with navigation |
| CommunityDetail | Organization, BreadcrumbList | Individual community information |
| Events | CollectionPage, BreadcrumbList | Event listings |
| EventDetail | Event, BreadcrumbList | Individual event details with rich snippets |
| Discussions | CollectionPage, BreadcrumbList | Discussion forum listings |
| DiscussionDetail | DiscussionForumPosting, BreadcrumbList | Individual discussion threads |
| Profile | ProfilePage, Person | User profile information |

## Schema Types Used

### 1. Organization Schema
Used for: Community pages, site identity
```typescript
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": string,
  "description": string,
  "url": string,
  "memberOf": {...},
  "numberOfEmployees": number,
  "foundingDate": string
}
```

### 2. Event Schema
Used for: Event pages
```typescript
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": string,
  "startDate": string,
  "endDate": string,
  "location": {...},
  "offers": {...},
  "organizer": {...}
}
```

### 3. DiscussionForumPosting Schema
Used for: Discussion threads
```typescript
{
  "@context": "https://schema.org",
  "@type": "DiscussionForumPosting",
  "headline": string,
  "text": string,
  "author": {...},
  "datePublished": string,
  "commentCount": number
}
```

### 4. BreadcrumbList Schema
Used for: All detail pages
```typescript
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

### 5. CollectionPage Schema
Used for: Listing pages
```typescript
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": string,
  "description": string,
  "mainEntity": {...}
}
```

## Implementation Status

### ✅ Completed
- [x] Schema utility functions (`src/utils/schema.ts`)
- [x] Index page (Homepage)
- [x] Communities listing page
- [x] CommunityDetail page
- [x] Events listing page

### 🔄 To Complete

Add the following to remaining pages:

#### EventDetail Page
```typescript
import { useStructuredData, createEventSchema, createBreadcrumbSchema } from "@/utils/schema";

// In component:
useStructuredData(event ? [
  createBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "Events", url: `${window.location.origin}/events` },
    { name: event.title, url: window.location.href }
  ]),
  createEventSchema({
    name: event.title,
    description: event.description,
    startDate: event.date_time,
    endDate: event.end_time,
    url: window.location.href,
    location: {
      name: event.location,
      address: event.communities?.city
    },
    price: event.price || 0,
    currency: "INR"
  })
] : []);
```

#### Discussions Page
```typescript
import { useStructuredData, createCollectionSchema, createBreadcrumbSchema } from "@/utils/schema";

useStructuredData([
  createBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "Discussions", url: window.location.href }
  ]),
  createCollectionSchema({
    name: "Community Discussions",
    description: "Browse community discussions and topics",
    url: window.location.href,
    numberOfItems: discussions?.length || 0
  })
]);
```

#### DiscussionDetail Page
```typescript
import { useStructuredData, createDiscussionSchema, createBreadcrumbSchema } from "@/utils/schema";

useStructuredData(discussion ? [
  createBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "Discussions", url: `${window.location.origin}/discussions` },
    { name: discussion.title, url: window.location.href }
  ]),
  createDiscussionSchema({
    headline: discussion.title,
    text: discussion.content,
    url: window.location.href,
    datePublished: discussion.created_at,
    dateModified: discussion.updated_at,
    author: {
      name: discussion.users?.name || 'Anonymous',
      url: `${window.location.origin}/profile/${discussion.user_id}`
    },
    commentCount: discussion.discussion_comments?.[0]?.count || 0
  })
] : []);
```

#### Profile Page
```typescript
import { useStructuredData, createProfileSchema, createBreadcrumbSchema } from "@/utils/schema";

useStructuredData(profile ? [
  createBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "Profile", url: window.location.href }
  ]),
  createProfileSchema({
    name: profile.name,
    url: window.location.href,
    description: profile.bio,
    image: profile.avatar_url,
    joinDate: profile.created_at
  })
] : []);
```

## SEO Benefits

1. **Rich Snippets**: Events, discussions, and organizations appear with enhanced information in search results
2. **Breadcrumb Navigation**: Improved site structure display in search results
3. **Knowledge Graph**: Organization information may appear in Google's Knowledge Graph
4. **Event Rich Results**: Events may appear in Google's event search and calendar
5. **Forum Markup**: Discussions appear with author, date, and comment count in search results

## Validation

Test your Schema.org implementation using:
1. [Google Rich Results Test](https://search.google.com/test/rich-results)
2. [Schema.org Validator](https://validator.schema.org/)
3. [JSON-LD Playground](https://json-ld.org/playground/)

## Best Practices

1. Always include `@context` and `@type`
2. Use specific types over generic ones (e.g., `DiscussionForumPosting` over `Article`)
3. Include all required properties for each schema type
4. Use absolute URLs for all URL fields
5. Keep structured data synced with visible page content
6. Test schema markup before deployment

## Future Enhancements

- [ ] Add Review schema for community ratings
- [ ] Add FAQ schema for help pages
- [ ] Add VideoObject schema if video content is added
- [ ] Add Product schema for paid features/events
- [ ] Add LocalBusiness schema if physical locations are added
- [ ] Add Article schema for blog posts



