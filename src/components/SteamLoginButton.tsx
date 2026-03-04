import React, { useState } from 'react';

export default function SteamLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      // 1. Fetch the OAuth URL from your server
      const response = await fetch('/api/auth/steam/url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      // 2. Open the OAuth PROVIDER's URL directly in popup
      const authWindow = window.open(
        url,
        'steam_login_popup',
        'width=800,height=600'
      );

      if (!authWindow) {
        // Popup was blocked
        alert('Por favor, permite las ventanas emergentes (popups) para iniciar sesión con Steam.');
      }
    } catch (error) {
      console.error('Steam Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
      {loading ? 'Conectando...' : 'Iniciar sesión con Steam'}
    </button>
  );
}
