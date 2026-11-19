import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy } from '../data/i18n';
import { PublicLayout } from '../components/PublicLayout';
import { EditorialImage } from '../components/EditorialImage';
import {
  estimateReadingMinutes,
  formatEditorialDate,
  formatReadingTime,
  resolveArticleLocale,
} from '../utils/routing';

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, effectiveSettings, publishedArticles, visibleJournalists, setLanguage } = useApp();
  const copy = getCopy(language);
  const BackArrow = language === 'ar' ? ArrowRight : ArrowLeft;

  const article = publishedArticles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <PublicLayout pageTitle={language === 'ar' ? 'المقال غير موجود' : 'Article introuvable'}>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-5">
          <h1 className="font-editorial text-3xl font-bold text-slate-950 dark:text-white">
            {language === 'ar' ? 'هذا المقال غير متوفر حالياً' : 'Article introuvable ou non publié'}
          </h1>
          <Link
            to={`/${language}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: effectiveSettings.primaryColor }}
          >
            <BackArrow className="w-4 h-4" />
            {copy.backHome}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const resolved = resolveArticleLocale(article, language);
  const content = resolved.content;
  const author = visibleJournalists.find((j) => j.id === article.authorId);
  const category = effectiveSettings.categories.find((c) => c.id === article.categoryId);
  const categoryName = category
    ? language === 'ar'
      ? category.nameAr
      : category.nameFr
    : article.categoryId;
  const minutes = estimateReadingMinutes(content.content);
  const otherLang = language === 'fr' ? 'ar' : 'fr';
  const hasOtherLang = Boolean(article[otherLang]?.ready && article[otherLang]?.title);

  const related = publishedArticles
    .filter((a) => a.id !== article.id && a.categoryId === article.categoryId)
    .slice(0, 3);

  const paragraphs = content.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <PublicLayout pageTitle={content.title} pageDescription={content.summary}>
      <article className="max-w-[1160px] mx-auto px-4 sm:px-6 py-10">
        {/* Top Back Link */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to={`/${language}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            <span>{copy.backHome}</span>
          </Link>

          {hasOtherLang && (
            <Link
              to={`/${otherLang}/article/${article.slug}`}
              onClick={() => setLanguage(otherLang)}
              className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
              style={{ color: effectiveSettings.primaryColor }}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                {otherLang === 'ar'
                  ? 'قراءة النسخة العربية المعتمدة'
                  : 'Lire la version française validée'}
              </span>
            </Link>
          )}
        </div>

        {/* Fallback Language Notice (Never auto-translated without human approval) */}
        {resolved.isFallback && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
            {copy.languageFallbackBanner}{' '}
            <strong>{resolved.actualLang === 'fr' ? 'Français' : 'العربية'}</strong>
          </div>
        )}

        {/* Headline Block */}
        <header className="max-w-3xl space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span style={{ color: effectiveSettings.primaryColor }}>{categoryName}</span>
            {article.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <time className="tabular-nums">
                  {formatEditorialDate(article.publishedAt, language)}
                </time>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {formatReadingTime(minutes, language)}
            </span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-950 dark:text-white leading-[1.16] headline-balance">
            {content.title}
          </h1>

          {content.subtitle && (
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {content.subtitle}
            </p>
          )}

          {author && (
            <div className="pt-2 flex items-center gap-3">
              <Link
                to={`/${language}/equipe/${author.id}`}
                className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800"
              >
                <EditorialImage
                  src={author.photoUrl}
                  alt={language === 'ar' ? author.fullNameAr : author.fullNameFr}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="text-sm">
                <Link
                  to={`/${language}/equipe/${author.id}`}
                  className="font-bold text-slate-950 dark:text-white hover:underline"
                >
                  {language === 'ar' ? author.fullNameAr : author.fullNameFr}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? author.roleAr : author.roleFr}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Hero Cover Photograph + Editorial Caption */}
        <figure className="mb-10">
          <div className="aspect-[16/9] max-h-[540px] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
            <EditorialImage
              src={content.coverImageUrl}
              alt={content.title}
              fallbackTitle={content.title}
              className="w-full h-full object-cover"
            />
          </div>
          {content.coverCaption && (
            <figcaption className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 italic">
              {content.coverCaption}
            </figcaption>
          )}
        </figure>

        {/* 70/30 Editorial Reading Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Prose Column (65-75ch optimal measure) */}
          <div
            className="lg:col-span-8 max-w-2xl space-y-6 text-base sm:text-[17px] leading-[1.82] text-slate-800 dark:text-slate-200"
            dir={resolved.actualLang === 'ar' ? 'rtl' : 'ltr'}
          >
            {content.summary && (
              <p className="text-lg font-semibold text-slate-950 dark:text-white leading-relaxed pb-4 border-b border-slate-200 dark:border-slate-800">
                {content.summary}
              </p>
            )}

            {paragraphs.map((para, index) => (
              <p
                key={index}
                className={
                  index === 0 && resolved.actualLang === 'fr'
                    ? 'first-letter:text-5xl first-letter:font-editorial first-letter:font-bold first-letter:float-left first-letter:me-3 first-letter:leading-none'
                    : ''
                }
              >
                {para}
              </p>
            ))}

            {/* Editorial Validation Footnote */}
            <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck
                className="w-4 h-4 shrink-0"
                style={{ color: effectiveSettings.primaryColor }}
              />
              <span>
                {language === 'ar'
                  ? 'مقال معتمد ومصادق على نشره من طرف الإدارة المؤسِّسة لمنصة تاسي-فوكس.'
                  : 'Publication vérifiée et approuvée par la Direction Fondatrice TASSI-VOX.'}
              </span>
            </div>
          </div>

          {/* Right/End Editorial Margin Column */}
          <aside className="lg:col-span-4 space-y-8">
            {author && (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                    <EditorialImage
                      src={author.photoUrl}
                      alt={language === 'ar' ? author.fullNameAr : author.fullNameFr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-base text-slate-950 dark:text-white truncate">
                      {language === 'ar' ? author.fullNameAr : author.fullNameFr}
                    </h2>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: effectiveSettings.primaryColor }}
                    >
                      {language === 'ar' ? author.roleAr : author.roleFr}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'ar' ? author.bioAr : author.bioFr}
                </p>
                <Link
                  to={`/${language}/equipe/${author.id}`}
                  className="inline-block text-xs font-bold hover:underline"
                  style={{ color: effectiveSettings.primaryColor }}
                >
                  {copy.viewProfile}
                </Link>
              </div>
            )}

            {related.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-editorial text-lg font-bold text-slate-950 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                  {copy.relatedStories}
                </h2>
                <div className="space-y-4">
                  {related.map((rel) => {
                    const relLoc = resolveArticleLocale(rel, language).content;
                    return (
                      <Link
                        key={rel.id}
                        to={`/${language}/article/${rel.slug}`}
                        className="block group space-y-1"
                      >
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:underline leading-snug">
                          {relLoc.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatEditorialDate(rel.publishedAt, language)}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    </PublicLayout>
  );
};
