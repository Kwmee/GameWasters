import React from 'react';
import { Gamepad2, BarChart3, Globe } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n/useI18n';
import SteamLoginButton from './SteamLoginButton';
import { Link } from 'react-router-dom';

export default function Header() {
  const { isAuthenticated, hashedSteamId, steamName, steamAvatar, logout } = useStore();
  const { t, locale, setLocale } = useI18n();

  return (
    <header className="bg-[#171a21] p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Gamepad2 className="w-8 h-8 text-[#66c0f4]" />
          <h1 className="text-2xl font-bold text-white tracking-wider">Game<span className="text-[#66c0f4]">Wasters</span></h1>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{t('lang.switch')}</span>
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-6">
              <Link to="/stats" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">{t('header.stats')}</span>
              </Link>
              <div className="flex items-center gap-3 border-l border-[#2a475e] pl-6">
                {steamAvatar && <img src={steamAvatar} alt="Avatar" className="w-8 h-8 rounded-full border border-[#66c0f4]" />}
                <span className="text-sm font-medium text-white hidden sm:inline">{steamName || hashedSteamId}</span>
                <button onClick={() => logout()} className="text-sm text-gray-400 hover:text-white transition-colors ml-2">{t('header.logout')}</button>
              </div>
            </div>
          ) : (
            <SteamLoginButton />
          )}
        </div>
      </div>
    </header>
  );
}
