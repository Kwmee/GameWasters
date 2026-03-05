import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import StatsPage from './components/StatsPage';
import ProfilePage from './components/ProfilePage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { useStore } from './store/useStore';
import { I18nProvider } from './i18n/useI18n';

export default function App() {
  const { login } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const steamIdParam = params.get('steamId');
    if (steamIdParam) {
      login(steamIdParam);
      window.history.replaceState({}, document.title, '/');
    }

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'STEAM_AUTH_SUCCESS' && event.data?.steamId) {
        login(event.data.steamId, event.data.steamName, event.data.steamAvatar, event.data.token);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login]);

  return (
    <I18nProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#1b2838] text-[#c7d5e0] font-sans flex flex-col">
          <Header />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </I18nProvider>
  );
}
