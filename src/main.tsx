import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureRecoveryFromUrl } from "./lib/auth-recovery";

// A recovery link may land on any page (the Supabase redirect falls back to the site URL); the new
// password form lives on /login, so move there keeping the token in the URL.
if (captureRecoveryFromUrl() && window.location.pathname !== "/login") {
  window.location.replace("/login" + window.location.search + window.location.hash);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
