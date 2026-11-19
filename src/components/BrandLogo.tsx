import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface BrandLogoProps {
  compact?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false }) => {
  const { effectiveSettings } = useApp();
  const [imgFailed, setImgFailed] = useState(false);

  const hasCustomLogo = Boolean(effectiveSettings.logoUrl && !imgFailed);

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      {hasCustomLogo ? (
        <img
          src={effectiveSettings.logoUrl}
          alt={effectiveSettings.mediaName}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-8 w-8 rounded-md object-contain shrink-0"
        />
      ) : (
        <svg
          width="32"
          height="32"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect width="36" height="36" rx="8" fill="var(--tv-primary)" />
          <path
            d="M8.5 11.5H27.5V15H20V26.5H16V15H8.5V11.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M22.5 21.5L26 26.5L29.5 17.5"
            stroke="var(--tv-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {!compact && (
        <span className="font-brand text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          {effectiveSettings.mediaName}
        </span>
      )}
    </span>
  );
};
