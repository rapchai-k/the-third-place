import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useState, useEffect } from "react"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false)

  // Ensure hydration is complete before rendering theme-dependent content
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="mythirdplace-theme"
      {...props}
    >
      {mounted ? children : <div className="min-h-screen bg-background" />}
    </NextThemesProvider>
  )
}

// Re-export useTheme from next-themes
export { useTheme } from "next-themes"