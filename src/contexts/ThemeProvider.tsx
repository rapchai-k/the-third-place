import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="mythirdplace-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

// Re-export useTheme from next-themes
export { useTheme } from "next-themes"