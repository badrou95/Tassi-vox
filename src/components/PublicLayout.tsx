import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, Menu, Moon, Sun, X, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy } from '../data/i18n';
import { switchLocalePath } from '../utils/routing';
import { BrandLogo } from './BrandLogo';
import { BreakingNewsBar } from './BreakingNewsBar';

interface PublicLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  pageTitle,
  pageDescription,
}) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    effectiveSettings,
    previewSettings,
    setPreviewSettings,
  } = useApp();
  const copy = getCopy(language);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync dynamic bilingual SEO <title>, <meta>, OpenGraph, and hreflang links
  useEffect(() => {
    const title = pageTitle
      ? `${pageTitle} — ${effectiveSettings.mediaName}`
      : `${effectiveSettings.mediaName} — ${
          language === 'ar' ? effectiveSettings.sloganAr : effectiveSettings.sloganFr
        }`;
    const desc =
      pageDescription ||
      (language === 'ar' ? effectiveSettings.descriptionAr : effectiveSettings.descriptionFr);

    document.title = title;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', desc);

    const origin = window.location.origin;
    const frUrl = `${origin}${switchLocalePath(location.pathname, 'fr')}`;
    const arUrl = `${origin}${switchLocalePath(location.pathname, 'ar')}`;

    const setHreflang = (langCode: string, href: string) => {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${langCode}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', langCode);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };
    setHreflang('fr', frUrl);
    setHreflang('ar', arUrl);
    setHreflang('x-default', frUrl);
  }, [pageTitle, pageDescription, effectiveSettings, language, location.pathname]);

  const handleToggleLanguage = () => {
    const nextLang = language === 'fr' ? 'ar' : 'fr';
    setLanguage(nextLang);
    const nextPath = switchLocalePath(location.pathname, nextLang);
    navigate(nextPath);
  };

  const navItems = effectiveSettings.navigation.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#090E1A] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Live Admin Preview Banner */}
      {previewSettings && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>{copy.previewModeBanner}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admin"
              className="underline font-bold hover:opacity-80 whitespace-nowrap"
            >
              Retour à /admin
            </Link>
            <button
              type="button"
              onClick={() => setPreviewSettings(null)}
              className="px-2.5 py-1 rounded bg-slate-950 text-white hover:bg-slate-800 whitespace-nowrap"
            >
              Quitter l’aperçu
            </button>
          </div>
        </div>
      )}

      {/* Red Breaking News Ticker (Non-sticky to honor 15% mobile sticky budget) */}
      <BreakingNewsBar />

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to={`/${language}`}
            className="focus-visible:outline-2 focus-visible:outline-offset-4 rounded"
            aria-label={effectiveSettings.mediaName}
          >
            <BrandLogo />
          </Link>

          {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700 dark:text-slate-200"
            aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Navigation principale'}
          >
            {navItems.map((item) => {
              const target = item.path ? `/${language}/${item.path}` : `/${language}`;
              const isActive =
                item.path === ''
                  ? location.pathname === `/${language}` || location.pathname === `/${language}/`
                  : location.pathname.startsWith(target);
              return (
                <Link
                  key={item.id}
                  to={target}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-slate-950 dark:text-white'
                      : 'border-transparent hover:text-slate-950 dark:hover:text-white'
                  }`}
                  style={isActive ? { borderColor: effectiveSettings.primaryColor } : undefined}
                >
                  {language === 'ar' ? item.labelAr : item.labelFr}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Language Switch Primary Action + Theme Icon + Mobile Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? copy.lightMode : copy.darkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleLanguage}
              aria-label={language === 'fr' ? 'Passer en arabe' : 'التبديل إلى الفرنسية'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
              style={{ backgroundColor: effectiveSettings.primaryColor }}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{copy.switchToLanguage}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const target = item.path ? `/${language}/${item.path}` : `/${language}`;
              return (
                <Link
                  key={item.id}
                  to={target}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {language === 'ar' ? item.labelAr : item.labelFr}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Editorial Footer */}
      <footer
        className="mt-20 border-t border-slate-200 dark:border-slate-800 text-slate-200"
        style={{ backgroundColor: effectiveSettings.secondaryColor }}
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2.5">
              <span
                className="w-8 h-8 rounded-md inline-flex items-center justify-center font-brand font-extrabold text-white text-sm"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                TV
              </span>
              <span className="font-brand text-xl font-extrabold text-white tracking-tight">
                {effectiveSettings.mediaName}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              {language === 'ar' ? effectiveSettings.footerTextAr : effectiveSettings.footerTextFr}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {effectiveSettings.socials.x && (
                <a
                  href={effectiveSettings.socials.x}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  X / Twitter
                </a>
              )}
              {effectiveSettings.socials.facebook && (
                <a
                  href={effectiveSettings.socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Facebook
                </a>
              )}
              {effectiveSettings.socials.instagram && (
                <a
                  href={effectiveSettings.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
              )}
              {effectiveSettings.socials.youtube && (
                <a
                  href={effectiveSettings.socials.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  YouTube
                </a>
              )}
              {effectiveSettings.socials.linkedin && (
                <a
                  href={effectiveSettings.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h2 className="text-sm font-bold text-white">
              {language === 'ar' ? 'الأقسام' : 'Rubriques'}
            </h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {effectiveSettings.categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/${language}?cat=${cat.id}`}
                    className="hover:text-white transition-colors"
                  >
                    {language === 'ar' ? cat.nameAr : cat.nameFr}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h2 className="text-sm font-bold text-white">
              {language === 'ar' ? 'التحرير والتواصل' : 'Rédaction & Contact'}
            </h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>{effectiveSettings.contactEmail}</li>
              <li className="tabular-nums">{effectiveSettings.contactPhone}</li>
              <li>
                {language === 'ar'
                  ? effectiveSettings.contactAddressAr
                  : effectiveSettings.contactAddressFr}
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-slate-400">
              <Link to={`/${language}/mentions-legales`} className="hover:text-white transition-colors">
                {copy.legalTitle}
              </Link>
              <span aria-hidden="true">·</span>
              <Link to={`/${language}/soumettre`} className="hover:text-white transition-colors">
                {language === 'ar' ? 'إرسال مقال' : 'Soumettre un article'}
              </Link>
              <span aria-hidden="true">·</span>
              <Link to="/admin" className="hover:text-white transition-colors">
                {copy.adminAccess}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              © {new Date().getFullYear()} {effectiveSettings.mediaName}. {copy.copyright}
            </span>
            <span>
              {language === 'ar'
                ? 'النشر التحريري يخضع لمصادقة المؤسس الحصرية'
                : 'Publication sous validation éditoriale exclusive du Fondateur'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
