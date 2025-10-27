/**
 * Schema.org Structured Data Utilities
 * 
 * This module provides utilities for generating JSON-LD structured data
 * for better SEO and search engine understanding.
 * 
 * Reference: https://schema.org/
 */

import { useEffect } from 'react';

// Base Organization Schema for the entire site
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "My Third Place",
  "description": "A community platform connecting people through shared interests, events, and discussions",
  "url": "https://thethirdplace.community",
  "logo": "https://thethirdplace.community/logo.png",
  "sameAs": [
    // Add social media links here when available
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Support",
    "email": "karanrapchai@gmail.com"
  }
};

// Website Schema
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "My Third Place",
  "url": "https://thethirdplace.community",
  "description": "Connect with your community through shared spaces, events, and discussions",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://thethirdplace.community/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

// Breadcrumb List Schema
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const createBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

// Community Schema (as a Social Group)
export interface CommunitySchemaProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  memberCount?: number;
  dateCreated?: string;
  category?: string;
}

export const createCommunitySchema = (props: CommunitySchemaProps) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": props.url,
  "name": props.name,
  "description": props.description,
  "url": props.url,
  "image": props.image,
  "memberOf": {
    "@type": "Organization",
    "name": "My Third Place"
  },
  ...(props.memberCount && {
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": props.memberCount
    }
  }),
  ...(props.dateCreated && { "foundingDate": props.dateCreated }),
  ...(props.category && {
    "additionalType": `https://schema.org/${props.category}`
  })
});

// Event Schema
export interface EventSchemaProps {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  url: string;
  location?: {
    name: string;
    address?: string;
  };
  image?: string;
  organizer?: string;
  price?: number;
  currency?: string;
  eventStatus?: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventRescheduled';
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
}

export const createEventSchema = (props: EventSchemaProps) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": props.name,
  "description": props.description,
  "startDate": props.startDate,
  ...(props.endDate && { "endDate": props.endDate }),
  "url": props.url,
  "image": props.image || "https://thethirdplace.community/logo.png",
  "eventStatus": `https://schema.org/${props.eventStatus || 'EventScheduled'}`,
  "eventAttendanceMode": `https://schema.org/${props.eventAttendanceMode || 'OfflineEventAttendanceMode'}`,
  ...(props.location && {
    "location": {
      "@type": "Place",
      "name": props.location.name,
      ...(props.location.address && {
        "address": {
          "@type": "PostalAddress",
          "streetAddress": props.location.address
        }
      })
    }
  }),
  ...(props.organizer && {
    "organizer": {
      "@type": "Organization",
      "name": props.organizer,
      "url": "https://mythirdplace.rapchai.com/"
    }
  }),
  ...(props.price !== undefined && {
    "offers": {
      "@type": "Offer",
      "price": props.price,
      "priceCurrency": props.currency || "INR",
      "availability": "https://schema.org/InStock",
      "url": props.url
    }
  })
});

// Discussion/Forum Post Schema
export interface DiscussionSchemaProps {
  headline: string;
  text: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  commentCount?: number;
  image?: string;
}

export const createDiscussionSchema = (props: DiscussionSchemaProps) => ({
  "@context": "https://schema.org",
  "@type": "DiscussionForumPosting",
  "headline": props.headline,
  "text": props.text,
  "url": props.url,
  "datePublished": props.datePublished,
  "dateModified": props.dateModified || props.datePublished,
  "author": {
    "@type": "Person",
    "name": props.author.name,
    ...(props.author.url && { "url": props.author.url })
  },
  "publisher": {
    "@type": "Organization",
    "name": "My Third Place",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mythirdplace.rapchai.com/logo.png"
    }
  },
  ...(props.commentCount && { "commentCount": props.commentCount }),
  ...(props.image && {
    "image": {
      "@type": "ImageObject",
      "url": props.image
    }
  }),
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": props.url
  }
});

// Profile/Person Schema
export interface ProfileSchemaProps {
  name: string;
  url: string;
  description?: string;
  image?: string;
  joinDate?: string;
}

export const createProfileSchema = (props: ProfileSchemaProps) => ({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": props.name,
    "url": props.url,
    ...(props.description && { "description": props.description }),
    ...(props.image && { "image": props.image }),
    "memberOf": {
      "@type": "Organization",
      "name": "My Third Place"
    }
  },
  "dateCreated": props.joinDate
});

// Collection Page Schema (for listings)
export interface CollectionSchemaProps {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
}

export const createCollectionSchema = (props: CollectionSchemaProps) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": props.name,
  "description": props.description,
  "url": props.url,
  ...(props.numberOfItems && {
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": props.numberOfItems
    }
  })
});

// FAQ Schema
export interface FAQItem {
  question: string;
  answer: string;
}

export const createFAQSchema = (items: FAQItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
});

/**
 * React Hook to inject JSON-LD structured data into the page
 */
export const useStructuredData = (schema: object | object[]) => {
  useEffect(() => {
    const schemas = Array.isArray(schema) ? schema : [schema];
    const scriptElements: HTMLScriptElement[] = [];

    schemas.forEach((schemaItem, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schemaItem);
      script.id = `structured-data-${index}`;
      document.head.appendChild(script);
      scriptElements.push(script);
    });

    // Cleanup on unmount
    return () => {
      scriptElements.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [schema]);
};

/**
 * Helper to inject multiple schemas
 */
export const injectStructuredData = (schemas: object[]) => {
  schemas.forEach((schema, index) => {
    const existingScript = document.getElementById(`structured-data-${index}`);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = `structured-data-${index}`;
    document.head.appendChild(script);
  });
};

