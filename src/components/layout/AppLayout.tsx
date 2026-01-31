import { useNavigate, useLocation, Link } from "@/lib/nextRouterAdapter";
import { Users, Calendar, MessageSquare, User, Sun, Moon } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col w-full">
        {/* Unified Material UI Top Navigation */}
        <div className="bg-background">
          <div className={`flex items-center justify-center ${location.pathname !== '/' ? 'h-28 md:h-[9rem]' : 'h-16'} px-4 relative`}>
            {/* Brand Logo */}
            {location.pathname !== '/' && (
              <div className="absolute left-6">
                <Link to="/">
                  <img src="/logo.png" alt="My Third Place" className="h-16 w-auto md:h-20 cursor-pointer hover:scale-105 transition-transform duration-300" loading="eager" decoding="async" />
                </Link>
              </div>
            )}

            {/* Desktop Navigation Tabs - Center aligned */}
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${isActive(item.href)
                      ? "text-primary bg-primary/10 border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:shadow-sm"
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
                    className={`flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${isActive(item.href)
                      ? "text-primary bg-primary/10 border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:shadow-sm"
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Right side controls */}
            <div className="absolute right-6 flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
                className="w-10 h-10 rounded-full hover:bg-muted/60"
                disabled={!mounted}
              >
                {!mounted ? (
                  <div className="w-4 h-4 animate-pulse bg-muted rounded" />
                ) : resolvedTheme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              {/* User Menu or Sign In */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-muted/60 ring-2 ring-transparent hover:ring-border/50 transition-all">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border/50 backdrop-blur-md bg-popover/80">
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg focus:bg-accent/20">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="rounded-lg focus:bg-destructive/10 text-destructive focus:text-destructive">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')} size="sm" className="rounded-full px-6 shadow-glow">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page Content - Adjust padding for floating heights */}
        <main className={`flex-1 overflow-auto ${user ? 'pb-24 md:pb-0' : ''}`}>
          <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Floating Glass */}
        {user && (
          <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
            <nav className="rounded-2xl border border-border/40 bg-background/80 backdrop-blur-xl shadow-elegant px-4 py-3">
              <div className="flex justify-around items-center">
                {/* Show all navigation for authenticated users */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive(item.href)
                      ? "text-primary bg-primary/10 scale-110"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                  >
                    <item.icon className={`w-6 h-6 ${isActive(item.href) ? "fill-current" : ""}`} />
                    <span className="text-[10px] font-medium mt-1">{item.name}</span>
                  </Link>
                ))}
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive(item.href)
                      ? "text-primary bg-primary/10 scale-110"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                  >
                    <item.icon className={`w-6 h-6 ${isActive(item.href) ? "fill-current" : ""}`} />
                    <span className="text-[10px] font-medium mt-1">{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
    </div>
  );
};