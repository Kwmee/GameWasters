import React, { useEffect, useState } from "react";
import SteamLoginButton from "./SteamLoginButton";
import { useStore } from "../store/useStore";
import { Gamepad2, TrendingDown, Sparkles, Clock } from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated, hashedSteamId, deals, setDeals } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("/api/deals")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load deals");
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setDeals(data.data);
        } else {
          setError("No se pudieron cargar las ofertas. Inténtalo de nuevo más tarde.");
        }
      })
      .catch(() => {
        setError("No se pudieron cargar las ofertas. Inténtalo de nuevo más tarde.");
      })
      .finally(() => setLoading(false));
  }, [setDeals]);

  return (
    <div className="min-h-screen bg-[#1b2838] text-[#c7d5e0] font-sans">
      {/* Header */}
      <header className="bg-[#171a21] p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-[#66c0f4]" />
            <h1 className="text-2xl font-bold text-white tracking-wider">SteamDeals<span className="text-[#66c0f4]">AI</span></h1>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm bg-[#2a475e] px-3 py-1 rounded-full text-[#66c0f4]">User: {hashedSteamId}</span>
              <button onClick={() => useStore.getState().logout()} className="text-sm text-gray-400 hover:text-white transition-colors">Cerrar sesión</button>
            </div>
          ) : (
            <SteamLoginButton />
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#171a21] to-[#1b2838] z-0"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Descubre tu próximo juego favorito. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66c0f4] to-[#1999ff]">Al mejor precio.</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Utilizamos Inteligencia Artificial y Filtrado Colaborativo basado en tu <span className="text-white font-semibold">tiempo de juego</span> para recomendarte ofertas personalizadas y rastrear mínimos históricos.
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
                <h3 className="text-xl font-bold text-white mb-2">Recomendaciones SVD</h3>
                <p className="text-gray-400">Algoritmo de 7 factores latentes optimizado para Steam. No te recomendamos lo popular, te recomendamos lo que te gustará.</p>
              </div>
              <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
                <Clock className="w-10 h-10 text-[#66c0f4] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Basado en Playtime</h3>
                <p className="text-gray-400">Analizamos tus horas de juego reales, la métrica más honesta para entender tus verdaderos gustos como jugador.</p>
              </div>
              <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] hover:border-[#66c0f4] transition-colors">
                <TrendingDown className="w-10 h-10 text-[#66c0f4] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Mínimos Históricos</h3>
                <p className="text-gray-400">Integración con IsThereAnyDeal para asegurar que compras en el momento exacto en que el precio toca fondo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Deals Section */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold text-white">
              {isAuthenticated ? "Recomendaciones para ti" : "Ofertas del Momento"}
            </h2>
            {isAuthenticated && <span className="text-sm text-[#66c0f4] bg-[#2a475e] px-3 py-1 rounded-full animate-pulse">Sincronizando biblioteca...</span>}
          </div>

          {error && (
            <p className="mb-6 text-sm text-red-400">
              {error}
            </p>
          )}
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#171a21] p-4 rounded-xl border border-[#2a475e]">
                  <div className="h-40 bg-[#2a475e] rounded-lg mb-4 animate-pulse"></div>
                  <div className="h-6 bg-[#2a475e] rounded w-3/4 mb-3 animate-pulse"></div>
                  <div className="h-4 bg-[#2a475e] rounded w-1/4 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <div key={deal.steamId} className="bg-[#171a21] rounded-xl overflow-hidden border border-[#2a475e] hover:border-[#66c0f4] hover:shadow-[0_0_15px_rgba(102,192,244,0.2)] transition-all group cursor-pointer flex flex-col">
                  <div className="relative overflow-hidden">
                    <img src={deal.image} alt={deal.title} className="w-full h-48 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 right-3 bg-[#4c6b22] text-[#a4d007] px-3 py-1 text-sm font-bold rounded shadow-lg">
                      -{deal.discount}%
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#66c0f4] transition-colors">{deal.title}</h3>
                    <p className="text-xs text-gray-500 mb-4">App ID: {deal.steamId}</p>
                    <div className="mt-auto flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 line-through">${(deal.currentPrice / (1 - deal.discount / 100)).toFixed(2)}</span>
                        <span className="text-xl font-bold text-white">${deal.currentPrice}</span>
                      </div>
                      <button className="bg-[#2a475e] hover:bg-[#66c0f4] hover:text-white text-[#66c0f4] px-4 py-2 rounded text-sm font-medium transition-colors">
                        Ver Oferta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
