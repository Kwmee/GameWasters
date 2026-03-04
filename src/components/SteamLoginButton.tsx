import React, { useState } from "react";

export default function SteamLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    try {
      setError(null);
      setLoading(true);

      const authWindow = window.open(
        "/api/auth/steam/login",
        "steam_login_popup",
        "width=800,height=600",
      );

      if (!authWindow) {
        alert("Por favor, permite las ventanas emergentes (popups) para iniciar sesión con Steam.");
      }
    } catch (err) {
      console.error("Steam Login error:", err);
      setError("No se pudo iniciar sesión con Steam. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="flex items-center gap-3 bg-[#171a21] hover:bg-[#2a475e] text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg"
          alt="Steam Logo"
          className="w-6 h-6"
        />
        {loading ? "Conectando..." : "Iniciar sesión con Steam"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
