import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { initAnalytics } from "./lib/analytics";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry before anything else
initSentry();

// Initialize PostHog analytics
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
