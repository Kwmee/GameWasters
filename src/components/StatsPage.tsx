import React from 'react';
import TopGenres from './TopGenres';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';

export default function StatsPage() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="py-12 max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tus Estadísticas</h2>
        <p className="text-gray-400">Análisis basado en tu tiempo de juego real en Steam.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <TopGenres />
        </div>
        <div className="bg-[#171a21] rounded-xl p-6 shadow-lg border border-[#2a475e] flex flex-col justify-center items-center text-center">
          <h3 className="text-xl font-bold text-white mb-4">Más estadísticas próximamente</h3>
          <p className="text-gray-400">Estamos trabajando en integrar más datos sobre tus hábitos de juego, como valor total de la cuenta, juegos nunca jugados y más.</p>
        </div>
      </div>
    </main>
  );
}
