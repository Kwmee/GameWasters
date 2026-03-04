import React from 'react';
import { Gamepad2, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import SteamLoginButton from './SteamLoginButton';
import { Link } from 'react-router-dom';

export default function Header() {
  const { isAuthenticated, hashedSteamId, steamName, steamAvatar, logout } = useStore();

  return (
    <header className="bg-[#171a21] p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Gamepad2 className="w-8 h-8 text-[#66c0f4]" />
          <h1 className="text-2xl font-bold text-white tracking-wider">SteamDeals<span className="text-[#66c0f4]">AI</span></h1>
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-6">
            <Link to="/stats" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">Estadísticas</span>
            </Link>
            <div className="flex items-center gap-3 border-l border-[#2a475e] pl-6">
              {steamAvatar && <img src={steamAvatar} alt="Avatar" className="w-8 h-8 rounded-full border border-[#66c0f4]" />}
              <span className="text-sm font-medium text-white">{steamName || hashedSteamId}</span>
              <button onClick={() => logout()} className="text-sm text-gray-400 hover:text-white transition-colors ml-2">Cerrar sesión</button>
            </div>
          </div>
        ) : (
          <SteamLoginButton />
        )}
      </div>
    </header>
  );
}
