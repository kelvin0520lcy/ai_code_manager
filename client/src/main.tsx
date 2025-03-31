import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add console message to help with debugging
console.log("Starting AI Code Manager application...");

createRoot(document.getElementById("root")!).render(
  <App />
);
