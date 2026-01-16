import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";
import Index from "./views/Index";
import AuthPage from "./views/Auth";
import NotFound from "./views/NotFound";
import CommunitiesPage from "./views/Communities";
import CommunityDetail from "./views/CommunityDetail";
import EventsPage from "./views/Events";
import EventDetail from "./views/EventDetail";
import DiscussionDetail from "./views/DiscussionDetail";
import DiscussionsPage from "./views/Discussions";
import ProfilePage from "./views/Profile";
import Dashboard from "./views/Dashboard";
import AuthCallback from "./views/AuthCallback";
import { PaymentSuccess } from "./views/PaymentSuccess";
import ReferralCenter from "./views/ReferralCenter";


const queryClient = new QueryClient();

// Component to handle welcome email logic
const WelcomeEmailHandler = () => {
  useWelcomeEmail(); // This hook handles automatic welcome email triggering
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WelcomeEmailHandler />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="communities" element={<CommunitiesPage />} />
                <Route path="communities/:id" element={<CommunityDetail />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:id" element={<EventDetail />} />
                <Route path="discussions" element={<DiscussionsPage />} />
                <Route path="discussions/:id" element={<DiscussionDetail />} />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="payment-success" element={<PaymentSuccess />} />
                <Route path="referrals" element={
                  <ProtectedRoute>
                    <ReferralCenter />
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
  </ErrorBoundary>
);

export default App;
