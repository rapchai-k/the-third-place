'use client';

/**
 * Google Tag Manager Component
 *
 * Injects GTM scripts into the page. Uses Next.js Script component
 * for optimal loading performance.
 *
 * @see docs/GA4_GTM_IMPLEMENTATION_PLAN.md for full implementation details
 */

import Script from 'next/script';
import { useEffect } from 'react';
import { analytics } from '@/utils/analytics';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * GTM Script Component - renders the main GTM script tag
 */
export function GoogleTagManagerScript(): JSX.Element | null {
  useEffect(() => {
    // Initialize analytics on mount
    analytics.init();
  }, []);

  if (!GTM_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GTM] NEXT_PUBLIC_GTM_ID is not set. GTM will not load.');
    }
    return null;
  }

  return (
    <Script
      id="gtm-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `,
      }}
    />
  );
}

/**
 * GTM NoScript Component - renders the noscript fallback
 * Should be placed immediately after the opening <body> tag
 */
export function GoogleTagManagerNoScript(): JSX.Element | null {
  if (!GTM_ID) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}

export default GoogleTagManagerScript;

