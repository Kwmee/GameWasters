import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { BarChart3 } from 'lucide-react';

export default function TopGenres() {
  const { isAuthenticated, topGenres, setTopGenres, token } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    setLoading(true);
    fetch('/api/user/top-genres', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTopGenres(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, token, setTopGenres]);

  if (!isAuthenticated) return null;

  return (
    <div className="bg-[#171a21] rounded-xl p-6 shadow-lg border border-[#2a475e]">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-[#66c0f4]" />
        <h2 className="text-xl font-bold text-white">Tus Géneros Favoritos</h2>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-[#2a475e] rounded-lg"></div>
          ))}
        </div>
      ) : topGenres.length > 0 ? (
        <div className="space-y-4">
          {topGenres.map((genre, index) => (
            <div key={genre.name} className="relative">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-[#c7d5e0]">
                  {index + 1}. {genre.name}
                </span>
                <span className="text-[#66c0f4]">{genre.playtime} hrs</span>
              </div>
              <div className="w-full bg-[#0f1215] rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-[#66c0f4] to-[#2a475e] h-2.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${genre.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No hay suficientes datos de juego para analizar tus géneros.</p>
      )}
    </div>
  );
}
