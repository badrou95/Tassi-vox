import React, { useState } from 'react';
import { Edit3, Eye, EyeOff, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Journalist } from '../../types';
import { EditorialImage } from '../../components/EditorialImage';
import { uploadMediaFile } from '../../lib/firebase';

const EMPTY_JOURNALIST: Journalist = {
  id: '',
  fullNameFr: '',
  fullNameAr: '',
  roleFr: '',
  roleAr: '',
  bioFr: '',
  bioAr: '',
  careerFr: '',
  careerAr: '',
  coverageAreasFr: [],
  coverageAreasAr: [],
  photoUrl: '',
  socials: {},
  ownerUid: '',
  isVisible: true,
};

function formatErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(error.message) as { error?: string; path?: string };
    if (parsed && typeof parsed.error === 'string') {
      return `Firebase (${parsed.path || 'écriture'}) : ${parsed.error}`;
    }
  } catch {
    // Plain error message
  }
  return error.message || fallback;
}

export const AdminJournalistsTab: React.FC = () => {
  const {
    journalists,
    effectiveSettings,
    isFounder,
    currentPermissions,
    saveJournalist,
    deleteJournalist,
  } = useApp();

  const [editing, setEditing] = useState<Journalist | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [areasFrInput, setAreasFrInput] = useState('');
  const [areasArInput, setAreasArInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const canDeleteJournalist = isFounder || currentPermissions.manage_journalists;

  const openEditor = (j: Journalist | null) => {
    setErr('');
    setMsg('');
    setConfirmDeleteId(null);
    if (!j) {
      setIsNew(true);
      setEditing(structuredClone(EMPTY_JOURNALIST));
      setAreasFrInput('');
      setAreasArInput('');
    } else {
      setIsNew(false);
      setEditing(structuredClone(j));
      setAreasFrInput(j.coverageAreasFr.join(', '));
      setAreasArInput(j.coverageAreasAr.join('، '));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setBusy(true);
    setErr('');
    try {
      const url = await uploadMediaFile(file, 'journalists');
      setEditing({ ...editing, photoUrl: url });
      setMsg('Portrait téléversé dans Firebase Storage.');
    } catch (uploadErr) {
      setErr(formatErrorMessage(uploadErr, 'Erreur lors du téléversement.'));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setErr('');
    setMsg('');
    const hasFrName = editing.fullNameFr.trim().length >= 2;
    const hasArName = editing.fullNameAr.trim().length >= 2;
    if (!hasFrName && !hasArName) {
      setErr('Veuillez indiquer au moins le nom du journaliste en français ou en arabe (2 caractères min.).');
      return;
    }
    setBusy(true);
    try {
      await saveJournalist(
        {
          ...editing,
          coverageAreasFr: areasFrInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          coverageAreasAr: areasArInput
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
        },
        isNew
      );
      setEditing(null);
      setMsg('Fiche journaliste enregistrée dans Firebase.');
    } catch (saveErr) {
      setErr(formatErrorMessage(saveErr, 'Erreur lors de la sauvegarde.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleVisibility = async (j: Journalist) => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await saveJournalist({ ...j, isVisible: !j.isVisible }, false);
      setMsg(
        !j.isVisible
          ? `Le profil de ${j.fullNameFr || j.fullNameAr} est de nouveau public.`
          : `Le profil de ${j.fullNameFr || j.fullNameAr} est masqué (articles conservés).`
      );
    } catch (toggleErr) {
      setErr(formatErrorMessage(toggleErr, 'Impossible de modifier la visibilité.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (j: Journalist) => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await deleteJournalist(j.id);
      setConfirmDeleteId(null);
      setMsg(`Journaliste « ${j.fullNameFr || j.fullNameAr} » supprimé de Firebase.`);
    } catch (delErr) {
      setErr(formatErrorMessage(delErr, 'Suppression impossible.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
            Équipe rédactionnelle &amp; Journalistes publics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Les journalistes apparaissent publiquement sur « Notre équipe » sans jamais disposer
            d’accès au panneau /admin. Vous pouvez masquer un profil tout en conservant l’historique
            de ses publications.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: effectiveSettings.primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un journaliste</span>
          </button>
        )}
      </div>

      {err && (
        <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {err}
        </div>
      )}
      {msg && (
        <div role="status" className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300">
          {msg}
        </div>
      )}

      {editing ? (
        <form
          onSubmit={handleSave}
          noValidate
          className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
        >
          <h2 className="font-editorial text-xl font-bold text-slate-950 dark:text-white">
            {isNew ? 'Nouveau profil journaliste' : `Modifier ${editing.fullNameFr || editing.fullNameAr}`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1 text-xs font-semibold">
              <span>Nom et prénom (FR) *</span>
              <input
                type="text"
                value={editing.fullNameFr}
                onChange={(e) => setEditing({ ...editing, fullNameFr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>الاسم الكامل (AR) *</span>
              <input
                type="text"
                dir="rtl"
                value={editing.fullNameAr}
                onChange={(e) => setEditing({ ...editing, fullNameAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>Fonction / Spécialité (FR) *</span>
              <input
                type="text"
                value={editing.roleFr}
                onChange={(e) => setEditing({ ...editing, roleFr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>الصفة أو التخصص (AR) *</span>
              <input
                type="text"
                dir="rtl"
                value={editing.roleAr}
                onChange={(e) => setEditing({ ...editing, roleAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>Courte biographie (FR)</span>
              <textarea
                rows={2}
                value={editing.bioFr}
                onChange={(e) => setEditing({ ...editing, bioFr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>نبذة مختصرة (AR)</span>
              <textarea
                rows={2}
                dir="rtl"
                value={editing.bioAr}
                onChange={(e) => setEditing({ ...editing, bioAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>Parcours professionnel (FR)</span>
              <textarea
                rows={3}
                value={editing.careerFr}
                onChange={(e) => setEditing({ ...editing, careerFr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>المسار المهني والصحفي (AR)</span>
              <textarea
                rows={3}
                dir="rtl"
                value={editing.careerAr}
                onChange={(e) => setEditing({ ...editing, careerAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>Domaines de couverture FR (séparés par virgule)</span>
              <input
                type="text"
                value={areasFrInput}
                onChange={(e) => setAreasFrInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold">
              <span>مجالات التغطية AR</span>
              <input
                type="text"
                dir="rtl"
                value={areasArInput}
                onChange={(e) => setAreasArInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="block space-y-1 text-xs font-semibold">
              <span>Photo (URL ou Firebase Storage)</span>
              <input
                type="text"
                value={editing.photoUrl}
                onChange={(e) => setEditing({ ...editing, photoUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </label>
            {currentPermissions.upload_media && (
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 h-[38px]">
                <Upload className="w-4 h-4" />
                <span>Téléverser portrait (Storage)</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
            <label className="block space-y-1 text-xs font-semibold">
              <span>UID Firebase lié (optionnel — auto-édition bio)</span>
              <input
                type="text"
                value={editing.ownerUid}
                onChange={(e) => setEditing({ ...editing, ownerUid: e.target.value })}
                placeholder="UID utilisateur journaliste externe"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={editing.isVisible}
              onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span>Afficher publiquement sur « Notre équipe »</span>
          </label>

          {err && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {err}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: effectiveSettings.primaryColor }}
            >
              {busy ? 'Enregistrement…' : 'Enregistrer la fiche'}
            </button>
            <button
              type="button"
              onClick={() => {
                setErr('');
                setEditing(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : journalists.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Aucun journaliste enregistré pour le moment.
          </p>
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: effectiveSettings.primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter le premier journaliste</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journalists.map((j) => (
            <div
              key={j.id}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                  <EditorialImage src={j.photoUrl} alt={j.fullNameFr || j.fullNameAr} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h3 className="font-bold text-base text-slate-950 dark:text-white truncate">
                    {j.fullNameFr || j.fullNameAr}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {j.roleFr || j.roleAr || 'Journaliste'} · {j.isVisible ? 'Public' : 'Masqué (historique préservé)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {confirmDeleteId === j.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(j)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                    >
                      {busy ? '…' : 'Confirmer'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEditor(j)}
                      aria-label={`Modifier ${j.fullNameFr || j.fullNameAr}`}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggleVisibility(j)}
                      aria-label={j.isVisible ? `Masquer ${j.fullNameFr || j.fullNameAr}` : `Afficher ${j.fullNameFr || j.fullNameAr}`}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {j.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {canDeleteJournalist && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(j.id)}
                        aria-label={`Supprimer ${j.fullNameFr || j.fullNameAr}`}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
