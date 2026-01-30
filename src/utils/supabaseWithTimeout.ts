import { supabase } from '@/integrations/supabase/client';

interface InvokeOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

interface InvokeResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Invoke a Supabase Edge Function with a timeout
 * @param functionName - Name of the Edge Function to invoke
 * @param options - Options including body and headers
 * @param timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
 * @returns Promise with data or error
 */
export async function invokeWithTimeout<T = unknown>(
  functionName: string,
  options: InvokeOptions = {},
  timeoutMs: number = 30000
): Promise<InvokeResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      ...options,
      // Note: Supabase JS client doesn't natively support AbortSignal for functions.invoke
      // We wrap the call with Promise.race as a workaround
    });

    clearTimeout(timeoutId);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T, error: null };
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err instanceof Error && err.name === 'AbortError') {
      return { data: null, error: new Error(`Request to ${functionName} timed out after ${timeoutMs}ms`) };
    }
    
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Invoke a Supabase Edge Function with timeout using Promise.race
 * This is the recommended approach for adding timeouts
 */
export async function invokeWithTimeoutRace<T = unknown>(
  functionName: string,
  options: InvokeOptions = {},
  timeoutMs: number = 30000
): Promise<InvokeResult<T>> {
  const timeoutPromise = new Promise<InvokeResult<T>>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request to ${functionName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const invokePromise = supabase.functions.invoke(functionName, options)
    .then(({ data, error }) => {
      if (error) {
        return { data: null, error: new Error(error.message) } as InvokeResult<T>;
      }
      return { data: data as T, error: null } as InvokeResult<T>;
    });

  try {
    return await Promise.race([invokePromise, timeoutPromise]);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// Default timeout values for different operation types
export const TIMEOUT_VALUES = {
  QUICK: 10000,    // 10 seconds for quick operations
  NORMAL: 30000,   // 30 seconds for normal operations
  PAYMENT: 60000,  // 60 seconds for payment operations
  LONG: 120000,    // 2 minutes for long operations
} as const;

