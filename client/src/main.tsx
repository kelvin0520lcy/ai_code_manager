import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { ProjectProvider } from "./contexts/ProjectContext";
import { queryClient } from "./lib/queryClient";

// Add console message to help with debugging
console.log("Starting AI Code Manager application...");

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </QueryClientProvider>
);
