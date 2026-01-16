'use client';

/**
 * Next.js Router Adapter
 * Provides React Router compatible hooks using Next.js App Router
 * This allows existing components to work without major refactoring
 */

import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { useCallback, useMemo, useEffect } from 'react';

// Type for navigation options
interface NavigateOptions {
  replace?: boolean;
  state?: Record<string, unknown>;
}

// Hook to replace useNavigate from react-router-dom
export function useNavigate() {
  const router = useRouter();
  
  const navigate = useCallback((to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      // Handle back/forward navigation
      if (to === -1) {
        router.back();
      } else {
        // Next.js doesn't have forward(), so we can only go back
        router.back();
      }
    } else {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    }
  }, [router]);
  
  return navigate;
}

// Hook to replace useLocation from react-router-dom
export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  
  return useMemo(() => ({
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null, // Next.js doesn't have location state like React Router
    key: 'default',
  }), [pathname, searchParams]);
}

// Hook to replace useSearchParams from react-router-dom
type SetSearchParamsInput = URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams);

export function useSearchParams(): [URLSearchParams, (params: SetSearchParamsInput) => void] {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Create a mutable URLSearchParams from the readonly one
  const mutableParams = useMemo(() => {
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });
    return params;
  }, [searchParams]);

  const setSearchParams = useCallback((newParams: SetSearchParamsInput) => {
    let finalParams: URLSearchParams;

    if (typeof newParams === 'function') {
      finalParams = newParams(mutableParams);
    } else if (newParams instanceof URLSearchParams) {
      finalParams = newParams;
    } else {
      // Handle plain object
      finalParams = new URLSearchParams();
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          finalParams.set(key, value);
        }
      });
    }

    const queryString = finalParams.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  }, [router, pathname, mutableParams]);

  return [mutableParams, setSearchParams];
}

// Hook to replace useParams from react-router-dom
export { useParams } from 'next/navigation';

// Re-export Link from next/link with React Router compatible interface
import NextLink from 'next/link';
import { forwardRef, type ComponentProps } from 'react';

type NextLinkProps = ComponentProps<typeof NextLink>;

interface LinkProps extends Omit<NextLinkProps, 'href'> {
  to: string;
  children: React.ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, children, ...props }, ref) => {
    return (
      <NextLink href={to} ref={ref} {...props}>
        {children}
      </NextLink>
    );
  }
);

Link.displayName = 'Link';

// Navigate component for declarative navigation (like React Router's Navigate)
interface NavigateProps {
  to: string;
  replace?: boolean;
}

export function Navigate({ to, replace = false }: NavigateProps) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);

  return null;
}

// Outlet component placeholder - pages will render children directly
export function Outlet() {
  // In Next.js App Router, children are passed directly
  // This is a no-op placeholder for compatibility
  return null;
}

