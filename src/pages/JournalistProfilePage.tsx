import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Edit3, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy } from '../data/i18n';
import { PublicLayout } from '../components/PublicLayout';
import { EditorialImage } from '../components/EditorialImage';
import { formatEditorialDate, resolveArticleLocale } from '../utils/routing';
import { uploadMediaFile } from '../lib/firebase';

export const JournalistProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    language,
    effectiveSettings,
    journalists,
    publishedArticles,
    user,
    updateOwnJournalistProfile,
  } = useApp();
  const copy = getCopy(language);
  const BackArrow = language === 'ar' ? ArrowRight : ArrowLeft;

  const journalist = journalists.find((j) => j.id === id);
  const canSelfEdit = Boolean(
    user && user.emailVerified && journalist && journalist.ownerUid === user.uid
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [bioFr, setBioFr] = useState(journalist?.bioFr || '');
  const [bioAr, setBioAr] = useState(journalist?.bioAr || '');
  const [careerFr, setCareerFr] = useState(journalist?.careerFr || '');
  const [careerAr, setCareerAr] = useState(journalist?.careerAr || '');
  const [photoUrl, setPhotoUrl] = useState(journalist?.photoUrl || '');

  if (!journalist || (!journalist.isVisible && !canSelfEdit)) {
    return (
      <PublicLayout pageTitle={language === 'ar' ? 'الملف غير متوفر' : 'Profil introuvable'}>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-5">
          <h1 className="font-editorial text-3xl font-bold text-slate-950 dark:text-white">
            {language === 'ar' ? 'هذا الملف غير متوفر للعموم' : 'Profil journaliste non disponible'}
          </h1>
          <Link
            to={`/${language}/equipe`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: effectiveSettings.primaryColor }}
          >
            <BackArrow className="w-4 h-4" />
            {copy.backTeam}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const authorArticles = publishedArticles.filter((a) => a.authorId === journalist.id);
  const name = language === 'ar' ? journalist.fullNameAr : journalist.fullNameFr;
  const role = language === 'ar' ? journalist.roleAr : journalist.roleFr;
  const bio = language === 'ar' ? journalist.bioAr : journalist.bioFr;
  const career = language === 'ar' ? journalist.careerAr : journalist.careerFr;
  const areas = language === 'ar' ? journalist.coverageAreasAr : journalist.coverageAreasFr;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    setFeedback('');
    try {
      const url = await uploadMediaFile(file, 'journalist-avatar', user.uid);
      setPhotoUrl(url);
      setFeedback('Photo téléversée dans Firebase Storage. Cliquez sur Enregistrer.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Erreur lors du téléversement.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await updateOwnJournalistProfile(journalist, {
        fullNameFr: journalist.fullNameFr,
        fullNameAr: journalist.fullNameAr,
        roleFr: journalist.roleFr,
        roleAr: journalist.roleAr,
        bioFr,
        bioAr,
        careerFr,
        careerAr,
        coverageAreasFr: journalist.coverageAreasFr,
        coverageAreasAr: journalist.coverageAreasAr,
        photoUrl: photoUrl || journalist.photoUrl,
        socials: journalist.socials,
      });
      setEditing(false);
      setFeedback(language === 'ar' ? 'تم تحديث ملفك العام بنجاح.' : 'Votre profil public a été mis à jour.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicLayout pageTitle={name} pageDescription={bio}>
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-10 space-y-12">
        <Link
          to={`/${language}/equipe`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
        >
          <BackArrow className="w-4 h-4" />
          <span>{copy.backTeam}</span>
        </Link>

        {/* Journalist Header Card */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pb-10 border-b border-slate-200 dark:border-slate-800">
          <div className="md:col-span-3">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <EditorialImage src={journalist.photoUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="md:col-span-9 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white">
                  {name}
                </h1>
                <p
                  className="text-sm font-bold mt-1"
                  style={{ color: effectiveSettings.primaryColor }}
                >
                  {role}
                </p>
              </div>

              {canSelfEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setBioFr(journalist.bioFr);
                    setBioAr(journalist.bioAr);
                    setCareerFr(journalist.careerFr);
                    setCareerAr(journalist.careerAr);
                    setPhotoUrl(journalist.photoUrl);
                    setEditing((v) => !v);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: effectiveSettings.primaryColor }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{copy.editMyBio}</span>
                </button>
              )}
            </div>

            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">{bio}</p>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">{copy.careerPath}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{career}</p>
            </div>

            {areas.length > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-950 dark:text-white">
                  {copy.coverageAreas} :{' '}
                </span>
                <span>{areas.join(' · ')}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              {journalist.socials.x && (
                <a
                  href={journalist.socials.x}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: effectiveSettings.primaryColor }}
                  className="hover:underline"
                >
                  X / Twitter
                </a>
              )}
              {journalist.socials.linkedin && (
                <a
                  href={journalist.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: effectiveSettings.primaryColor }}
                  className="hover:underline"
                >
                  LinkedIn
                </a>
              )}
              {journalist.socials.website && (
                <a
                  href={journalist.socials.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: effectiveSettings.primaryColor }}
                  className="hover:underline"
                >
                  Site web
                </a>
              )}
            </div>

            {feedback && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}
          </div>
        </section>

        {/* External Journalist Self-Edit Form (Only for Linked Owner UID — Zero Admin Privileges) */}
        {canSelfEdit && editing && (
          <form
            onSubmit={handleSaveOwnProfile}
            className="p-6 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-5"
          >
            <h2 className="font-editorial text-xl font-bold text-slate-950 dark:text-white">
              {copy.editMyBio}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Biographie courte (FR)</span>
                <textarea
                  value={bioFr}
                  onChange={(e) => setBioFr(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">السيرة المختصرة (AR)</span>
                <textarea
                  dir="rtl"
                  value={bioAr}
                  onChange={(e) => setBioAr(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Parcours professionnel (FR)</span>
                <textarea
                  value={careerFr}
                  onChange={(e) => setCareerFr(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">المسار المهني (AR)</span>
                <textarea
                  dir="rtl"
                  value={careerAr}
                  onChange={(e) => setCareerAr(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                <Upload className="w-4 h-4" />
                <span>Changer ma photo (Firebase Storage)</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Published Articles by this Journalist */}
        <section className="space-y-6">
          <h2 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
            {copy.publishedArticles} ({authorArticles.length})
          </h2>

          {authorArticles.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{copy.noPublishedYet}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authorArticles.map((article) => {
                const loc = resolveArticleLocale(article, language).content;
                return (
                  <Link
                    key={article.id}
                    to={`/${language}/article/${article.slug}`}
                    className="group flex flex-col bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <EditorialImage
                        src={loc.coverImageUrl}
                        alt={loc.title}
                        fallbackTitle={loc.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <time className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatEditorialDate(article.publishedAt, language)}
                      </time>
                      <h3 className="font-editorial text-lg font-bold text-slate-950 dark:text-white leading-snug group-hover:underline">
                        {loc.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {loc.summary}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
};
