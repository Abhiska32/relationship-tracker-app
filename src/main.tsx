
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import AuthGate from "./app/auth/AuthGate";
  import "./styles/index.css";

  import { AuthProvider } from "./firebase/AuthProvider";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <AuthGate>
      <App />
    </AuthGate>
  </AuthProvider>
);
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration errors so the app still works.
      });
    });
  }  
