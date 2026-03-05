import React from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';

export default function TermsPage() {
  const { t } = useI18n();
  const listSections = [
    { title: t('terms.accountTitle'), items: t('terms.accountItems') },
    { title: t('terms.limitationsTitle'), items: t('terms.limitationsItems') },
  ];

  return (
    <main className="py-12 max-w-3xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-8 h-8 text-[#66c0f4]" />
        <h1 className="text-3xl font-bold text-white">{t('terms.title')}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('terms.lastUpdated')}: 2026-03-05</p>
      <p className="text-gray-300 mb-8 leading-relaxed">{t('terms.intro')}</p>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('terms.serviceTitle')}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{t('terms.serviceDesc')}</p>
      </div>

      {listSections.map((section) => (
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
        <h2 className="text-xl font-semibold text-white mb-3">{t('terms.ipTitle')}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{t('terms.ipDesc')}</p>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">{t('terms.changesTitle')}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{t('terms.changesDesc')}</p>
      </div>

      <Link to="/" className="text-[#66c0f4] hover:underline text-sm">&larr; {t('terms.back')}</Link>
    </main>
  );
}
