import React, { useState } from 'react';
import { FilePlus2, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUBMISSION_STATUS_LABELS } from '../../data/i18n';
import type { Submission } from '../../types';
import { slugifyTitle } from '../../utils/routing';

export const AdminSubmissionsTab: React.FC = () => {
  const {
    submissions,
    journalists,
    effectiveSettings,
    currentPermissions,
    saveArticle,
    updateSubmissionStatus,
  } = useApp();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleConvertToDraft = async (sub: Submission) => {
    setBusyId(sub.id);
    setNotice('');
    setError('');
    try {
      const slug = slugifyTitle(sub.titleFr || sub.titleAr || `proposition-${Date.now()}`);
      await saveArticle(
        {
          id: '',
          slug,
          categoryId: sub.categoryId || effectiveSettings.categories[0]?.id || 'geopolitique',
          authorId: journalists[0]?.id || 'karim-benali',
          status: 'draft',
          isFeatured: false,
          fr: {
            title: sub.titleFr,
            subtitle: '',
            summary: sub.summaryFr,
            content: sub.contentFr,
            coverImageUrl: '',
            coverCaption: '',
            ready: Boolean(sub.titleFr && sub.contentFr),
          },
          ar: {
            title: sub.titleAr,
            subtitle: '',
            summary: sub.summaryAr,
            content: sub.contentAr,
            coverImageUrl: '',
            coverCaption: '',
            ready: Boolean(sub.titleAr && sub.contentAr),
          },
          reviewNotes: `Issu de la proposition externe de ${sub.authorName} (${sub.authorEmail}).`,
          createdByUid: '',
          createdByEmail: '',
          approvedByEmail: '',
          approvedAt: '',
          publishedAt: '',
          viewsCount: 0,
        },
        true
      );
      await updateSubmissionStatus(sub, 'converted_to_draft', slug);
      setNotice(
        `Proposition de ${sub.authorName} convertie en brouillon éditorial (soumise au Fondateur avant toute publication).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la conversion.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
          Propositions des journalistes externes
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Réceptionnez les articles transmis via le portail public, convertissez-les en brouillons
          bilingues, puis soumettez-les au Fondateur pour validation.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
          Aucune proposition externe en attente pour le moment.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <strong className="text-slate-900 dark:text-white">{sub.authorName}</strong> (
                  {sub.authorEmail}) · {sub.language.toUpperCase()}
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {SUBMISSION_STATUS_LABELS[sub.status].fr}
                </span>
              </div>

              <h3 className="font-editorial text-lg font-bold text-slate-950 dark:text-white">
                {sub.titleFr || sub.titleAr}
              </h3>

              {(sub.summaryFr || sub.summaryAr) && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {sub.summaryFr || sub.summaryAr}
                </p>
              )}

              {sub.notesForEditors && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notes journaliste : {sub.notesForEditors}
                </p>
              )}

              {currentPermissions.create_articles && sub.status !== 'converted_to_draft' && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={busyId === sub.id}
                    onClick={() => void handleConvertToDraft(sub)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: effectiveSettings.primaryColor }}
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>Convertir en brouillon éditorial</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === sub.id}
                    onClick={() => void updateSubmissionStatus(sub, 'declined')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-red-600"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Décliner</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
