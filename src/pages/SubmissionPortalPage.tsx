import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ImagePlus,
  Lock,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy, SUBMISSION_STATUS_LABELS } from '../data/i18n';
import { PublicLayout } from '../components/PublicLayout';
import { uploadSubmissionImage } from '../lib/firebase';
import { MAX_SUBMISSION_IMAGE_BYTES, validateSubmissionImageFile } from '../utils/permissions';

function formatBytesLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

export const SubmissionPortalPage: React.FC = () => {
  const {
    language,
    effectiveSettings,
    user,
    userEmail,
    isFamilyMember,
    myJournalistAccount,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    logout,
    submissions,
    journalists,
    requestJournalistAccount,
    createSubmission,
  } = useApp();
  const copy = getCopy(language);

  // Auth email/password mode for external journalists
  const [authTab, setAuthTab] = useState<'google' | 'register' | 'login'>('google');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState('');
  const [authErr, setAuthErr] = useState('');

  // Account application form state
  const [reqName, setReqName] = useState('');
  const [reqSpecialty, setReqSpecialty] = useState('');
  const [reqContact, setReqContact] = useState('');
  const [reqBio, setReqBio] = useState('');
  const [reqPortfolio, setReqPortfolio] = useState('');
  const [reqBusy, setReqBusy] = useState(false);
  const [reqMsg, setReqMsg] = useState('');
  const [reqErr, setReqErr] = useState('');

  // Article submission form state (Approved journalists ONLY + mandatory <= 2MB photo)
  const [authorName, setAuthorName] = useState('');
  const [subLang, setSubLang] = useState<'fr' | 'ar' | 'bilingual'>('fr');
  const [categoryId, setCategoryId] = useState(effectiveSettings.categories[0]?.id || 'geopolitique');
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [summaryFr, setSummaryFr] = useState('');
  const [summaryAr, setSummaryAr] = useState('');
  const [contentFr, setContentFr] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageCaption, setCoverImageCaption] = useState('');
  const [coverImageSizeBytes, setCoverImageSizeBytes] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notesForEditors, setNotesForEditors] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (myJournalistAccount?.fullName && !authorName) {
      setAuthorName(myJournalistAccount.fullName);
    } else if (user?.displayName && !authorName) {
      setAuthorName(user.displayName);
    }
    if (user?.displayName && !reqName) {
      setReqName(user.displayName);
    }
  }, [myJournalistAccount, user, authorName, reqName]);

  const myJournalistProfile = user
    ? journalists.find((j) => j.ownerUid && j.ownerUid === user.uid)
    : null;
  const mySubmissions = user ? submissions.filter((s) => s.authorUid === user.uid) : [];
  const isApprovedToSubmit = isFamilyMember || myJournalistAccount?.status === 'approved';

  const handleGoogleAuth = async () => {
    setAuthErr('');
    setAuthMsg('');
    setAuthBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthErr(err instanceof Error ? err.message : 'Connexion Google interrompue.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErr('');
    setAuthMsg('');
    if (!authEmail.trim() || authPassword.length < 6) {
      setAuthErr(
        language === 'ar'
          ? 'يرجى إدخال بريد إلكتروني صحيح وكلمة مرور من 6 أحرف على الأقل.'
          : 'Saisissez un e-mail valide et un mot de passe (6 caractères min.).'
      );
      return;
    }
    setAuthBusy(true);
    try {
      if (authTab === 'register') {
        await registerWithEmail(authEmail, authPassword);
        setAuthMsg(
          language === 'ar'
            ? 'تم إنشاء الحساب. يرجى فتح بريدك الإلكتروني لتفعيل العنوان ثم إرسال طلب الاعتماد.'
            : 'Compte créé. Cliquez sur le lien de vérification envoyé par e-mail puis complétez votre demande d’accréditation.'
        );
      } else {
        await signInWithEmail(authEmail, authPassword);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setAuthErr(
          language === 'ar'
            ? 'تسجيل الدخول عبر البريد الإلكتروني غير مفعّل بعد في Firebase. يمكنك استخدام حساب Google فوراً.'
            : 'La connexion par e-mail/mot de passe doit être activée dans Firebase Console. Utilisez « Se connecter avec Google » immédiatement.'
        );
      } else {
        setAuthErr(msg);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAccountApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqErr('');
    setReqMsg('');
    if (reqName.trim().length < 2) {
      setReqErr(
        language === 'ar'
          ? 'يرجى إدخال الاسم الكامل (حرفان على الأقل).'
          : 'Veuillez renseigner votre nom complet (2 caractères minimum).'
      );
      return;
    }
    setReqBusy(true);
    try {
      await requestJournalistAccount({
        fullName: reqName,
        specialty: reqSpecialty,
        phoneOrContact: reqContact,
        bio: reqBio,
        portfolioUrl: reqPortfolio,
      });
      setReqMsg(
        language === 'ar'
          ? 'تم إرسال طلب حساب الصحفي بنجاح. بانتظار موافقة الإدارة.'
          : 'Demande de compte journaliste transmise à la Direction pour approbation.'
      );
    } catch (err) {
      setReqErr(err instanceof Error ? err.message : 'Erreur lors de l’envoi de la demande.');
    } finally {
      setReqBusy(false);
    }
  };

  const handleArticlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setErrorMsg('');

    const check = validateSubmissionImageFile(file, language);
    if (!check.valid) {
      setErrorMsg(check.error || 'Image refusée.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const uploaded = await uploadSubmissionImage(file, user.uid, language);
      setCoverImageUrl(uploaded.url);
      setCoverImageSizeBytes(uploaded.sizeBytes);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : language === 'ar'
            ? 'تعذر رفع الصورة إلى الخادم.'
            : 'Erreur lors du téléversement sécurisé de la photo.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = (authorName || myJournalistAccount?.fullName || user?.displayName || '').trim();
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

    if (!coverImageUrl || coverImageSizeBytes <= 0 || coverImageSizeBytes > MAX_SUBMISSION_IMAGE_BYTES) {
      setErrorMsg(
        language === 'ar'
          ? 'إرفاق صورة للمقال إلزامي (JPG أو PNG أو WebP، بحد أقصى 2 ميغابايت).'
          : 'Une photo illustrant l’article est obligatoire (JPG, PNG ou WebP · 2 Mo maximum).'
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
        coverImageUrl,
        coverImageCaption,
        coverImageSizeBytes,
        notesForEditors,
      });
      setTitleFr('');
      setTitleAr('');
      setSummaryFr('');
      setSummaryAr('');
      setContentFr('');
      setContentAr('');
      setCoverImageUrl('');
      setCoverImageCaption('');
      setCoverImageSizeBytes(0);
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
          {/* Governance & Security Notice */}
          <div className="p-5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-3.5 text-sm text-slate-700 dark:text-slate-200">
            <ShieldCheck
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color: effectiveSettings.primaryColor }}
            />
            <div className="space-y-1">
              <p className="font-bold text-slate-950 dark:text-white">
                {language === 'ar'
                  ? 'حسابات صحفية معتمدة من الإدارة — صورة إلزامية بحد أقصى 2 ميغابايت'
                  : 'Comptes journalistes approuvés par la Direction — Photo obligatoire (2 Mo max)'}
              </p>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {language === 'ar'
                  ? 'يخضع كل حساب صحفي جديد لموافقة الإدارة أولاً. لا يمكن للصحفي المعتمد سوى إرسال مقالاته مرفقة بصورة أصلية (JPG/PNG/WebP لا تتجاوز 2 ميغابايت)، دون أي وصول للوحة الإدارة /admin.'
                  : 'Chaque compte journaliste doit être approuvé par la Direction avant de pouvoir soumettre des articles. Une photo d’illustration sécurisée (JPG, PNG ou WebP, 2 Mo max) est exigée pour chaque article.'}
              </p>
            </div>
          </div>

          {/* STEP 1: NOT SIGNED IN */}
          {!user ? (
            <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <Lock className="w-5 h-5" style={{ color: effectiveSettings.primaryColor }} />
                <h2 className="font-editorial text-xl font-bold">
                  {language === 'ar'
                    ? 'إنشاء حساب صحفي أو تسجيل الدخول'
                    : 'Créer un compte journaliste ou se connecter'}
                </h2>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'ar'
                  ? 'سجّل الدخول بحساب Google أو أنشئ حساباً بالبريد الإلكتروني لطلب اعتمادك لدى إدارة تاسي-فوكس.'
                  : 'Connectez-vous avec Google (recommandé) ou créez un compte par e-mail pour demander votre accréditation auprès de la Direction.'}
              </p>

              {authErr && (
                <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                  {authErr}
                </div>
              )}
              {authMsg && (
                <div role="status" className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                  {authMsg}
                </div>
              )}

              <button
                type="button"
                disabled={authBusy}
                onClick={() => void handleGoogleAuth()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {language === 'ar'
                    ? 'المتابعة عبر حساب Google (صحفي)'
                    : 'Continuer avec Google (Compte journaliste)'}
                </span>
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className={authTab === 'register' ? 'underline' : 'text-slate-500'}
                    style={authTab === 'register' ? { color: effectiveSettings.primaryColor } : undefined}
                  >
                    {language === 'ar' ? 'إنشاء حساب بالبريد الإلكتروني' : 'Créer un compte par e-mail'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className={authTab === 'login' ? 'underline' : 'text-slate-500'}
                    style={authTab === 'login' ? { color: effectiveSettings.primaryColor } : undefined}
                  >
                    {language === 'ar' ? 'لدي حساب بالفعل' : 'J’ai déjà un compte e-mail'}
                  </button>
                </div>

                {(authTab === 'register' || authTab === 'login') && (
                  <form onSubmit={handleEmailAuth} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="journaliste@exemple.com"
                      className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder={language === 'ar' ? 'كلمة المرور (6+ أحرف)' : 'Mot de passe (6+ car.)'}
                      className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={authBusy}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 disabled:opacity-60"
                      >
                        {authTab === 'register'
                          ? language === 'ar'
                            ? 'إنشاء الحساب'
                            : 'Créer mon compte'
                          : language === 'ar'
                            ? 'تسجيل الدخول'
                            : 'Se connecter'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : !isApprovedToSubmit ? (
            /* STEP 2 & 3: SIGNED IN, AWAITING APPLICATION OR DIRECTION APPROVAL */
            <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'متصل بحساب:' : 'Connecté en tant que :'}{' '}
                  </span>
                  <strong className="text-slate-950 dark:text-white">{userEmail || user.email}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
                </button>
              </div>

              {myJournalistAccount?.status === 'pending' ? (
                <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-bold text-base">
                    <Clock className="w-5 h-5 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? 'طلب حسابك الصحفي قيد المراجعة من طرف الإدارة'
                        : 'Demande de compte journaliste en attente d’approbation'}
                    </span>
                  </div>
                  <p className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                    {language === 'ar'
                      ? `مرحباً ${myJournalistAccount.fullName}، تم تسجيل طلبك بنجاح. بمجرد موافقة إدارة تاسي-فوكس في لوحة التحكم، سيفتح لك نموذج إرسال المقالات تلقائياً هنا.`
                      : `Bonjour ${myJournalistAccount.fullName}, votre dossier d’accréditation est bien transmis. Dès que la Direction aura approuvé votre compte dans /admin, le formulaire de soumission d’articles s’ouvrira automatiquement ici.`}
                  </p>
                </div>
              ) : myJournalistAccount?.status === 'rejected' || myJournalistAccount?.status === 'suspended' ? (
                <div className="p-5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-red-700 dark:text-red-300 font-bold text-base">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>
                      {myJournalistAccount.status === 'suspended'
                        ? language === 'ar'
                          ? 'تم تعليق هذا الحساب الصحفي من طرف الإدارة'
                          : 'Compte journaliste suspendu par la Direction'
                        : language === 'ar'
                          ? 'لم تتم الموافقة على طلب الحساب الصحفي'
                          : 'Demande de compte journaliste refusée'}
                    </span>
                  </div>
                  {myJournalistAccount.reviewNotes && (
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {language === 'ar' ? 'ملاحظة الإدارة: ' : 'Motif de la Direction : '}
                      {myJournalistAccount.reviewNotes}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAccountApplication} noValidate className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-5 h-5" style={{ color: effectiveSettings.primaryColor }} />
                    <h2 className="font-editorial text-xl font-bold text-slate-950 dark:text-white">
                      {language === 'ar'
                        ? 'استمارة طلب اعتماد حساب صحفي'
                        : 'Demander l’ouverture de mon compte journaliste'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {language === 'ar'
                      ? 'املأ بياناتك المهنية لإرسالها إلى إدارة التحرير للموافقة. بعد الاعتماد، ستتمكن من إرسال مقالاتك مع صورها.'
                      : 'Renseignez votre profil professionnel. La Direction examinera votre demande dans /admin afin d’activer votre accès de soumission d’articles.'}
                  </p>

                  {reqErr && (
                    <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                      {reqErr}
                    </div>
                  )}
                  {reqMsg && (
                    <div role="status" className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                      {reqMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block space-y-1 text-xs font-semibold">
                      <span>{language === 'ar' ? 'الاسم الكامل *' : 'Nom complet *'}</span>
                      <input
                        type="text"
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                        placeholder={language === 'ar' ? 'الاسم واللقب' : 'Prénom et Nom'}
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </label>
                    <label className="block space-y-1 text-xs font-semibold">
                      <span>{language === 'ar' ? 'التخصص الصحفي' : 'Spécialité éditoriale'}</span>
                      <input
                        type="text"
                        value={reqSpecialty}
                        onChange={(e) => setReqSpecialty(e.target.value)}
                        placeholder={language === 'ar' ? 'جيوسياسة، اقتصاد، ثقافة…' : 'Géopolitique, Économie, Culture…'}
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </label>
                    <label className="block space-y-1 text-xs font-semibold">
                      <span>{language === 'ar' ? 'الهاتف أو وسيلة التواصل' : 'Téléphone / Contact'}</span>
                      <input
                        type="text"
                        value={reqContact}
                        onChange={(e) => setReqContact(e.target.value)}
                        placeholder="+213…"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </label>
                    <label className="block space-y-1 text-xs font-semibold">
                      <span>{language === 'ar' ? 'رابط أعمالك أو حسابك المهني (اختياري)' : 'Portfolio / LinkedIn (optionnel)'}</span>
                      <input
                        type="text"
                        value={reqPortfolio}
                        onChange={(e) => setReqPortfolio(e.target.value)}
                        placeholder="https://…"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1 text-xs font-semibold">
                    <span>{language === 'ar' ? 'نبذة مختصرة عن خبرتك الصحفية' : 'Courte présentation / expérience journalistique'}</span>
                    <textarea
                      rows={3}
                      value={reqBio}
                      onChange={(e) => setReqBio(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={reqBusy}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                    style={{ backgroundColor: effectiveSettings.primaryColor }}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {reqBusy
                        ? language === 'ar'
                          ? 'جارٍ الإرسال…'
                          : 'Envoi en cours…'
                        : language === 'ar'
                          ? 'إرسال طلب الحساب للموافقة'
                          : 'Soumettre ma demande à la Direction'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* STEP 4: APPROVED JOURNALIST — ARTICLE SUBMISSION WITH MANDATORY <= 2MB PHOTO */
            <form
              onSubmit={handleSubmitArticle}
              noValidate
              className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-sm">
                <div className="space-y-0.5">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'متصل بحساب:' : 'Connecté en tant que :'}{' '}
                    </span>
                    <strong className="text-slate-950 dark:text-white">{userEmail || user.email}</strong>
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {language === 'ar'
                        ? 'حساب صحفي معتمد من طرف الإدارة'
                        : 'Compte journaliste approuvé par la Direction'}
                    </span>
                  </p>
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

              {/* MANDATORY SECURE ARTICLE PHOTO (<= 2 MB, JPG/PNG/WebP ONLY) */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                      {language === 'ar'
                        ? 'صورة المقال (إلزامية) *'
                        : 'Photo de l’article (obligatoire) *'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'ar'
                        ? 'لأسباب أمنية: صيغ JPG أو PNG أو WebP فقط · الحجم الأقصى 2 ميغابايت.'
                        : 'Sécurité stricte : formats JPG, PNG ou WebP uniquement · Volume maximum 2 Mo.'}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: effectiveSettings.primaryColor }}
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>
                      {uploadingPhoto
                        ? language === 'ar'
                          ? 'جارٍ الرفع…'
                          : 'Téléversement…'
                        : coverImageUrl
                          ? language === 'ar'
                            ? 'تغيير الصورة'
                            : 'Remplacer la photo'
                          : language === 'ar'
                            ? 'اختيار صورة (2 Mo max)'
                            : 'Choisir une photo (2 Mo max)'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingPhoto}
                      onChange={handleArticlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {coverImageUrl && (
                  <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                    <img
                      src={coverImageUrl}
                      alt={coverImageCaption || 'Aperçu photo article'}
                      className="w-full sm:w-44 h-28 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {language === 'ar' ? 'صورة مرفقة وآمنة' : 'Photo vérifiée'} ·{' '}
                          {formatBytesLabel(coverImageSizeBytes)} / 2 Mo max
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImageUrl('');
                            setCoverImageSizeBytes(0);
                            setCoverImageCaption('');
                          }}
                          className="inline-flex items-center gap-1 text-red-600 hover:underline font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'إزالة' : 'Retirer'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={coverImageCaption}
                        onChange={(e) => setCoverImageCaption(e.target.value)}
                        maxLength={240}
                        placeholder={
                          language === 'ar'
                            ? 'وصف الصورة ومصدرها (اختياري)'
                            : 'Légende et crédit photo (optionnel)'
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>
                )}
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

              {errorMsg && (
                <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || uploadingPhoto}
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
                      ? 'إرسال المقال مع الصورة للإدارة'
                      : 'Transmettre l’article et sa photo à la Direction'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Sidebar: My Submissions & Permissions Summary */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-editorial text-lg font-bold text-slate-950 dark:text-white">
              {language === 'ar' ? 'شروط وصلاحيات الصحفي' : 'Règles & droits du compte journaliste'}
            </h2>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                •{' '}
                {language === 'ar'
                  ? 'كل حساب صحفي جديد يُعتمد مسبقاً من طرف الإدارة في /admin.'
                  : 'Chaque compte journaliste est validé au préalable par la Direction.'}
              </li>
              <li>
                •{' '}
                {language === 'ar'
                  ? 'إرسال المقالات مرفقة بصورة إلزامية (JPG / PNG / WebP · 2 ميغابايت كحد أقصى).'
                  : 'Soumission d’articles uniquement avec photo d’illustration (JPG, PNG, WebP · 2 Mo max).'}
              </li>
              <li>
                •{' '}
                {language === 'ar'
                  ? 'تحديث السيرة العامة والصورة الشخصية المرتبطة بالملف ومتابعة حالة المقالات.'
                  : 'Suivi de vos propositions et gestion de votre biographie publique liée.'}
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
                    <li key={sub.id} className="py-3 flex items-start gap-3">
                      {sub.coverImageUrl && (
                        <img
                          src={sub.coverImageUrl}
                          alt={sub.titleFr || sub.titleAr}
                          className="w-12 h-12 rounded object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      )}
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {sub.titleFr || sub.titleAr}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {SUBMISSION_STATUS_LABELS[sub.status][language]}
                        </p>
                      </div>
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
