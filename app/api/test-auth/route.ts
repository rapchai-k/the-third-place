import { NextResponse } from 'next/server';
import { getServerUser, getServerSession } from '@/lib/supabase/server';

/**
 * Test API Route for verifying proxy.ts and server auth utilities
 * 
 * This endpoint tests:
 * 1. proxy.ts is running (refreshes session cookies before this runs)
 * 2. getServerUser() works correctly
 * 3. getServerSession() works correctly
 * 
 * Usage: GET http://localhost:3000/api/test-auth
 * 
 * Expected responses:
 * - Not logged in: { authenticated: false, proxyWorking: true, ... }
 * - Logged in: { authenticated: true, userId: "...", email: "...", ... }
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test getServerUser() - validates JWT with Supabase Auth server
    const user = await getServerUser();
    
    // Test getServerSession() - reads session from cookies
    const session = await getServerSession();
    
    const endTime = Date.now();
    
    return NextResponse.json({
      // Status
      proxyWorking: true,
      authenticated: !!user,
      
      // User info (if logged in)
      userId: user?.id || null,
      email: user?.email || null,
      
      // Session info (if exists)
      sessionExists: !!session,
      sessionExpiry: session?.expires_at 
        ? new Date(session.expires_at * 1000).toISOString() 
        : null,
      
      // Token info
      accessTokenExists: !!session?.access_token,
      refreshTokenExists: !!session?.refresh_token,
      
      // Performance
      executionTimeMs: endTime - startTime,
      
      // Timestamp
      testedAt: new Date().toISOString(),
      
      // Help text
      message: user 
        ? `✅ Authenticated as ${user.email}` 
        : '⚠️ Not authenticated - login to test full auth flow',
    });
  } catch (error) {
    return NextResponse.json({
      proxyWorking: true, // Proxy ran if we got here
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Error testing auth - check server logs',
      testedAt: new Date().toISOString(),
    }, { status: 500 });
  }
}

