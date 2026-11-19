import React from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy } from '../data/i18n';

export const BreakingNewsBar: React.FC = () => {
  const { effectiveSettings, activeBreakingNews, language } = useApp();
  const copy = getCopy(language);

  if (!effectiveSettings.breakingBannerEnabled || activeBreakingNews.length === 0) {
    return null;
  }

  const avgDuration =
    activeBreakingNews.reduce((acc, item) => acc + (item.durationSeconds || 30), 0) /
    activeBreakingNews.length;
  const animationSeconds = Math.max(18, Math.min(90, Math.round(avgDuration)));

  // Duplicate items for seamless infinite horizontal scrolling
  const tickerItems = [...activeBreakingNews, ...activeBreakingNews];

  return (
    <div
      data-testid="breaking-news-banner"
      className="w-full text-white overflow-hidden select-none"
      style={{ backgroundColor: effectiveSettings.breakingColor }}
      role="region"
      aria-label={copy.breakingLabel}
    >
      <div className="max-w-[1360px] mx-auto flex items-center h-10 px-4 sm:px-6 gap-4">
        <div className="inline-flex items-center gap-1.5 shrink-0 font-brand font-extrabold text-xs tracking-wider px-2.5 py-1 rounded bg-black/25 whitespace-nowrap">
          <Radio className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{copy.breakingLabel}</span>
        </div>

        <div className="tv-ticker-viewport relative flex-1 overflow-hidden h-full flex items-center">
          <div
            className="tv-ticker-track items-center gap-10"
            style={{ animationDuration: `${animationSeconds}s` }}
          >
            {tickerItems.map((item, idx) => {
              const label = language === 'ar' ? item.textAr || item.textFr : item.textFr || item.textAr;
              const targetUrl = item.articleSlug ? `/${language}/article/${item.articleSlug}` : null;

              return (
                <div key={`${item.id}-${idx}`} className="inline-flex items-center gap-10 shrink-0">
                  {targetUrl ? (
                    <Link
                      to={targetUrl}
                      className="text-sm font-semibold text-white hover:underline underline-offset-4 whitespace-nowrap transition-opacity"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-white whitespace-nowrap">
                      {label}
                    </span>
                  )}
                  <span className="text-white/50 text-xs" aria-hidden="true">
                    ◆
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
