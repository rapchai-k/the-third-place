#!/usr/bin/env node

/**
 * Static Sitemap Generator
 *
 * Scans the app/ directory for page.tsx files, derives URL paths, and writes
 * a static public/sitemap.xml.  Dynamic segments like [id] are skipped
 * because they require a database lookup at runtime — those are handled by
 * the dynamic app/sitemap.ts instead.
 *
 * Usage:
 *   node scripts/generate-sitemap.mjs
 *
 * This script is also executed automatically by the post-commit git hook.
 */

import { readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, relative, sep } from 'path';

// ── Configuration ──────────────────────────────────────────────────────
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://mythirdplace.rapchai.com';
const APP_DIR = join(process.cwd(), 'app');
const OUTPUT_PATH = join(process.cwd(), 'public', 'sitemap.xml');

// Routes to exclude from the static sitemap
const EXCLUDED_PATTERNS = [
  /^\/api(\/|$)/, // API routes
  /^\/auth\/callback/, // Auth callback
  /\/loading$/, // Loading pages
  /\/not-found$/, // Not found pages
];

// Priority map for known routes
const PRIORITY_MAP = {
  '/': '1.0',
  '/communities': '0.9',
  '/events': '0.9',
  '/discussions': '0.8',
  '/auth': '0.3',
};

const DEFAULT_PRIORITY = '0.5';

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Recursively find all page.tsx files under a directory.
 */
function findPages(dir, pages = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findPages(full, pages);
    } else if (entry === 'page.tsx' || entry === 'page.ts') {
      pages.push(full);
    }
  }
  return pages;
}

/**
 * Convert a file path to a URL path.
 *   app/communities/page.tsx  →  /communities
 *   app/page.tsx              →  /
 */
function toUrlPath(filePath) {
  const rel = relative(APP_DIR, filePath)
    .replace(/(^|[\\/])page\.tsx?$/, '')
    .split(sep)
    .join('/');
  return rel === '' ? '/' : `/${rel}`;
}

/**
 * Returns true when the path contains a dynamic segment like [id].
 */
function isDynamic(urlPath) {
  return /\[.+\]/.test(urlPath);
}

/**
 * Returns true when the path matches any excluded pattern.
 */
function isExcluded(urlPath) {
  return EXCLUDED_PATTERNS.some((re) => re.test(urlPath));
}

// ── Main ───────────────────────────────────────────────────────────────

if (!existsSync(APP_DIR)) {
  console.error('❌  app/ directory not found. Run this script from the project root.');
  process.exit(1);
}

const pages = findPages(APP_DIR);
const routes = pages
  .map(toUrlPath)
  .filter((p) => !isDynamic(p) && !isExcluded(p))
  .sort();

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route === '/' ? '' : route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${PRIORITY_MAP[route] || DEFAULT_PRIORITY}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(OUTPUT_PATH, xml, 'utf-8');
console.log(`✅  Sitemap written to public/sitemap.xml (${routes.length} routes)`);
routes.forEach((r) => console.log(`   ${r}`));

