import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { AppBackground } from "@/components/layout/AppBackground";
import { NotificationsBell } from "@/components/notifications-bell";

import AuthPage from "@/pages/auth";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import DashboardPage from "@/pages/dashboard";
import ConsultorioPage from "@/pages/consultorio";
import DiarioPage from "@/pages/diario";
import TrilhasPage from "@/pages/trilhas";
import AgendaPage from "@/pages/agenda";
import MapaPage from "@/pages/mapa";
import NotFound from "@/pages/not-found";

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, token, isLoading } = useAuth();

  if (isLoading || (token && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-cicluz-gradient animate-pulse mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();

  if (isLoading || (token && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-cicluz-gradient animate-pulse mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  return (
      <SidebarProvider style={style}>
      <AppBackground>
        <div className="flex h-dvh w-full">
          <AppSidebar />

          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center justify-between gap-4 p-3 border-b border-border/60 bg-background/55 supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 sticky top-0 z-50">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <NotificationsBell />
                <ThemeToggle />
              </div>
            </header>

            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </AppBackground>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/auth">
        <Redirect to="/login" />
      </Route>

      <Route path="/termos">
        <ProtectedRoute component={TermsPage} />
      </Route>
      <Route path="/privacidade">
        <ProtectedRoute component={PrivacyPage} />
      </Route>

      <Route path="/">
        <AuthenticatedLayout>
          <DashboardPage />
        </AuthenticatedLayout>
      </Route>

      <Route path="/consultorio">
        <AuthenticatedLayout>
          <ConsultorioPage />
        </AuthenticatedLayout>
      </Route>

      <Route path="/diario">
        <AuthenticatedLayout>
          <DiarioPage />
        </AuthenticatedLayout>
      </Route>

      <Route path="/trilhas">
        <AuthenticatedLayout>
          <TrilhasPage />
        </AuthenticatedLayout>
      </Route>

      <Route path="/agenda">
        <AuthenticatedLayout>
          <AgendaPage />
        </AuthenticatedLayout>
      </Route>

      <Route path="/mapa">
        <AuthenticatedLayout>
          <MapaPage />
        </AuthenticatedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cicluz-theme">
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
