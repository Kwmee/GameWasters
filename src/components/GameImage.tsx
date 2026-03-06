import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/useI18n';

interface Props {
  title: string;
  appId?: number | string;
  primarySrc?: string | null;
  fallbackSources?: string[];
  className?: string;
  loading?: 'eager' | 'lazy';
}

const EMPTY_SOURCES: string[] = [];

function uniqueSources(sources: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  return sources.filter((value): value is string => {
    if (!value) return false;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });
}

export default function GameImage({
  title,
  appId,
  primarySrc,
  fallbackSources,
  className = '',
  loading = 'lazy',
}: Props) {
  const { t } = useI18n();
  const fallbackByApp = useMemo(() => {
    if (!appId) return [];
    return [
      `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
      `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`,
    ];
  }, [appId]);

  const sources = useMemo(
    () => uniqueSources([primarySrc, ...(fallbackSources ?? EMPTY_SOURCES), ...fallbackByApp]),
    [primarySrc, fallbackSources, fallbackByApp]
  );
  const sourcesKey = sources.join('|');

  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSrc = sources[sourceIndex];
  const hasImage = typeof currentSrc === 'string' && currentSrc.length > 0;

  useEffect(() => {
    setSourceIndex(0);
  }, [sourcesKey]);

  if (!hasImage) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-[#1b2838] to-[#2a475e] flex items-center justify-center text-center px-2`}
      >
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="text-[11px] uppercase tracking-wide text-gray-300 font-semibold">{t('images.noImage')}</span>
          <span className="text-sm text-white font-bold mt-1 line-clamp-2">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={title}
      className={className}
      referrerPolicy="no-referrer"
      loading={loading}
      onError={() => {
        setSourceIndex((prev) => prev + 1);
      }}
    />
  );
}
