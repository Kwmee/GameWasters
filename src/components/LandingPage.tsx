import React, { useEffect, useState } from 'react';
import SteamLoginButton from './SteamLoginButton';
import DealsCarousel from './DealsCarousel';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n/useI18n';
import { Sparkles, Clock, TrendingDown } from 'lucide-react';

export default function LandingPage() {
  const { t } = useI18n();
  const { isAuthenticated, hashedSteamId, deals, setDeals } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = isAuthenticated && hashedSteamId
      ? `/api/deals?steamId=${hashedSteamId}`
      : '/api/deals';

    const headers: HeadersInit = {};
    const token = useStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDeals(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [setDeals, isAuthenticated, hashedSteamId]);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#171a21] to-[#1b2838] z-0"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            {t('hero.title1')} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66c0f4] to-[#1999ff]">{t('hero.title2')}</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            {t('hero.subtitle')} <span className="text-white font-semibold">{t('hero.subtitleBold')}</span> {t('hero.subtitle2')}
          </p>
          {!isAuthenticated && (
            <div className="flex justify-center transform hover:scale-105 transition-transform">
              <SteamLoginButton />
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#171a21] border-y border-[#2a475e]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
              <Sparkles className="w-10 h-10 text-[#66c0f4] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t('features.svdTitle')}</h3>
              <p className="text-gray-400">{t('features.svdDesc')}</p>
            </div>
            <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
              <Clock className="w-10 h-10 text-[#66c0f4] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t('features.playtimeTitle')}</h3>
              <p className="text-gray-400">{t('features.playtimeDesc')}</p>
            </div>
            <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
              <TrendingDown className="w-10 h-10 text-[#66c0f4] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t('features.dealsTitle')}</h3>
              <p className="text-gray-400">{t('features.dealsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deals Carousel */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">
            {isAuthenticated ? t('deals.recommendationsTitle') : t('deals.dealsTitle')}
          </h2>
          {isAuthenticated && loading && (
            <span className="text-sm text-[#66c0f4] bg-[#2a475e] px-3 py-1 rounded-full animate-pulse">
              {t('deals.syncing')}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-[300px] bg-[#171a21] p-4 rounded-xl border border-[#2a475e]">
                <div className="h-36 bg-[#2a475e] rounded-lg mb-4 animate-pulse"></div>
                <div className="h-5 bg-[#2a475e] rounded w-3/4 mb-3 animate-pulse"></div>
                <div className="h-4 bg-[#2a475e] rounded w-1/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <DealsCarousel deals={deals} />
        )}
      </section>
    </main>
  );
}
