import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Dashboard from "@/pages/Dashboard";
import ActaNew from "@/pages/ActaNew";
import ActaView from "@/pages/ActaView";
import ActaSend from "@/pages/ActaSend";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/acta/new" component={ActaNew} />
          <Route path="/acta/:id" component={ActaView} />
          <Route path="/acta/:id/send" component={ActaSend} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
