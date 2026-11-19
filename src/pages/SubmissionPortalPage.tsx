import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Send, ShieldCheck, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy, SUBMISSION_STATUS_LABELS } from '../data/i18n';
import { PublicLayout } from '../components/PublicLayout';

export const SubmissionPortalPage: React.FC = () => {
  const {
    language,
    effectiveSettings,
    user,
    userEmail,
    signInWithGoogle,
    logout,
    submissions,
    journalists,
    createSubmission,
  } = useApp();
  const copy = getCopy(language);

  const [authorName, setAuthorName] = useState(user?.displayName || '');
  const [subLang, setSubLang] = useState<'fr' | 'ar' | 'bilingual'>('fr');
  const [categoryId, setCategoryId] = useState(effectiveSettings.categories[0]?.id || 'geopolitique');
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [summaryFr, setSummaryFr] = useState('');
  const [summaryAr, setSummaryAr] = useState('');
  const [contentFr, setContentFr] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [notesForEditors, setNotesForEditors] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myJournalistProfile = user
    ? journalists.find((j) => j.ownerUid && j.ownerUid === user.uid)
    : null;
  const mySubmissions = user ? submissions.filter((s) => s.authorUid === user.uid) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = (authorName || user?.displayName || '').trim();
    if (trimmedName.length < 2) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى إدخال اسمك الكامل (حرفان على الأقل).'
          : 'Veuillez renseigner votre nom complet (2 caractères minimum).'
      );
      return;
    }

    const hasFr = titleFr.trim().length > 0 && contentFr.trim().length > 0;
    const hasAr = titleAr.trim().length > 0 && contentAr.trim().length > 0;
    if (!hasFr && !hasAr) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى كتابة عنوان ونص المقال بالفرنسية أو العربية على الأقل.'
          : 'Veuillez saisir au moins un titre et un texte (en français ou en arabe).'
      );
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission({
        authorName: trimmedName,
        language: subLang,
        categoryId,
        titleFr,
        titleAr,
        summaryFr,
        summaryAr,
        contentFr,
        contentAr,
        notesForEditors,
      });
      setTitleFr('');
      setTitleAr('');
      setSummaryFr('');
      setSummaryAr('');
      setContentFr('');
      setContentAr('');
      setNotesForEditors('');
      setSuccessMsg(copy.submitSuccess);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la transmission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout pageTitle={copy.submitPortalTitle} pageDescription={copy.submitPortalSubtitle}>
      <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1526]">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-10 space-y-3">
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white headline-balance">
            {copy.submitPortalTitle}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {copy.submitPortalSubtitle}
          </p>
        </div>
      </section>

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Governance Notice */}
          <div className="p-5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-3.5 text-sm text-slate-700 dark:text-slate-200">
            <ShieldCheck
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color: effectiveSettings.primaryColor }}
            />
            <div className="space-y-1">
              <p className="font-bold text-slate-950 dark:text-white">
                {language === 'ar'
                  ? 'مسار تحريري آمن ومنفصل عن لوحة الإدارة'
                  : 'Canal rédactionnel sécurisé, strictement séparé de /admin'}
              </p>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {language === 'ar'
                  ? 'تُرسل مقالات الصحفيين الخارجيين مباشرة إلى فريق التحرير العائلي للمراجعة والتدقيق، ولا يتم نشر أي مقال إلا بموافقة حصرية من المؤسس.'
                  : 'Vos textes sont transmis au secrétariat de rédaction familial pour relecture et mise en forme bilingue. Seul le Fondateur est habilité à approuver et publier un article.'}
              </p>
            </div>
          </div>

          {!user ? (
            <div className="p-8 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <Lock className="w-5 h-5" style={{ color: effectiveSettings.primaryColor }} />
                <h2 className="font-editorial text-xl font-bold">
                  {language === 'ar' ? 'تسجيل دخول الصحفي الموثّق' : 'Authentification journaliste vérifiée'}
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {copy.submitSignInRequired}
              </p>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {language === 'ar'
                    ? 'تسجيل الدخول عبر حساب Google (صحفي)'
                    : 'Se connecter avec Google (Compte journaliste)'}
                </span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'متصل بحساب:' : 'Connecté en tant que :'}{' '}
                  </span>
                  <strong className="text-slate-950 dark:text-white">{userEmail || user.email}</strong>
                </div>
                <div className="flex items-center gap-3">
                  {myJournalistProfile && (
                    <Link
                      to={`/${language}/equipe/${myJournalistProfile.id}`}
                      className="text-xs font-bold hover:underline"
                      style={{ color: effectiveSettings.primaryColor }}
                    >
                      {copy.myPublicProfile}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    {language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300"
                >
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div
                  role="status"
                  className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold">
                    {language === 'ar' ? 'اسم الصحفي *' : 'Nom du journaliste *'}
                  </span>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={language === 'ar' ? 'الاسم واللقب' : 'Prénom et Nom'}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold">
                    {language === 'ar' ? 'القسم المقترح' : 'Rubrique'}
                  </span>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    {effectiveSettings.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {language === 'ar' ? cat.nameAr : cat.nameFr}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold">
                    {language === 'ar' ? 'لغة النص' : 'Langue de rédaction'}
                  </span>
                  <select
                    value={subLang}
                    onChange={(e) => setSubLang(e.target.value as 'fr' | 'ar' | 'bilingual')}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                    <option value="bilingual">Bilingue (FR + AR)</option>
                  </select>
                </label>
              </div>

              {(subLang === 'fr' || subLang === 'bilingual') && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Version française
                  </h3>
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium">Titre (FR)</span>
                    <input
                      type="text"
                      value={titleFr}
                      onChange={(e) => setTitleFr(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium">Résumé / Chapô (FR)</span>
                    <textarea
                      rows={2}
                      value={summaryFr}
                      onChange={(e) => setSummaryFr(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium">Corps de l’article (FR)</span>
                    <textarea
                      rows={6}
                      value={contentFr}
                      onChange={(e) => setContentFr(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                </div>
              )}

              {(subLang === 'ar' || subLang === 'bilingual') && (
                <div className="space-y-4 pt-2" dir="rtl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    النسخة العربية
                  </h3>
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium">العنوان (AR)</span>
                    <input
                      type="text"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium">الملخص (AR)</span>
                    <textarea
                      rows={2}
                      value={summaryAr}
                      onChange={(e) => setSummaryAr(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium">نص المقال (AR)</span>
                    <textarea
                      rows={6}
                      value={contentAr}
                      onChange={(e) => setContentAr(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </label>
                </div>
              )}

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">
                  {language === 'ar' ? 'ملاحظات ومصادر لهيئة التحرير' : 'Sources & notes pour la rédaction'}
                </span>
                <textarea
                  rows={2}
                  value={notesForEditors}
                  onChange={(e) => setNotesForEditors(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: effectiveSettings.accentColor }}
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? language === 'ar'
                      ? 'جارٍ الإرسال…'
                      : 'Transmission…'
                    : language === 'ar'
                      ? 'إرسال المقال لهيئة التحرير'
                      : 'Transmettre à l’équipe éditoriale'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Sidebar: My Submissions & Permissions Summary */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-editorial text-lg font-bold text-slate-950 dark:text-white">
              {language === 'ar' ? 'صلاحيات الصحفي الخارجي' : 'Droits des journalistes externes'}
            </h2>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                •{' '}
                {language === 'ar'
                  ? 'إرسال المقالات والمقترحات عبر هذه البوابة المؤمّنة.'
                  : 'Transmettre des articles et propositions via ce portail sécurisé.'}
              </li>
              <li>
                •{' '}
                {language === 'ar'
                  ? 'إدارة السيرة العامة والصورة الشخصية المرتبطة بالملف.'
                  : 'Mettre à jour sa propre biographie publique et sa photo de profil liée.'}
              </li>
              <li>
                •{' '}
                {language === 'ar'
                  ? 'الاطلاع على المقالات المنشورة وحالة المقترحات المرسلة.'
                  : 'Consulter ses publications publiées et le suivi de ses propositions.'}
              </li>
              <li className="text-red-700 dark:text-red-400 font-semibold">
                •{' '}
                {language === 'ar'
                  ? 'لا يوجد أي وصول إلى لوحة الإدارة /admin ولا نشر مباشر.'
                  : 'Aucun accès au panneau /admin, aux paramètres, aux comptes ni à la publication directe.'}
              </li>
            </ul>
          </div>

          {user && (
            <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="font-editorial text-lg font-bold text-slate-950 dark:text-white">
                {copy.mySubmissions} ({mySubmissions.length})
              </h2>
              {mySubmissions.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar'
                    ? 'لم ترسل أي مقترح بعد.'
                    : 'Aucune proposition envoyée pour le moment.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mySubmissions.map((sub) => (
                    <li key={sub.id} className="py-3 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sub.titleFr || sub.titleAr}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {SUBMISSION_STATUS_LABELS[sub.status][language]}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </PublicLayout>
  );
};
