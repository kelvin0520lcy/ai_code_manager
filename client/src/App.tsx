import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { ProjectProvider } from "@/contexts/ProjectContext";
import cursorAIService from "@/lib/cursorAIService";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppToastInitializer() {
  const toast = useToast();
  
  useEffect(() => {
    // Initialize the toast for our service
    cursorAIService.initToast(toast);
    
    // Initial greeting toast
    toast.toast({
      title: "AI Coding Manager Ready",
      description: "Connected and ready to analyze your code",
      className: "border-l-4 border-primary",
    });
    
    console.log("Starting AI Code Manager application...");
  }, [toast]);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <AppToastInitializer />
        <Router />
        <Toaster />
      </ProjectProvider>
    </QueryClientProvider>
  );
}

export default App;
