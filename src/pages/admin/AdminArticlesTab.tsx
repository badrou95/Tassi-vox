import React, { useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Edit3,
  Globe,
  HardDrive,
  Lock,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ARTICLE_STATUS_LABELS } from '../../data/i18n';
import type { Article, ArticleStatus } from '../../types';
import { slugifyTitle } from '../../utils/routing';
import { uploadMediaFile } from '../../lib/firebase';
import { FOUNDER_EMAIL } from '../../utils/permissions';

function formatErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(error.message) as { error?: string; path?: string };
    if (parsed && typeof parsed.error === 'string') {
      return `Firebase (${parsed.path || 'articles'}) : ${parsed.error}`;
    }
  } catch {
    // Plain error message
  }
  return error.message || fallback;
}

function createBlankArticle(defaultCategory: string, defaultAuthor: string): Article {
  return {
    id: '',
    slug: '',
    categoryId: defaultCategory,
    authorId: defaultAuthor,
    status: 'draft',
    isFeatured: false,
    fr: {
      title: '',
      subtitle: '',
      summary: '',
      content: '',
      coverImageUrl: '',
      coverCaption: '',
      ready: true,
    },
    ar: {
      title: '',
      subtitle: '',
      summary: '',
      content: '',
      coverImageUrl: '',
      coverCaption: '',
      ready: false,
    },
    reviewNotes: '',
    createdByUid: '',
    createdByEmail: '',
    approvedByEmail: '',
    approvedAt: '',
    publishedAt: '',
    viewsCount: 0,
  };
}

