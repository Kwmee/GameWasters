import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';

export default function PrivacyPage() {
  const { t } = useI18n();
  const sections = [
    { title: t('privacy.collectTitle'), items: t('privacy.collectItems') },
    { title: t('privacy.useTitle'), items: t('privacy.useItems') },
    { title: t('privacy.noSellTitle'), items: t('privacy.noSellItems') },
  ];

  return (
    <main className="py-12 max-w-3xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-[#66c0f4]" />
        <h1 className="text-3xl font-bold text-white">{t('privacy.title')}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('privacy.lastUpdated')}: 2026-03-05</p>
      <p className="text-gray-300 mb-8 leading-relaxed">{t('privacy.intro')}</p>

      {sections.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
          <ul className="space-y-2">
            {(section.items as string[]).map((item, i) => (
              <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                <span className="text-[#66c0f4] mt-1 shrink-0">&#8226;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('privacy.securityTitle')}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{t('privacy.securityDesc')}</p>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">{t('privacy.deleteTitle')}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{t('privacy.deleteDesc')}</p>
      </div>

      <Link to="/" className="text-[#66c0f4] hover:underline text-sm">&larr; {t('privacy.back')}</Link>
    </main>
  );
}
