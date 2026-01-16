import type { Metadata } from 'next';
import './globals.css';
import '@/index.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'My Third Place',
    template: '%s | My Third Place',
  },
  description:
    'Discover local communities and events with My Third Place - where communities come alive. Find and join communities, attend events, and engage in meaningful discussions.',
  keywords: [
    'community',
    'local events',
    'third place',
    'social spaces',
    'community events',
    'local communities',
    'meetups',
    'discussions',
  ],
  authors: [{ name: 'My Third Place' }],
  creator: 'My Third Place',
  publisher: 'My Third Place',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://mythirdplace.com'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'My Third Place',
    title: 'My Third Place',
    description:
      'Discover local communities and events with My Third Place - where communities come alive.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'My Third Place',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mythirdplace',
    title: 'My Third Place',
    description:
      'Discover local communities and events with My Third Place - where communities come alive.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

