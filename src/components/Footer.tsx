import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-[#171a21] border-t border-[#2a475e] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-6 h-6 text-[#66c0f4]" />
              <span className="text-lg font-bold text-white">Game<span className="text-[#66c0f4]">Wasters</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm text-gray-400 hover:text-[#66c0f4] transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-400 hover:text-[#66c0f4] transition-colors">{t('footer.terms')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('footer.resources')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://store.steampowered.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[#66c0f4] transition-colors">
                  {t('footer.steamStore')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2a475e] pt-6">
          <p className="text-xs text-gray-500 text-center">
            &copy; {new Date().getFullYear()} GameWasters. {t('footer.rights')}
          </p>
          <p className="text-xs text-gray-600 text-center mt-1">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
}
