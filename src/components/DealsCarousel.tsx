import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import type { Deal } from '../store/useStore';

interface Props {
  deals: Deal[];
}

export default function DealsCarousel({ deals }: Props) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, deals]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(':scope > a')?.offsetWidth ?? 300;
    const gap = 24;
    const scrollAmount = (cardWidth + gap) * 2;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  if (deals.length === 0) return null;

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label={t('deals.prev')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#171a21]/90 hover:bg-[#2a475e] border border-[#2a475e] text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -ml-4"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`[data-carousel]::-webkit-scrollbar { display: none; }`}</style>
        {deals.map((deal) => (
          <a
            key={deal.steamId}
            href={`https://store.steampowered.com/app/${deal.steamId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-start shrink-0 w-[280px] sm:w-[300px] bg-[#171a21] rounded-xl overflow-hidden border border-[#2a475e] hover:border-[#66c0f4] hover:shadow-[0_0_15px_rgba(102,192,244,0.2)] transition-all flex flex-col"
          >
            <div className="relative overflow-hidden">
              <img
                src={deal.image}
                alt={deal.title}
                className="w-full h-36 object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 bg-[#4c6b22] text-[#a4d007] px-2.5 py-0.5 text-sm font-bold rounded shadow-lg">
                -{deal.discount}%
              </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-sm font-bold text-white mb-1 line-clamp-1 hover:text-[#66c0f4] transition-colors">{deal.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{t('deals.appId')}: {deal.steamId}</p>
              <div className="mt-auto flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 line-through">${(deal.currentPrice / (1 - deal.discount / 100)).toFixed(2)}</span>
                  <span className="text-lg font-bold text-white">${deal.currentPrice}</span>
                </div>
                <span className="bg-[#2a475e] text-[#66c0f4] px-3 py-1.5 rounded text-xs font-medium">
                  {t('deals.viewDeal')}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label={t('deals.next')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#171a21]/90 hover:bg-[#2a475e] border border-[#2a475e] text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -mr-4"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
