import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProviderWithRouting, ProtectedRoute } from "@/lib/clerk";

// Pages
import Dashboard from "@/pages/Dashboard";
import ActaNew from "@/pages/ActaNew";
import ActaView from "@/pages/ActaView";
import ActaSend from "@/pages/ActaSend";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProviderWithRouting>
        <TooltipProvider>
          <Toaster />
          <Switch>
            {/* Auth Routes - Public */}
            <Route path="/sign-in" component={SignInPage} />
            <Route path="/sign-in/*" component={SignInPage} />
            <Route path="/sign-up" component={SignUpPage} />
            <Route path="/sign-up/*" component={SignUpPage} />
            
            {/* Protected Routes */}
            <Route path="/">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            
            <Route path="/acta/new">
              <ProtectedRoute>
                <ActaNew />
              </ProtectedRoute>
            </Route>
            
            <Route path="/acta/:id">
              <ProtectedRoute>
                <ActaView />
              </ProtectedRoute>
            </Route>
            
            <Route path="/acta/:id/send">
              <ProtectedRoute>
                <ActaSend />
              </ProtectedRoute>
            </Route>

            {/* 404 */}
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ClerkProviderWithRouting>
    </QueryClientProvider>
  );
}

export default App;