export const AdminArticlesTab: React.FC = () => {
  const {
    articles,
    journalists,
    effectiveSettings,
    user,
    isFounder,
    currentPermissions,
    saveArticle,
    transitionArticleStatus,
    deleteArticle,
    purgeArchivedArticles,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');
  const [editing, setEditing] = useState<Article | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editorLang, setEditorLang] = useState<'fr' | 'ar'>('fr');
  const [reviewNoteInput, setReviewNoteInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmPurgeArchives, setConfirmPurgeArchives] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    return articles.filter((a) => (statusFilter === 'all' ? true : a.status === statusFilter));
  }, [articles, statusFilter]);

  const archivedCount = useMemo(
    () => articles.filter((a) => a.status === 'archived').length,
    [articles]
  );

  const estimatedDataKb = useMemo(() => {
    const totalBytes = articles.reduce(
      (sum, a) => sum + new Blob([JSON.stringify(a)]).size,
      0
    );
    return Math.max(1, Math.round(totalBytes / 1024));
  }, [articles]);

  const canArchiveArticles =
    isFounder || currentPermissions.delete_articles || currentPermissions.edit_all_articles;
  const canPurgeArchives =
    isFounder || currentPermissions.delete_articles || currentPermissions.edit_all_articles;
  const canDeleteArticle = (a: Article) =>
    isFounder ||
    currentPermissions.delete_articles ||
    (a.status === 'archived' && currentPermissions.edit_all_articles);

  const startCreate = () => {
    setError('');
    setMessage('');
    setIsNew(true);
    setEditorLang('fr');
    setEditing(
      createBlankArticle(
        effectiveSettings.categories[0]?.id || 'geopolitique',
        journalists[0]?.id || 'redaction'
      )
    );
  };

  const startEdit = (article: Article) => {
    setError('');
    setMessage('');
    setIsNew(false);
    setEditorLang('fr');
    setEditing(structuredClone(article));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setBusy(true);
    setError('');
    try {
      const url = await uploadMediaFile(file, 'articles');
      setEditing({
        ...editing,
        [editorLang]: { ...editing[editorLang], coverImageUrl: url },
      });
      setMessage('Image téléversée dans Firebase Storage.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de téléversement.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (targetStatus?: ArticleStatus) => {
    if (!editing) return;
    setError('');
    setMessage('');

    const hasFrTitle = editing.fr.title.trim().length > 0;
    const hasArTitle = editing.ar.title.trim().length > 0;
    if (!hasFrTitle && !hasArTitle) {
      setError('Saisissez au moins un titre en français ou en arabe.');
      return;
    }

    const finalSlug = editing.slug.trim()
      ? slugifyTitle(editing.slug)
      : slugifyTitle(editing.fr.title || editing.ar.title);
    const nextStatus = targetStatus || editing.status;

    // Enforce Founder-only publication client-side (also strictly enforced in Firestore Rules)
    if (!isFounder && nextStatus !== 'draft' && nextStatus !== 'pending_review') {
      setError('Seul le Fondateur (tmerzak@gmail.com) peut approuver ou publier un article.');
      return;
    }

    setBusy(true);
    try {
      await saveArticle({ ...editing, slug: finalSlug, status: nextStatus }, isNew);
      setMessage(
        nextStatus === 'pending_review'
          ? 'Article soumis au Fondateur pour validation finale.'
          : 'Article enregistré dans Firebase Firestore.'
      );
      setEditing(null);
    } catch (err) {
      setError(formatErrorMessage(err, 'Erreur lors de la sauvegarde.'));
    } finally {
      setBusy(false);
    }
  };

  const handleWorkflowTransition = async (article: Article, nextStatus: ArticleStatus) => {
    setError('');
    setMessage('');
    setConfirmDeleteId(null);
    setBusy(true);
    try {
      await transitionArticleStatus(article, nextStatus, reviewNoteInput);
      setReviewNoteInput('');
      setMessage(
        nextStatus === 'archived'
          ? `Article « ${article.fr.title || article.ar.title} » archivé (retiré du site public).`
          : nextStatus === 'draft' && article.status === 'archived'
            ? `Article restauré en brouillon.`
            : `Statut mis à jour : ${ARTICLE_STATUS_LABELS[nextStatus].fr}`
      );
    } catch (err) {
      setError(formatErrorMessage(err, 'Action refusée par la politique de sécurité.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (article: Article) => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await deleteArticle(article);
      setConfirmDeleteId(null);
      setMessage(
        `Article « ${article.fr.title || article.ar.title} » supprimé définitivement (base + médias Storage nettoyés).`
      );
    } catch (err) {
      setError(formatErrorMessage(err, 'Suppression refusée.'));
    } finally {
      setBusy(false);
    }
  };

  const handlePurgeArchives = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const count = await purgeArchivedArticles();
      setConfirmPurgeArchives(false);
      setMessage(
        count > 0
          ? `${count} article(s) archivé(s) et leurs images Firebase Storage supprimés pour libérer de l’espace.`
          : 'Aucun article archivé à purger.'
      );
    } catch (err) {
      setError(formatErrorMessage(err, 'Impossible de vider les archives.'));
    } finally {
      setBusy(false);
    }
  };

  const canEditArticle = (a: Article) => {
    if (isFounder) return true;
    if (a.status === 'published' || a.status === 'approved' || a.status === 'archived') return false;
    return (
      currentPermissions.edit_all_articles ||
      (currentPermissions.edit_own_articles && a.createdByUid === user?.uid)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
            Articles bilingues &amp; Validation éditoriale
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Rédaction FR &amp; AR indépendante. Aucune traduction automatique publiée sans validation humaine.
          </p>
        </div>

        {currentPermissions.create_articles && !editing && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white whitespace-nowrap"
            style={{ backgroundColor: effectiveSettings.primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel article bilingue</span>
          </button>
        )}
      </div>

      {/* Founder Exclusivity Banner */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
        {isFounder ? (
          <ShieldCheck
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: effectiveSettings.primaryColor }}
          />
        ) : (
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        )}
        <p>
          {isFounder ? (
            <>
              <strong>Autorité Fondateur active ({FOUNDER_EMAIL}) :</strong> vous êtes l’unique
              personne habilitée à approuver, publier, dépublier ou demander des corrections. Chaque
              validation est horodatée et journalisée dans Firestore.
            </>
          ) : (
            <>
              <strong>Règle éditoriale verrouillée côté serveur :</strong> vous pouvez rédiger des
              brouillons et les soumettre « En attente de validation ». Seul le Fondateur (
              <code>{FOUNDER_EMAIL}</code>) peut approuver et publier définitivement un article.
            </>
          )}
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300">
          {message}
        </div>
      )}

      {/* Bilingual Editor Drawer / View */}
      {editing ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-editorial text-xl font-bold text-slate-950 dark:text-white">
              {isNew ? 'Nouvel article bilingue' : `Édition : ${editing.fr.title || editing.ar.title}`}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Annuler
            </button>
          </div>

          {/* Shared Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="block space-y-1 text-xs font-semibold">
              <span>Slug URL (commun FR &amp; AR)</span>
              <input
                type="text"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="ex: sommet-energie-2026"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              <span>Rubrique</span>
              <select
                value={editing.categoryId}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {effectiveSettings.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameFr} / {c.nameAr}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              <span>Journaliste signataire</span>
              <select
                value={editing.authorId}
                onChange={(e) => setEditing({ ...editing, authorId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {journalists.length === 0 && (
                  <option value="redaction">Rédaction {effectiveSettings.mediaName}</option>
                )}
                {journalists.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.fullNameFr || j.fullNameAr}
                    {j.fullNameFr && j.fullNameAr ? ` (${j.fullNameAr})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2.5 pt-5 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={editing.isFeatured}
                onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span>Article principal « À la une »</span>
            </label>
          </div>

          {/* Language Switch Tabs inside Editor */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setEditorLang('fr')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                editorLang === 'fr'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Version Française ({editing.fr.ready ? 'Prête' : 'Brouillon'})
            </button>
            <button
              type="button"
              onClick={() => setEditorLang('ar')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                editorLang === 'ar'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              النسخة العربية ({editing.ar.ready ? 'جاهزة' : 'مسودة'})
            </button>
          </div>

          {/* Locale-Specific Fields */}
          <div className="space-y-4" dir={editorLang === 'ar' ? 'rtl' : 'ltr'}>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={editing[editorLang].ready}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    [editorLang]: { ...editing[editorLang], ready: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span>
                {editorLang === 'ar'
                  ? 'النسخة العربية مكتملة ومراجَعة بشرياً'
                  : 'Version française complète et relue humainement'}
              </span>
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              <span>{editorLang === 'ar' ? 'العنوان الرئيسي' : 'Titre principal'}</span>
              <input
                type="text"
                value={editing[editorLang].title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    [editorLang]: { ...editing[editorLang], title: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              <span>{editorLang === 'ar' ? 'العنوان الفرعي' : 'Sous-titre'}</span>
              <input
                type="text"
                value={editing[editorLang].subtitle}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    [editorLang]: { ...editing[editorLang], subtitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              <span>{editorLang === 'ar' ? 'الملخص' : 'Résumé / Chapô'}</span>
              <textarea
                rows={2}
                value={editing[editorLang].summary}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    [editorLang]: { ...editing[editorLang], summary: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold">
              <span>{editorLang === 'ar' ? 'نص المقال الكامل' : 'Contenu complet de l’article'}</span>
              <textarea
                rows={8}
                value={editing[editorLang].content}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    [editorLang]: { ...editing[editorLang], content: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <label className="block space-y-1 text-xs font-semibold">
                <span>{editorLang === 'ar' ? 'رابط صورة الغلاف' : 'Image de couverture (URL ou Storage)'}</span>
                <input
                  type="text"
                  value={editing[editorLang].coverImageUrl}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [editorLang]: { ...editing[editorLang], coverImageUrl: e.target.value },
                    })
                  }
                  placeholder="/src/assets/images/..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </label>

              {currentPermissions.upload_media && (
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 h-[38px]">
                  <Upload className="w-4 h-4" />
                  <span>Téléverser image (Firebase Storage)</span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              )}
            </div>

            <label className="block space-y-1 text-xs font-semibold">
              <span>{editorLang === 'ar' ? 'تعليق الصورة' : 'Légende photo'}</span>
              <input
                type="text"
                value={editing[editorLang].coverCaption}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    [editorLang]: { ...editing[editorLang], coverCaption: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave('draft')}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Enregistrer en brouillon
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave('pending_review')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: effectiveSettings.accentColor }}
            >
              <Send className="w-4 h-4" />
              <span>Soumettre au Fondateur</span>
            </button>

            {isFounder && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSave('published')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white ms-auto"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approuver &amp; Publier (Fondateur)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Storage & Archive Space Management Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <HardDrive className="w-4 h-4 shrink-0 text-slate-500" />
              <span>
                <strong>{articles.length}</strong> articles en base (~{estimatedDataKb} Ko) ·{' '}
                <strong>{archivedCount}</strong> archivé(s). La suppression définitive efface aussi
                les images téléversées dans Firebase Storage pour libérer de l’espace.
              </span>
            </div>

            {canPurgeArchives && archivedCount > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {confirmPurgeArchives ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handlePurgeArchives()}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                    >
                      {busy ? 'Suppression…' : `Confirmer purge (${archivedCount})`}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmPurgeArchives(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmPurgeArchives(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider les archives ({archivedCount})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Workflow Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'all',
                'pending_review',
                'draft',
                'changes_requested',
                'approved',
                'published',
                'archived',
              ] as const
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'text-white'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                style={
                  statusFilter === st ? { backgroundColor: effectiveSettings.primaryColor } : undefined
                }
              >
                {st === 'all'
                  ? `Tous (${articles.length})`
                  : st === 'archived'
                    ? `${ARTICLE_STATUS_LABELS[st].fr} (${archivedCount})`
                    : ARTICLE_STATUS_LABELS[st].fr}
              </button>
            ))}
          </div>

          {/* Articles Table / List */}
          <div className="space-y-3">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span
                      className={
                        article.status === 'published'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : article.status === 'pending_review'
                            ? 'text-amber-600 dark:text-amber-400'
                            : article.status === 'changes_requested'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-500'
                      }
                    >
                      {ARTICLE_STATUS_LABELS[article.status].fr}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {article.fr.ready ? 'FR ✓' : 'FR brouillon'} / {article.ar.ready ? 'AR ✓' : 'AR brouillon'}
                    </span>
                    {article.approvedByEmail && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          Validé par {article.approvedByEmail}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="font-editorial text-lg font-bold text-slate-950 dark:text-white truncate">
                    {article.fr.title || article.ar.title}
                  </h3>
                  {article.ar.title && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate" dir="rtl">
                      {article.ar.title}
                    </p>
                  )}
                  {article.reviewNotes && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Note éditoriale : {article.reviewNotes}
                    </p>
                  )}
                </div>

                {/* Controls strictly gated by permissions & Founder status */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canEditArticle(article) && (
                    <button
                      type="button"
                      onClick={() => startEdit(article)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Éditer</span>
                    </button>
                  )}

                  {!isFounder &&
                    (article.status === 'draft' || article.status === 'changes_requested') &&
                    canEditArticle(article) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleWorkflowTransition(article, 'pending_review')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: effectiveSettings.accentColor }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Soumettre</span>
                      </button>
                    )}

                  {/* FOUNDER-ONLY APPROVAL & PUBLISH CONTROLS */}
                  {isFounder && (
                    <>
                      {article.status !== 'published' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleWorkflowTransition(article, 'published')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approuver &amp; Publier</span>
                        </button>
                      )}
                      {article.status === 'pending_review' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setReviewNoteInput('Merci de relire les sources et compléter la version bilingue.');
                            void handleWorkflowTransition(article, 'changes_requested');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Corrections</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Archive / Restore controls (Founder & authorized family admins) */}
                  {canArchiveArticles && article.status !== 'archived' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleWorkflowTransition(article, 'archived')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{article.status === 'published' ? 'Dépublier / Archiver' : 'Archiver'}</span>
                    </button>
                  )}

                  {canArchiveArticles && article.status === 'archived' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleWorkflowTransition(article, 'draft')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurer (brouillon)</span>
                    </button>
                  )}

                  {/* Permanent delete with inline 2-step confirmation (frees Firestore + Storage) */}
                  {canDeleteArticle(article) &&
                    (confirmDeleteId === article.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(article)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                        >
                          {busy ? '…' : 'Confirmer'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(article.id)}
                        aria-label={`Supprimer ${article.fr.title || article.ar.title}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
