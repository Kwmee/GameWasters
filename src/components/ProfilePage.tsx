import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useI18n } from '../i18n/useI18n';
import { Navigate } from 'react-router-dom';
import { Trophy, Crown, Swords, Package, Clock, Gamepad2, Medal, Users } from 'lucide-react';

const EUR_FORMATTER = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const RANK_COLORS: Record<string, string> = {
  Diamond: 'from-cyan-400 to-blue-500',
  Platinum: 'from-gray-300 to-gray-500',
  Gold: 'from-yellow-400 to-amber-600',
  Silver: 'from-gray-400 to-gray-600',
  Bronze: 'from-orange-400 to-orange-700',
};

const RANK_BORDER: Record<string, string> = {
  Diamond: 'border-cyan-400',
  Platinum: 'border-gray-400',
  Gold: 'border-yellow-500',
  Silver: 'border-gray-500',
  Bronze: 'border-orange-500',
};

export default function ProfilePage() {
  const { t } = useI18n();
  const { isAuthenticated, token, steamName, steamAvatar, playerProfile, setPlayerProfile } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    if (playerProfile) return;

    setLoading(true);
    fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlayerProfile(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, playerProfile, setPlayerProfile]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (loading || !playerProfile) {
    return (
      <main className="py-12 max-w-7xl mx-auto px-4">
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-[#66c0f4] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">{t('profile.loading')}</p>
        </div>
      </main>
    );
  }

  const { summary, achievements, leaderboard } = playerProfile;
  const rankGradient = RANK_COLORS[summary.rank] || RANK_COLORS.Bronze;
  const rankBorder = RANK_BORDER[summary.rank] || RANK_BORDER.Bronze;

  return (
    <main className="py-12 max-w-7xl mx-auto px-4">
      {/* Profile Header */}
      <div className="bg-[#171a21] rounded-2xl p-8 border border-[#2a475e] mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {steamAvatar && (
            <img src={steamAvatar} alt="Avatar" className={`w-24 h-24 rounded-full border-4 ${rankBorder}`} />
          )}
          <div className="text-center md:text-left flex-grow">
            <h2 className="text-3xl font-bold text-white mb-1">{steamName}</h2>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${rankGradient} text-white`}>
                {summary.rank}
              </span>
              <span className="text-gray-400 text-sm">
                {t('profile.score')}: <span className="text-[#66c0f4] font-bold">{summary.playerScore.toLocaleString()}</span>
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-[#66c0f4]">#{leaderboard.position}</p>
            <p className="text-xs text-gray-500">{(t('profile.ofFriends') as string).replace('{count}', String(leaderboard.totalFriends))}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#171a21] rounded-xl p-5 border border-[#2a475e] text-center">
          <Clock className="w-6 h-6 text-[#66c0f4] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#66c0f4]">{summary.totalPlaytimeHours.toLocaleString()}h</p>
          <p className="text-xs text-gray-500">{t('profile.totalPlaytime')}</p>
        </div>
        <div className="bg-[#171a21] rounded-xl p-5 border border-[#2a475e] text-center">
          <Gamepad2 className="w-6 h-6 text-[#a4d007] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#a4d007]">{summary.gamesPlayed}/{summary.totalGames}</p>
          <p className="text-xs text-gray-500">{t('profile.gamesPlayed')}</p>
        </div>
        <div className="bg-[#171a21] rounded-xl p-5 border border-[#2a475e] text-center">
          <Package className="w-6 h-6 text-[#f4c866] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#f4c866]">{EUR_FORMATTER.format(summary.estimatedInventoryValue)}</p>
          <p className="text-xs text-gray-500">{t('profile.inventoryValue')}</p>
        </div>
        <div className="bg-[#171a21] rounded-xl p-5 border border-[#2a475e] text-center">
          <Trophy className="w-6 h-6 text-[#c466f4] mx-auto mb-2" />
          <p className="text-2xl font-bold text-[#c466f4]">{achievements.totalUnlocked}</p>
          <p className="text-xs text-gray-500">{t('profile.achievementsUnlocked')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Achievements Section */}
        <div className="bg-[#171a21] rounded-xl p-6 border border-[#2a475e]">
          <div className="flex items-center gap-3 mb-5">
            <Medal className="w-6 h-6 text-[#f4c866]" />
            <h3 className="text-lg font-bold text-white">{t('profile.achievementsTitle')}</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-xl font-bold text-[#66c0f4]">{achievements.avgCompletion}%</p>
              <p className="text-xs text-gray-500">{t('profile.avgCompletion')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#a4d007]">{achievements.perfectGames}</p>
              <p className="text-xs text-gray-500">{t('profile.perfectGames')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{achievements.totalUnlocked}/{achievements.totalAchievements}</p>
              <p className="text-xs text-gray-500">{t('profile.total')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {achievements.topGames.map((game) => (
              <div key={game.appid} className="flex items-center gap-3">
                <img
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`}
                  alt={game.gameName}
                  className="w-16 h-6 object-cover rounded"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-grow min-w-0">
                  <p className="text-sm text-white truncate">{game.gameName}</p>
                  <div className="w-full bg-[#2a475e] rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-[#66c0f4] to-[#1999ff]"
                      style={{ width: `${game.completionPercent}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`text-xs font-bold shrink-0 ${game.completionPercent === 100 ? 'text-[#a4d007]' : 'text-gray-400'}`}>
                  {game.completionPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#171a21] rounded-xl p-6 border border-[#2a475e]">
          <div className="flex items-center gap-3 mb-5">
            <Users className="w-6 h-6 text-[#66c0f4]" />
            <h3 className="text-lg font-bold text-white">{t('profile.leaderboardTitle')}</h3>
          </div>

          <div className="space-y-2">
            {leaderboard.entries.map((entry, index) => {
              const isUser = (entry as any).isUser;
              return (
                <div
                  key={entry.steamId}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isUser
                      ? 'bg-[#2a475e]/50 border border-[#66c0f4]/30'
                      : 'hover:bg-[#1b2838]'
                  }`}
                >
                  <span className={`w-8 text-center font-bold text-sm ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' :
                    'text-gray-500'
                  }`}>
                    {index < 3 ? (
                      <Crown className={`w-5 h-5 mx-auto ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        'text-orange-400'
                      }`} />
                    ) : (
                      `#${index + 1}`
                    )}
                  </span>
                  <img
                    src={entry.avatarfull}
                    alt={entry.personaname}
                    className="w-8 h-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow min-w-0">
                    <p className={`text-sm font-medium truncate ${isUser ? 'text-[#66c0f4]' : 'text-white'}`}>
                      {entry.personaname} {isUser && <span className="text-xs text-gray-500">({t('profile.you')})</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.totalPlaytimeHours.toLocaleString()}h · {entry.gameCount} {t('stats.games')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#66c0f4]">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{t('profile.pts')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Game Spotlight */}
      {summary.topGame && (
        <div className="bg-[#171a21] rounded-xl p-6 border border-[#2a475e] flex items-center gap-4">
          <Swords className="w-10 h-10 text-[#66c0f4] shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{t('profile.topGameTitle')}</h3>
            <p className="text-gray-400 text-sm">
              {summary.topGame.name} — <span className="text-[#66c0f4] font-semibold">{summary.topGame.hours.toLocaleString()} {t('stats.hours')}</span>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
