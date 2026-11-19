import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
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

export const HomePage: React.FC = () => {
  const { language, effectiveSettings, publishedArticles, visibleJournalists } = useApp();
  const copy = getCopy(language);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCat = searchParams.get('cat') || 'all';
  const [queryText, setQueryText] = useState('');

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  const getCategoryName = (catId: string) => {
    const found = effectiveSettings.categories.find((c) => c.id === catId);
    if (!found) return catId;
    return language === 'ar' ? found.nameAr : found.nameFr;
  };

  const getJournalist = (authorId: string) =>
    visibleJournalists.find((j) => j.id === authorId);

  const filteredArticles = useMemo(() => {
    return publishedArticles.filter((article) => {
      if (activeCat !== 'all' && article.categoryId !== activeCat) return false;
      if (!queryText.trim()) return true;
      const q = queryText.trim().toLowerCase();
      const loc = resolveArticleLocale(article, language).content;
      return (
        loc.title.toLowerCase().includes(q) ||
        loc.summary.toLowerCase().includes(q) ||
        loc.subtitle.toLowerCase().includes(q)
      );
    });
  }, [publishedArticles, activeCat, queryText, language]);

  const leadArticle = useMemo(() => {
    if (activeCat !== 'all' || queryText.trim()) {
      return filteredArticles[0] || null;
    }
    return filteredArticles.find((a) => a.isFeatured) || filteredArticles[0] || null;
  }, [filteredArticles, activeCat, queryText]);

  const secondaryArticles = useMemo(
    () => filteredArticles.filter((a) => a.id !== leadArticle?.id),
    [filteredArticles, leadArticle]
  );

  const setCategory = (catId: string) => {
    if (catId === 'all') {
      searchParams.delete('cat');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ cat: catId }, { replace: true });
    }
  };

  return (
    <PublicLayout>
      {/* Editorial Masthead Intro & Filter Strip */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1526]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 lg:py-10 space-y-6">
          <div className="max-w-3xl space-y-2.5">
            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15] headline-balance">
              {language === 'ar' ? effectiveSettings.heroTitleAr : effectiveSettings.heroTitleFr}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {language === 'ar'
                ? effectiveSettings.heroSubtitleAr
                : effectiveSettings.heroSubtitleFr}
            </p>
          </div>

          {/* Interactive Category Filter Controls + Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0"
              role="tablist"
              aria-label={language === 'ar' ? 'تصفية حسب القسم' : 'Filtrer par rubrique'}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeCat === 'all'}
                onClick={() => setCategory('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  activeCat === 'all'
                    ? 'text-white'
                    : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                style={
                  activeCat === 'all'
                    ? { backgroundColor: effectiveSettings.primaryColor }
                    : undefined
                }
              >
                {copy.allCategories}
              </button>
              {effectiveSettings.categories.map((cat) => {
                const isSelected = activeCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setCategory(cat.id)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                      isSelected
                        ? 'text-white'
                        : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: effectiveSettings.primaryColor }
                        : undefined
                    }
                  >
                    {language === 'ar' ? cat.nameAr : cat.nameFr}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <Search
                className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={copy.searchPlaceholder}
                aria-label={copy.searchPlaceholder}
                className="w-full ps-10 pe-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': effectiveSettings.primaryColor } as React.CSSProperties}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Editorial Front Page */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 space-y-16">
        {!leadArticle ? (
          <div className="text-center py-20 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#111827]">
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {copy.noPublishedYet}
            </p>
          </div>
        ) : (
          <>
            {/* Tier 1: Dominant Lead Story Focal Anchor */}
            {(() => {
              const resolved = resolveArticleLocale(leadArticle, language);
              const author = getJournalist(leadArticle.authorId);
              const minutes = estimateReadingMinutes(resolved.content.content);
              return (
                <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <Link
                    to={`/${language}/article/${leadArticle.slug}`}
                    className="lg:col-span-7 relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-[16/10] lg:aspect-auto lg:min-h-[420px] group"
                  >
                    <EditorialImage
                      src={resolved.content.coverImageUrl}
                      alt={resolved.content.title}
                      fallbackTitle={resolved.content.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </Link>

                  <div className="lg:col-span-5 flex flex-col justify-between py-2 space-y-6">
                    <div className="space-y-4">
                      {/* Zero-pill metadata kicker */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span style={{ color: effectiveSettings.accentColor }}>
                          {copy.leadStoryKicker}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span style={{ color: effectiveSettings.primaryColor }}>
                          {getCategoryName(leadArticle.categoryId)}
                        </span>
                        {leadArticle.publishedAt && (
                          <>
                            <span aria-hidden="true">·</span>
                            <time className="tabular-nums">
                              {formatEditorialDate(leadArticle.publishedAt, language)}
                            </time>
                          </>
                        )}
                      </div>

                      <Link
                        to={`/${language}/article/${leadArticle.slug}`}
                        className="block group"
                      >
                        <h2 className="font-editorial text-2xl sm:text-3xl lg:text-[2.15rem] font-bold text-slate-950 dark:text-white leading-[1.2] headline-balance group-hover:opacity-80 transition-opacity">
                          {resolved.content.title}
                        </h2>
                      </Link>

                      {resolved.content.subtitle && (
                        <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {resolved.content.subtitle}
                        </p>
                      )}

                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                        {resolved.content.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {author && (
                          <Link
                            to={`/${language}/equipe/${author.id}`}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:underline"
                          >
                            {copy.byAuthor}{' '}
                            {language === 'ar' ? author.fullNameAr : author.fullNameFr}
                          </Link>
                        )}
                        <span className="mx-2" aria-hidden="true">
                          ·
                        </span>
                        <span className="tabular-nums">
                          {formatReadingTime(minutes, language)}
                        </span>
                      </div>

                      <Link
                        to={`/${language}/article/${leadArticle.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
                        style={{ color: effectiveSettings.primaryColor }}
                      >
                        <span>{copy.readArticle}</span>
                        <ArrowIcon className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })()}

            {/* Tier 2: Secondary Editorial Grid */}
            {secondaryArticles.length > 0 && (
              <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
                    {copy.latestDispatches}
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {secondaryArticles.length}{' '}
                    {language === 'ar' ? 'مقالات' : secondaryArticles.length > 1 ? 'articles' : 'article'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {secondaryArticles.map((article) => {
                    const resolved = resolveArticleLocale(article, language);
                    const author = getJournalist(article.authorId);
                    const minutes = estimateReadingMinutes(resolved.content.content);
                    return (
                      <article
                        key={article.id}
                        className="flex flex-col bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <Link
                          to={`/${language}/article/${article.slug}`}
                          className="block aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900"
                        >
                          <EditorialImage
                            src={resolved.content.coverImageUrl}
                            alt={resolved.content.title}
                            fallbackTitle={resolved.content.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                          />
                        </Link>

                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span
                                className="font-semibold"
                                style={{ color: effectiveSettings.primaryColor }}
                              >
                                {getCategoryName(article.categoryId)}
                              </span>
                              {article.publishedAt && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <time className="tabular-nums">
                                    {formatEditorialDate(article.publishedAt, language)}
                                  </time>
                                </>
                              )}
                            </div>

                            <Link
                              to={`/${language}/article/${article.slug}`}
                              className="block group"
                            >
                              <h3 className="font-editorial text-xl font-bold text-slate-950 dark:text-white leading-snug headline-balance group-hover:opacity-80 transition-opacity">
                                {resolved.content.title}
                              </h3>
                            </Link>

                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                              {resolved.content.summary}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {author ? (
                              <Link
                                to={`/${language}/equipe/${author.id}`}
                                className="font-semibold text-slate-800 dark:text-slate-200 hover:underline truncate"
                              >
                                {language === 'ar' ? author.fullNameAr : author.fullNameFr}
                              </Link>
                            ) : (
                              <span>{effectiveSettings.mediaName}</span>
                            )}
                            <span className="tabular-nums shrink-0">
                              {formatReadingTime(minutes, language)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* Tier 3: Editorial Team Spotlight */}
        {visibleJournalists.length > 0 && (
          <section className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
                  {copy.ourEditorialTeam}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {language === 'ar'
                    ? 'الصحفيون والمراسلون الذين يوقّعون تحقيقات وتقارير المنصة.'
                    : 'Les journalistes et grands reporters qui signent nos enquêtes et analyses.'}
                </p>
              </div>
              <Link
                to={`/${language}/equipe`}
                className="inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap hover:opacity-80"
                style={{ color: effectiveSettings.primaryColor }}
              >
                <span>{copy.viewAllJournalists}</span>
                <ArrowIcon className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleJournalists.slice(0, 3).map((j) => (
                <Link
                  key={j.id}
                  to={`/${language}/equipe/${j.id}`}
                  className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                    <EditorialImage
                      src={j.photoUrl}
                      alt={language === 'ar' ? j.fullNameAr : j.fullNameFr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-bold text-base text-slate-950 dark:text-white truncate">
                      {language === 'ar' ? j.fullNameAr : j.fullNameFr}
                    </h3>
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: effectiveSettings.primaryColor }}
                    >
                      {language === 'ar' ? j.roleAr : j.roleFr}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {language === 'ar' ? j.bioAr : j.bioFr}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
};
