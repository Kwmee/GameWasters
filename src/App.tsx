import React, { useEffect } from "react";
import LandingPage from "./components/LandingPage";
import { useStore } from "./store/useStore";

export default function App() {
  const { login } = useStore();

  useEffect(() => {
    // Check URL for steamId after redirect from backend (fallback)
    const params = new URLSearchParams(window.location.search);
    const steamIdParam = params.get('steamId');
    if (steamIdParam) {
      login(steamIdParam);
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
    }

    // Listen for success message from popup (after callback completes)
    const handleMessage = (event: MessageEvent) => {
      // Validar que el mensaje proviene del mismo origen que la app
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'STEAM_AUTH_SUCCESS' && event.data?.steamId) {
        login(event.data.steamId);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login]);

  return <LandingPage />;
}
