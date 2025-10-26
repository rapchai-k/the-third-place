import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

// Mock window.matchMedia
const mockMatchMedia = vi.fn()

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
    mockMatchMedia.mockClear()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false initially when window width is undefined', () => {
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    // Mock window.innerWidth to be undefined initially
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('returns true for mobile screen sizes', () => {
    const mockMediaQueryList = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375, // Mobile width
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })

  it('returns false for desktop screen sizes', () => {
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024, // Desktop width
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('handles breakpoint boundary correctly', () => {
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    // Test exactly at breakpoint (768px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    })

    const { result } = renderHook(() => useIsMobile())
    
    // 768px should be considered desktop (not mobile)
    expect(result.current).toBe(false)
  })

  it('handles breakpoint boundary - 1px correctly', () => {
    const mockMediaQueryList = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    // Test just below breakpoint (767px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767,
    })

    const { result } = renderHook(() => useIsMobile())
    
    // 767px should be considered mobile
    expect(result.current).toBe(true)
  })

  it('sets up media query listener correctly', () => {
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    renderHook(() => useIsMobile())
    
    // Should call matchMedia with correct query
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
    
    // Should add event listener
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('cleans up event listener on unmount', () => {
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    const { unmount } = renderHook(() => useIsMobile())
    
    unmount()
    
    // Should remove event listener
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('responds to window resize events', () => {
    let changeHandler: () => void
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      }),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    // Start with desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
    
    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
      })
      changeHandler()
    })
    
    expect(result.current).toBe(true)
  })

  it('handles multiple resize events correctly', () => {
    let changeHandler: () => void
    const mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      }),
      removeEventListener: vi.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
    
    // Start with desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
    
    // Resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
      })
      changeHandler()
    })
    expect(result.current).toBe(true)
    
    // Resize back to desktop
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1200,
      })
      changeHandler()
    })
    expect(result.current).toBe(false)
  })
})
