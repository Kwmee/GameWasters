import React, { useEffect, useState } from 'react';
import SteamLoginButton from './SteamLoginButton';
import DealsCarousel from './DealsCarousel';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n/useI18n';
import { Sparkles, Clock, TrendingDown, Flame } from 'lucide-react';

const HISTORICAL_CACHE_TTL_MS = 60 * 60 * 1000;

export default function LandingPage() {
  const { t, translateGenre } = useI18n();
  const {
    isAuthenticated,
    hashedSteamId,
    deals,
    setDeals,
    topSteamRecommendations,
    setTopSteamRecommendations,
    token,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [historicalDeals, setHistoricalDeals] = useState<typeof deals>([]);
  const [historicalDealsFetchedAt, setHistoricalDealsFetchedAt] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'deals' | 'historical' | 'topSteam'>('deals');

  useEffect(() => {
    setLoading(true);
    const url = isAuthenticated && hashedSteamId
      ? `/api/deals?steamId=${hashedSteamId}`
      : '/api/deals';

    const headers: HeadersInit = {};
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
  }, [setDeals, isAuthenticated, hashedSteamId, token]);

  const shouldRefreshHistoricalDeals = () =>
    !historicalDealsFetchedAt || Date.now() - historicalDealsFetchedAt > HISTORICAL_CACHE_TTL_MS;

  const loadHistoricalDeals = () => {
    setLoadingHistorical(true);
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/deals/historical-lows', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistoricalDeals(data.data);
          setHistoricalDealsFetchedAt(Date.now());
        }
      })
      .finally(() => setLoadingHistorical(false));
  };

  useEffect(() => {
    if (activeTab !== 'historical') return;
    if (!shouldRefreshHistoricalDeals()) return;
    loadHistoricalDeals();
  }, [activeTab, historicalDealsFetchedAt, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    if (activeTab !== 'topSteam') return;
    if (topSteamRecommendations.length > 0) return;

    setLoading(true);
    fetch('/api/recommendations/top-steam', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTopSteamRecommendations(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [activeTab, isAuthenticated, token, topSteamRecommendations.length, setTopSteamRecommendations]);

  const openHistoricalDeals = () => {
    setActiveTab('historical');
    if (shouldRefreshHistoricalDeals()) {
      loadHistoricalDeals();
    }
    document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openCurrentDeals = () => {
    setActiveTab('deals');
    document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openPersonalizedRecommendations = () => {
    setActiveTab(isAuthenticated ? 'topSteam' : 'deals');
    document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="relative py-12 md:py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#171a21] to-[#1b2838] z-0"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-[2.34rem] md:text-[2.82rem] font-extrabold text-white mb-4 tracking-tight">
            {t('hero.title1')} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66c0f4] to-[#1999ff]">{t('hero.title2')}</span>
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed">
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
      <section className="py-8 bg-[#171a21] border-y border-[#2a475e]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1b2838] p-4 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
              <Clock className="w-9 h-9 text-[#66c0f4] mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">{t('features.playtimeTitle')}</h3>
              <p className="text-gray-400">{t('features.playtimeDesc')}</p>
              <button
                type="button"
                onClick={openPersonalizedRecommendations}
                className="mt-4 bg-[#2a475e] hover:bg-[#66c0f4] hover:text-white text-[#66c0f4] px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {t('deals.topSteamAffinity')}
              </button>
            </div>
            <div className="bg-[#1b2838] p-4 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
              <Sparkles className="w-9 h-9 text-[#66c0f4] mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">{t('features.svdTitle')}</h3>
              <p className="text-gray-400">{t('features.svdDesc')}</p>
              <button
                type="button"
                onClick={openCurrentDeals}
                className="mt-4 bg-[#2a475e] hover:bg-[#66c0f4] hover:text-white text-[#66c0f4] px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {t('deals.personalizedDeals')}
              </button>
            </div>
            <div className="bg-[#1b2838] p-4 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
              <TrendingDown className="w-9 h-9 text-[#66c0f4] mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">{t('features.dealsTitle')}</h3>
              <p className="text-gray-400">{t('features.dealsDesc')}</p>
              <button
                type="button"
                onClick={openHistoricalDeals}
                className="mt-4 bg-[#2a475e] hover:bg-[#66c0f4] hover:text-white text-[#66c0f4] px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {t('features.historicalButton')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section id="deals-section" className="py-12 max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="text-[2.34rem] font-bold text-white">
            {activeTab === 'historical'
              ? t('deals.historicalTitle')
              : isAuthenticated
                ? activeTab === 'deals'
                  ? t('deals.recommendationsTitle')
                  : t('deals.topSteamTitle')
                : t('deals.dealsTitle')}
          </h2>
          {isAuthenticated && loading && (
            <span className="text-sm text-[#66c0f4] bg-[#2a475e] px-3 py-1 rounded-full animate-pulse">
              {t('deals.syncing')}
            </span>
          )}
        </div>

        <div className="mb-6 inline-flex bg-[#171a21] border border-[#2a475e] rounded-lg p-1 gap-1 flex-wrap">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setActiveTab('topSteam')}
              className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'topSteam'
                  ? 'bg-[#66c0f4] text-[#0f1215] font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-[#2a475e]'
              }`}
            >
              <Flame className="w-4 h-4" />
              {t('deals.topSteamAffinity')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'deals'
                ? 'bg-[#66c0f4] text-[#0f1215] font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-[#2a475e]'
            }`}
          >
            {t('deals.personalizedDeals')}
          </button>
          <button
            type="button"
            onClick={openHistoricalDeals}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'historical'
                ? 'bg-[#66c0f4] text-[#0f1215] font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-[#2a475e]'
            }`}
          >
            {t('deals.historicalTab')}
          </button>
        </div>

        {loading || loadingHistorical ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#171a21] p-5 rounded-xl border border-[#2a475e]">
                <div className="h-44 bg-[#2a475e] rounded-lg mb-4 animate-pulse"></div>
                <div className="h-5 bg-[#2a475e] rounded w-3/4 mb-3 animate-pulse"></div>
                <div className="h-4 bg-[#2a475e] rounded w-1/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'historical' ? (
          historicalDeals.length > 0 ? (
            <DealsCarousel deals={historicalDeals} />
          ) : (
            <div className="bg-[#171a21] rounded-xl p-6 border border-[#2a475e] text-gray-300">
              {t('deals.noHistorical')}
            </div>
          )
        ) : activeTab === 'deals' ? (
          <DealsCarousel deals={deals} />
        ) : topSteamRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {topSteamRecommendations.map((game) => (
              <div key={game.appId} className="bg-[#171a21] rounded-xl overflow-hidden border border-[#2a475e] hover:border-[#66c0f4] hover:shadow-[0_0_15px_rgba(102,192,244,0.2)] transition-all group flex flex-col">
                <div className="relative overflow-hidden">
                  <img
                    src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
                    alt={game.title}
                    className="w-full h-60 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-[#2a475e] text-[#66c0f4] px-3 py-1 text-xs font-bold rounded shadow-lg">
                    {t('deals.score')} {game.score.toFixed(3)}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#66c0f4] transition-colors">{game.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    {game.gameGenres.length > 0
                      ? game.gameGenres.map((genre) => translateGenre(genre)).join(' · ')
                      : t('deals.genresUnavailable')}
                  </p>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {typeof game.concurrentPlayers === 'number'
                        ? `${game.concurrentPlayers.toLocaleString()} ${t('deals.playingNow')}`
                        : t('deals.popularityUnavailable')}
                    </span>
                    <a
                      href={`https://store.steampowered.com/app/${game.appId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#2a475e] hover:bg-[#66c0f4] hover:text-white text-[#66c0f4] px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      {t('deals.viewGame')}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#171a21] rounded-xl p-6 border border-[#2a475e] text-gray-300">
            {t('deals.noTopSteam')}
          </div>
        )}
      </section>
    </main>
  );
}
