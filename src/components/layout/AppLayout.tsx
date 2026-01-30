import { useNavigate, useLocation, Link } from "@/lib/nextRouterAdapter";
import { Home, Users, Calendar, MessageSquare, User, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material";

const navigation = [
  { name: "Communities", href: "/communities", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Discussions", href: "/discussions", icon: MessageSquare },
];

const userNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: User },
];

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Material UI theme using CSS variables and resolvedTheme
  const muiTheme = createTheme({
    palette: {
      mode: resolvedTheme === 'dark' ? 'dark' : 'light',
      primary: {
        main: resolvedTheme === 'dark' ? 'hsl(var(--primary))' : 'hsl(var(--primary))',
      },
      background: {
        default: 'hsl(var(--background))',
        paper: 'hsl(var(--card))',
      },
      text: {
        primary: 'hsl(var(--foreground))',
        secondary: 'hsl(var(--muted-foreground))',
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
          }
        }
      }
    }
  });


  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="min-h-screen flex flex-col w-full">
        {/* Unified Material UI Top Navigation */}
        <div className="bg-background">
          <div className={`flex items-center justify-center ${location.pathname !== '/' ? 'h-28 md:h-[9rem]' : 'h-16'} px-4 relative`}>
            {/* Brand Logo */}
            {location.pathname !== '/' && (
              <div className="absolute left-4">
                <Link to="/">
                  <img src="/logo.png" alt="My Third Place" className="h-24 w-auto md:h-[7.5rem] cursor-pointer" loading="eager" decoding="async" />
                </Link>
              </div>
            )}

            {/* Desktop Navigation Tabs - Center aligned */}
            {/* Using Link component for better SSR hydration and SEO */}
            {user && (
              <div className="hidden md:flex items-center space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Right side controls */}
            <div className="absolute right-4 flex items-center space-x-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
                className="w-9 h-9"
                disabled={!mounted}
              >
                {!mounted ? (
                  <div className="w-4 h-4 animate-pulse bg-muted rounded" />
                ) : resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>

              {/* User Menu or Sign In */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-9 h-9">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')} size="sm">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${user ? 'pb-16 md:pb-0' : ''}`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation - Only for authenticated users */}
        {user && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
            <nav className="px-4 py-2">
              <div className="flex justify-around">
                {/* Show all navigation for authenticated users */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs mt-1">{item.name}</span>
                  </Link>
                ))}
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs mt-1">{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </MuiThemeProvider>
  );
};