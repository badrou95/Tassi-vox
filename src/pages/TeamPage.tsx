import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy } from '../data/i18n';
import { PublicLayout } from '../components/PublicLayout';
import { EditorialImage } from '../components/EditorialImage';

export const TeamPage: React.FC = () => {
  const { language, effectiveSettings, visibleJournalists, publishedArticles } = useApp();
  const copy = getCopy(language);
  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <PublicLayout
      pageTitle={copy.ourEditorialTeam}
      pageDescription={
        language === 'ar'
          ? 'تعرّف على صحفيي ومراسلي هيئة تحرير تاسي-فوكس ومجالات تغطيتهم.'
          : 'Découvrez les journalistes, grands reporters et correspondants de la rédaction TASSI-VOX.'
      }
    >
      <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1526]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-12 space-y-3">
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white headline-balance">
            {copy.ourEditorialTeam}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            {language === 'ar'
              ? 'فريق من الصحفيين والمراسلين المستقلين الذين يساهمون بتحقيقاتهم ومقالاتهم عبر بوابة التحرير الخاضعة لمصادقة المؤسس.'
              : 'Des journalistes, correspondants et analystes indépendants qui signent nos reportages bilingues, publiés après relecture et approbation exclusive de la direction fondatrice.'}
          </p>
        </div>
      </section>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleJournalists.map((j) => {
            const count = publishedArticles.filter((a) => a.authorId === j.id).length;
            const areas = language === 'ar' ? j.coverageAreasAr : j.coverageAreasFr;
            return (
              <article
                key={j.id}
                className="flex flex-col justify-between bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                      <EditorialImage
                        src={j.photoUrl}
                        alt={language === 'ar' ? j.fullNameAr : j.fullNameFr}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-editorial text-xl font-bold text-slate-950 dark:text-white truncate">
                        {language === 'ar' ? j.fullNameAr : j.fullNameFr}
                      </h2>
                      <p
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: effectiveSettings.primaryColor }}
                      >
                        {language === 'ar' ? j.roleAr : j.roleFr}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {language === 'ar' ? j.bioAr : j.bioFr}
                  </p>

                  {areas.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {copy.coverageAreas} :{' '}
                      </span>
                      <span>{areas.join(' · ')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {count}{' '}
                    {language === 'ar' ? 'مقالات منشورة' : count > 1 ? 'publications' : 'publication'}
                  </span>
                  <Link
                    to={`/${language}/equipe/${j.id}`}
                    className="inline-flex items-center gap-1 font-bold hover:underline"
                    style={{ color: effectiveSettings.primaryColor }}
                  >
                    <span>{copy.viewProfile}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </PublicLayout>
  );
};
