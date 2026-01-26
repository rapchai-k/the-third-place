import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
        status: (error as any)?.status,
        code: (error as any)?.code,
        message: (error as any)?.message,
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

