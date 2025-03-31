import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { ProjectProvider } from "@/contexts/ProjectContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();

  useEffect(() => {
    // Initial greeting toast to show the application is running
    toast({
      title: "AI Coding Manager Ready",
      description: "Connected and ready to analyze your code",
      className: "border-l-4 border-primary",
    });
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <Router />
        <Toaster />
      </ProjectProvider>
    </QueryClientProvider>
  );
}

export default App;
