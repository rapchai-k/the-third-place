import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Home, Users, Calendar, MessageSquare, User, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  IconButton,
  Typography,
  useTheme as useMuiTheme,
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
  Paper
} from "@mui/material";
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Forum as ForumIcon,
  Dashboard as DashboardIcon,
  LightMode,
  DarkMode
} from "@mui/icons-material";

const navigation = [
  { name: "Communities", href: "/communities", icon: Users, muiIcon: PeopleIcon },
  { name: "Events", href: "/events", icon: Calendar, muiIcon: EventIcon },
  { name: "Discussions", href: "/discussions", icon: MessageSquare, muiIcon: ForumIcon },
];

const userNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: User, muiIcon: DashboardIcon },
];

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Create Material UI theme based on current theme
  const muiTheme = createTheme({
    palette: {
      mode: theme === 'dark' ? 'dark' : 'light',
      primary: {
        main: theme === 'dark' ? '#3b82f6' : '#2563eb',
      },
      background: {
        default: theme === 'dark' ? '#0a0a0a' : '#ffffff',
        paper: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            borderBottom: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#e5e7eb'}`,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            minWidth: 0,
            fontWeight: 500,
            '&.Mui-selected': {
              color: theme === 'dark' ? '#3b82f6' : '#2563eb',
            },
          },
        },
      },
    },
  });

  // Get current tab value based on location
  const getCurrentTab = () => {
    if (!user) {
      return -1;
    } else {
      // Authenticated users see all tabs
      const allNavItems = [...navigation, ...userNavigation];
      const currentItem = allNavItems.find(item => item.href === location.pathname);
      return currentItem ? allNavItems.indexOf(currentItem) : -1;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (user) {
      // Authenticated users have all tabs
      const allNavItems = [...navigation, ...userNavigation];
      const targetItem = allNavItems[newValue];
      if (targetItem) {
        navigate(targetItem.href);
      }
    }
  };

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="min-h-screen flex flex-col w-full">
        {/* Unified Material UI Top Navigation */}
        <AppBar position="static" elevation={2}>
          <Toolbar variant="regular" sx={{ justifyContent: 'center' }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                position: 'absolute',
                left: '16px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontSize: '1.25rem'
              }}
            >
              MyThirdPlace
            </Typography>

            {/* Desktop Navigation Tabs - Center aligned */}
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Tabs
                value={getCurrentTab()}
                onChange={handleTabChange}
                sx={{
                  minHeight: 48,
                  '& .MuiTab-root': {
                    minHeight: 48,
                    px: 2,
                  },
                }}
              >
                {/* Show navigation for users */}
                {user && (
                  <>
                    {navigation.map((item) => (
                      <Tab
                        key={item.name}
                        label={item.name}
                        icon={<item.muiIcon />}
                        iconPosition="start"
                        sx={{
                          '& .MuiTab-iconWrapper': { mr: 1 }
                        }}
                      />
                    ))}
                    {userNavigation.map((item) => (
                      <Tab
                        key={item.name}
                        label={item.name}
                        icon={<item.muiIcon />}
                        iconPosition="start"
                        sx={{
                          '& .MuiTab-iconWrapper': { mr: 1 }
                        }}
                      />
                    ))}
                  </>
                )}
              </Tabs>
            </Box>

            {/* Right side controls */}
            <Box sx={{ position: 'absolute', right: '16px', display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Theme Toggle */}
              <IconButton
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                color="inherit"
                size="small"
              >
                {theme === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>

              {/* User Menu or Sign In */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </IconButton>
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
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${user ? 'pb-16 md:pb-0' : ''}`}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation with Material Design - Only for authenticated users */}
        {user && (
          <Paper
            elevation={8}
            className="md:hidden"
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              borderRadius: 0,
              borderTop: 1,
              borderColor: 'divider'
            }}
          >
            <nav className="px-4 py-2">
              <div className="flex justify-around">
                {/* Show all navigation for authenticated users */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center py-2 px-3 rounded-md transition-colors ${
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
                    className={`flex flex-col items-center py-2 px-3 rounded-md transition-colors ${
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
          </Paper>
        )}
      </div>
    </MuiThemeProvider>
  );
};