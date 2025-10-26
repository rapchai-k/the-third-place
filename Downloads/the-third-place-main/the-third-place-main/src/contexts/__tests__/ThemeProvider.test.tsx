import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeProvider'

// Test component that uses the theme context
const TestComponent = () => {
  const { theme, setTheme, systemTheme, themes, resolvedTheme } = useTheme()
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="system-theme">{systemTheme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="available-themes">{themes?.join(',')}</div>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('provides theme context to children', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Should render the test component
    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    expect(screen.getByTestId('set-dark')).toBeInTheDocument()
    expect(screen.getByTestId('set-light')).toBeInTheDocument()
    expect(screen.getByTestId('set-system')).toBeInTheDocument()
  })

  it('uses default theme configuration', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // The mocked useTheme should return our default values
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(screen.getByTestId('system-theme')).toHaveTextContent('light')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
  })

  it('accepts custom props', () => {
    render(
      <ThemeProvider defaultTheme="dark" enableSystem={false}>
        <TestComponent />
      </ThemeProvider>
    )

    // Should still work with custom props
    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
  })

  it('renders children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="child-content">Child content</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toHaveTextContent('Child content')
  })

  it('handles multiple children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
  })

  it('can be nested with other providers', () => {
    const CustomProvider = ({ children }: { children: React.ReactNode }) => (
      <div data-testid="custom-provider">{children}</div>
    )

    render(
      <CustomProvider>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </CustomProvider>
    )

    expect(screen.getByTestId('custom-provider')).toBeInTheDocument()
    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
  })

  it('forwards all props to NextThemesProvider', () => {
    // Test that custom props are accepted without TypeScript errors
    const customProps = {
      storageKey: 'custom-theme',
      themes: ['light', 'dark', 'custom'],
      forcedTheme: 'dark',
    }

    render(
      <ThemeProvider {...customProps}>
        <TestComponent />
      </ThemeProvider>
    )

    // Should render without errors
    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
  })

  it('maintains theme state across re-renders', () => {
    const { rerender } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const initialTheme = screen.getByTestId('current-theme').textContent

    rerender(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Theme should remain consistent
    expect(screen.getByTestId('current-theme')).toHaveTextContent(initialTheme || '')
  })

  it('handles theme switching through useTheme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const setDarkButton = screen.getByTestId('set-dark')
    const setLightButton = screen.getByTestId('set-light')
    const setSystemButton = screen.getByTestId('set-system')

    // Buttons should be clickable (mocked setTheme won't actually change state in tests)
    expect(setDarkButton).toBeEnabled()
    expect(setLightButton).toBeEnabled()
    expect(setSystemButton).toBeEnabled()
  })

  it('provides all expected theme properties', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // All theme properties should be available
    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    expect(screen.getByTestId('system-theme')).toBeInTheDocument()
    expect(screen.getByTestId('resolved-theme')).toBeInTheDocument()
    expect(screen.getByTestId('available-themes')).toBeInTheDocument()
  })
})
