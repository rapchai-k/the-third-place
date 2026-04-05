import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// In-memory rate limiter (per-process only).
// WARNING: In serverless/multi-instance deployments (e.g. Vercel) each instance
// maintains its own Map, so the effective limit per user may be multiplied by
// the number of active instances. For distributed rate limiting, replace this
// with a shared store such as Upstash Redis + @upstash/ratelimit.
const _rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_RULES = [
  { pattern: /^\/auth\/forgot-password/, maxRequests: 5, windowMs: 60_000 },
  { pattern: /^\/api\//, maxRequests: 60, windowMs: 60_000 },
] as const;

function _checkRateLimit(ip: string, patternKey: string, maxRequests: number, windowMs: number): boolean {
  const key = `${ip}:${patternKey}`;
  const now = Date.now();
  const entry = _rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    _rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

/**
 * Next.js Proxy for Supabase Auth Session Refresh
 * 
 * This proxy runs on every request and:
 * 1. Refreshes the Supabase auth session token if needed
 * 2. Ensures SSR pages have access to valid auth cookies
 * 3. Provides foundation for future route protection
 * 
 * Note: In Next.js 16+, "middleware" has been renamed to "proxy"
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Prune stale entries if store grows large (prevents unbounded memory growth)
  if (_rateLimitStore.size > 10_000) {
    const now = Date.now();
    for (const [key, val] of _rateLimitStore) {
      if (now > val.resetAt) _rateLimitStore.delete(key);
    }
  }

  const pathname = request.nextUrl.pathname;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  for (const rule of RATE_LIMIT_RULES) {
    if (rule.pattern.test(pathname)) {
      if (!_checkRateLimit(ip, rule.pattern.source, rule.maxRequests, rule.windowMs)) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' },
        });
      }
      break;
    }
  }

  // Support both naming conventions for the anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Skip proxy if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Proxy] Supabase environment variables not configured. Skipping session refresh.'
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create a new response with the updated request
          supabaseResponse = NextResponse.next({
            request,
          });
          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use destructuring like:
  // const { data: { user } } = await supabase.auth.getUser()
  // 
  // We must call getUser() to refresh the session token.
  // The actual user data is not needed here - we just need
  // the side effect of refreshing the session cookies.
  // 
  // Avoid using getSession() as it doesn't revalidate the auth token.
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs#understanding-the-middleware-flow
  //
  // NOTE:
  // In rare cases Supabase Auth can return a 500 (e.g. schema/service mismatch such as
  // "missing destination name refresh_token_hmac_key in *models.Session").
  // We should not fail the entire request in that case; just skip the refresh.
  try {
    const { error } = await supabase.auth.getUser();
    if (error) {
      console.warn('[Proxy] Supabase getUser() returned an error. Skipping session refresh.', {
        pathname: request.nextUrl?.pathname,
        status: (error as { status?: number })?.status,
        code: (error as { code?: string })?.code,
        message: (error as { message?: string })?.message,
      });
    }
  } catch (error) {
    console.warn('[Proxy] Supabase getUser() threw. Skipping session refresh.', {
      pathname: request.nextUrl?.pathname,
      error,
    });
  }

  return supabaseResponse;
}

/**
 * Matcher configuration for the proxy.
 * 
 * This runs the proxy on all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - Public assets (images, icons, etc.)
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets with common extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

