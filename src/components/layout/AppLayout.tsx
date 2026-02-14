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
  { name: "Spaces", href: "/communities", icon: Users },
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
      {/* Neo-Brutalism Top Navigation */}
      <div className="bg-background border-b-3 border-foreground">
        <div className={`flex items-center justify-between ${location.pathname !== '/' ? 'h-20 md:h-24' : 'h-16'} px-4 md:px-6`}>
          {/* Brand Logo */}
          <div className="flex items-center">
            {location.pathname !== '/' ? (
              <Link to="/">
                <div className="border-2 border-foreground bg-background px-3 py-1.5 shadow-brutal-sm hover:shadow-brutal-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                  <img src="/logo.png" alt="My Third Place" className="h-10 w-auto md:h-14" loading="eager" decoding="async" />
                </div>
              </Link>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Desktop Navigation - Center aligned */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-5 py-2 text-sm font-bold uppercase tracking-wider border-2 transition-all duration-150 ${isActive(item.href)
                    ? "border-foreground bg-primary text-primary-foreground shadow-brutal-sm"
                    : "border-transparent text-foreground hover:border-foreground hover:shadow-brutal-sm"
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
                  className={`flex items-center space-x-2 px-5 py-2 text-sm font-bold uppercase tracking-wider border-2 transition-all duration-150 ${isActive(item.href)
                    ? "border-foreground bg-primary text-primary-foreground shadow-brutal-sm"
                    : "border-transparent text-foreground hover:border-foreground hover:shadow-brutal-sm"
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
              className="w-10 h-10"
              disabled={!mounted}
            >
              {!mounted ? (
                <div className="w-4 h-4 animate-pulse bg-muted" />
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
                  <Button variant="outline" size="icon" className="w-10 h-10">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs font-bold bg-accent text-accent-foreground">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-2 border-foreground bg-background shadow-brutal">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="font-bold uppercase text-xs tracking-wider cursor-pointer hover:bg-accent">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="font-bold uppercase text-xs tracking-wider cursor-pointer hover:bg-destructive hover:text-destructive-foreground">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth')} className="bg-accent text-accent-foreground">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className={`flex-1 overflow-auto ${user ? 'pb-24 md:pb-0' : ''}`}>
        <div key={location.pathname} className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Neo-Brutal */}
      {user && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <nav className="border-2 border-foreground bg-background shadow-brutal px-2 py-2">
            <div className="flex justify-around items-center">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center p-2 transition-all duration-150 ${isActive(item.href)
                    ? "text-primary-foreground bg-primary border-2 border-foreground shadow-brutal-sm"
                    : "text-foreground hover:bg-accent"
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{item.name}</span>
                </Link>
              ))}
              {userNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center p-2 transition-all duration-150 ${isActive(item.href)
                    ? "text-primary-foreground bg-primary border-2 border-foreground shadow-brutal-sm"
                    : "text-foreground hover:bg-accent"
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};