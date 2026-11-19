import type { Article, ArticleLocaleContent, Language } from '../types';

export function switchLocalePath(pathname: string, targetLang: Language): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (cleanPath === '/' || cleanPath === '') {
    return `/${targetLang}`;
  }
  if (cleanPath === '/fr' || cleanPath === '/ar') {
    return `/${targetLang}`;
  }
  if (cleanPath.startsWith('/fr/')) {
    return `/${targetLang}/${cleanPath.slice(4)}`;
  }
  if (cleanPath.startsWith('/ar/')) {
    return `/${targetLang}/${cleanPath.slice(4)}`;
  }
  if (cleanPath.startsWith('/admin')) {
    return cleanPath;
  }
  return `/${targetLang}${cleanPath}`;
}

export function extractLanguageFromPath(pathname: string): Language | null {
  if (pathname === '/ar' || pathname.startsWith('/ar/')) return 'ar';
  if (pathname === '/fr' || pathname.startsWith('/fr/')) return 'fr';
  return null;
}

export function slugifyTitle(input: string): string {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110);
  return normalized.length >= 2 ? normalized : `article-${Date.now()}`;
}

export interface ResolvedArticleLocale {
  content: ArticleLocaleContent;
  actualLang: Language;
  isFallback: boolean;
}

/**
 * Returns the human-validated locale version if available.
 * Never auto-translates silently: if a language is not yet ready, explicitly flags isFallback = true.
 */
export function resolveArticleLocale(article: Article, preferredLang: Language): ResolvedArticleLocale {
  const preferred = article[preferredLang];
  const alternateLang: Language = preferredLang === 'fr' ? 'ar' : 'fr';
  const alternate = article[alternateLang];

  if (preferred && preferred.ready && preferred.title.trim().length > 0) {
    return { content: preferred, actualLang: preferredLang, isFallback: false };
  }
  if (alternate && alternate.ready && alternate.title.trim().length > 0) {
    return { content: alternate, actualLang: alternateLang, isFallback: true };
  }
  return {
    content: preferred?.title ? preferred : alternate,
    actualLang: preferred?.title ? preferredLang : alternateLang,
    isFallback: !preferred?.title,
  };
}

export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatReadingTime(minutes: number, lang: Language): string {
  if (lang === 'ar') {
    if (minutes <= 1) return 'دقيقة للقراءة';
    if (minutes === 2) return 'دقيقتان للقراءة';
    return `${minutes} دقائق للقراءة`;
  }
  return `${minutes} min de lecture`;
}

export function formatEditorialDate(isoOrTimestamp: unknown, lang: Language): string {
  let date: Date | null = null;
  if (typeof isoOrTimestamp === 'string' && isoOrTimestamp.trim()) {
    const parsed = new Date(isoOrTimestamp);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (
    isoOrTimestamp &&
    typeof isoOrTimestamp === 'object' &&
    'toDate' in isoOrTimestamp &&
    typeof (isoOrTimestamp as { toDate: () => Date }).toDate === 'function'
  ) {
    date = (isoOrTimestamp as { toDate: () => Date }).toDate();
  }
  if (!date) return '';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
