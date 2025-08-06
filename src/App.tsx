import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CommunitiesPage from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import EventsPage from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import DiscussionDetail from "./pages/DiscussionDetail";
import DiscussionsPage from "./pages/Discussions";
import ProfilePage from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="communities" element={
                  <ProtectedRoute>
                    <CommunitiesPage />
                  </ProtectedRoute>
                } />
                <Route path="communities/:id" element={
                  <ProtectedRoute>
                    <CommunityDetail />
                  </ProtectedRoute>
                } />
                <Route path="events" element={
                  <ProtectedRoute>
                    <EventsPage />
                  </ProtectedRoute>
                } />
                <Route path="events/:id" element={
                  <ProtectedRoute>
                    <EventDetail />
                  </ProtectedRoute>
                } />
                <Route path="discussions" element={
                  <ProtectedRoute>
                    <DiscussionsPage />
                  </ProtectedRoute>
                } />
                <Route path="discussions/:id" element={
                  <ProtectedRoute>
                    <DiscussionDetail />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
