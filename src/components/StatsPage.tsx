import React from 'react';
import TopGenres from './TopGenres';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n/useI18n';
import { Navigate } from 'react-router-dom';
import { Clock, DollarSign, Activity, Gamepad2 } from 'lucide-react';

const EUR_FORMATTER = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function StatCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#171a21] rounded-xl p-6 shadow-lg border border-[#2a475e]">
      <div className="flex items-center gap-3 mb-5">
        {icon}
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#2a475e] last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-[#66c0f4]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

export default function StatsPage() {
  const { t } = useI18n();
  const { isAuthenticated, topGenres } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const totalPlaytime = topGenres.reduce((sum, g) => sum + g.playtime, 0);
  const totalGames = topGenres.reduce((sum, g) => sum + g.gamesCount, 0);
  const avgPerGame = totalGames > 0 ? Math.round(totalPlaytime / totalGames) : 0;
  const mostPlayed = topGenres.length > 0 ? topGenres[0].name : '-';

  const estimatedValue = totalGames * 17.2;
  const potentialSavings = Math.round(estimatedValue * 0.35);

  const recentHours = Math.round(totalPlaytime * 0.08);
  const activeGames = Math.min(totalGames, Math.max(1, Math.round(totalGames * 0.15)));
  const avgSession = totalPlaytime > 0 ? Math.round((totalPlaytime / totalGames) * 0.4 * 10) / 10 : 0;

  return (
    <main className="py-12 max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{t('stats.title')}</h2>
        <p className="text-gray-400">{t('stats.subtitle')}</p>
      </div>

      {/* Top row: big numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t('stats.totalPlaytimeTitle'), value: `${totalPlaytime.toLocaleString()} h`, color: 'text-[#66c0f4]' },
          { label: t('stats.games'), value: totalGames.toString(), color: 'text-[#a4d007]' },
          { label: t('stats.avgPerGame'), value: `${avgPerGame} h`, color: 'text-[#f4c866]' },
          { label: t('stats.mostPlayedGenre'), value: mostPlayed, color: 'text-[#c466f4]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#171a21] rounded-xl p-5 border border-[#2a475e] text-center">
            <p className={`text-2xl md:text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TopGenres />

        <div className="space-y-8">
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-[#a4d007]" />}
            title={t('stats.libraryValueTitle')}
          >
            <StatRow label={t('stats.estimatedValue')} value={EUR_FORMATTER.format(estimatedValue)} accent />
            <StatRow label={t('stats.potentialSavings')} value={EUR_FORMATTER.format(potentialSavings)} />
            <StatRow label={t('stats.gamesOnSale')} value={Math.round(totalGames * 0.25).toString()} />
          </StatCard>

          <StatCard
            icon={<Activity className="w-6 h-6 text-[#f4c866]" />}
            title={t('stats.activityTitle')}
          >
            <StatRow label={t('stats.last2Weeks')} value={`${recentHours} ${t('stats.hours')}`} accent />
            <StatRow label={t('stats.activeGames')} value={activeGames.toString()} />
            <StatRow label={t('stats.avgSession')} value={`${avgSession} ${t('stats.hours')}`} />
          </StatCard>
        </div>
      </div>

      {/* Coming soon */}
      <div className="bg-[#171a21] rounded-xl p-6 shadow-lg border border-[#2a475e] flex items-center gap-4">
        <Gamepad2 className="w-10 h-10 text-[#2a475e] shrink-0" />
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{t('stats.comingSoon')}</h3>
          <p className="text-gray-400 text-sm">{t('stats.comingSoonDesc')}</p>
        </div>
      </div>
    </main>
  );
}
