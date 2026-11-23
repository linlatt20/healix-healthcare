import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/layout";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuthContext } from "./contexts/auth-context";
import React, { useEffect } from "react";

import Home from "./pages/home";
import Translation from "./pages/translation";
import Chatbot from "./pages/chatbot";
import Clinics from "./pages/clinics";
import Appointments from "./pages/appointments";
import Insurance from "./pages/insurance";
import Community from "./pages/community";
import HealthRecord from "./pages/health-record";
import LoginPage from "./pages/login";
import ProfileSetupPage from "./pages/profile-setup";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.profileSetupComplete === 0) {
      navigate("/profile-setup");
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.profileSetupComplete === 0) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/profile-setup" component={ProfileSetupPage} />
      <Route path="/" component={Home} />
      <Route path="/translate" component={Translation} />
      <Route path="/chatbot" component={Chatbot} />
      <Route path="/clinics" component={Clinics} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/insurance" component={Insurance} />
      <Route path="/community" component={Community} />
      <Route path="/health-record">
        <ProtectedRoute>
          <HealthRecord />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  const [location] = useLocation();
  const isFullscreen = location === "/login" || location === "/profile-setup";

  return isFullscreen ? (
    <Router />
  ) : (
    <Layout>
      <Router />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
