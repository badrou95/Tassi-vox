import React, { useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Pause,
  Play,
  Plus,
  Radio,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { BreakingNewsItem } from '../../types';

export const AdminBreakingNewsTab: React.FC = () => {
  const {
    breakingNews,
    publishedArticles,
    effectiveSettings,
    saveSiteSettings,
    saveBreakingNews,
    deleteBreakingNews,
  } = useApp();

  const [textFr, setTextFr] = useState('');
  const [textAr, setTextAr] = useState('');
  const [articleSlug, setArticleSlug] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(32);
  const [expiresAt, setExpiresAt] = useState('2026-12-31T23:59:59Z');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleBanner = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await saveSiteSettings({
        ...effectiveSettings,
        breakingBannerEnabled: !effectiveSettings.breakingBannerEnabled,
      });
      setStatusMsg(
        !effectiveSettings.breakingBannerEnabled
          ? 'Bandeau rouge DERNIÈRE MINUTE activé sur le site public.'
          : 'Bandeau rouge DERNIÈRE MINUTE masqué sur le site public.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors du changement d’état.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    if (!textFr.trim() || !textAr.trim()) {
      setErrorMsg('Saisissez le texte de l’alerte en français ET en arabe.');
      return;
    }

    setBusy(true);
    try {
      const existing = editingId ? breakingNews.find((b) => b.id === editingId) : null;
      const item: BreakingNewsItem = {
        id: existing?.id || '',
        textFr: textFr.trim(),
        textAr: textAr.trim(),
        articleSlug,
        status: existing?.status || 'active',
        sortOrder: existing?.sortOrder ?? breakingNews.length + 1,
        durationSeconds,
        expiresAt,
        createdByUid: existing?.createdByUid || '',
        createdByEmail: existing?.createdByEmail || '',
      };
      await saveBreakingNews(item, !editingId);
      setTextFr('');
      setTextAr('');
      setArticleSlug('');
      setEditingId(null);
      setStatusMsg(editingId ? 'Alerte mise à jour.' : 'Nouvelle alerte publiée dans le bandeau rouge.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickStatus = async (item: BreakingNewsItem, status: BreakingNewsItem['status']) => {
    setBusy(true);
    setErrorMsg('');
    try {
      await saveBreakingNews({ ...item, status }, false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur de mise à jour.');
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = async (item: BreakingNewsItem, delta: number) => {
    setBusy(true);
    setErrorMsg('');
    try {
      await saveBreakingNews(
        { ...item, sortOrder: Math.max(0, item.sortOrder + delta) },
        false
      );
      setStatusMsg('Ordre mis à jour dans Firebase.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors du réordonnancement.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    setBusy(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      await deleteBreakingNews(id);
      setStatusMsg('Alerte supprimée de Firebase.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
            Bandeau rouge « DERNIÈRE MINUTE »
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Contrôlez le fil urgent affiché en haut du site public en français et en arabe.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleToggleBanner}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white"
          style={{
            backgroundColor: effectiveSettings.breakingBannerEnabled
              ? effectiveSettings.breakingColor
              : '#475569',
          }}
        >
          <Radio className="w-4 h-4" />
          <span>
            {effectiveSettings.breakingBannerEnabled
              ? 'Bandeau ACTIF (Cliquer pour désactiver)'
              : 'Bandeau DÉSACTIVÉ (Cliquer pour activer)'}
          </span>
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}
      {statusMsg && (
        <div role="status" className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300">
          {statusMsg}
        </div>
      )}

      {/* Create / Edit Alert Form */}
      <form
        onSubmit={handleSaveAlert}
        noValidate
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
      >
        <h2 className="text-sm font-bold text-slate-950 dark:text-white">
          {editingId ? 'Modifier l’alerte sélectionnée' : 'Publier une nouvelle information urgente'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1 text-xs font-semibold">
            <span>Texte urgent (Français) *</span>
            <input
              type="text"
              value={textFr}
              onChange={(e) => setTextFr(e.target.value)}
              maxLength={260}
              placeholder="Ex : Sommet diplomatique — communiqué final attendu à 18h"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>النص العاجل (العربية) *</span>
            <input
              type="text"
              dir="rtl"
              value={textAr}
              onChange={(e) => setTextAr(e.target.value)}
              maxLength={260}
              placeholder="مثال: القمة الدبلوماسية — صدور البيان الختامي المرتقب"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block space-y-1 text-xs font-semibold">
            <span>Lien vers un article publié (optionnel)</span>
            <select
              value={articleSlug}
              onChange={(e) => setArticleSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            >
              <option value="">Aucun lien d’article</option>
              {publishedArticles.map((art) => (
                <option key={art.id} value={art.slug}>
                  {art.fr.title || art.ar.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-xs font-semibold">
            <span>Durée de défilement (secondes : 10–120)</span>
            <input
              type="number"
              min={10}
              max={120}
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm tabular-nums"
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold">
            <span>Date d’expiration (ISO)</span>
            <input
              type="text"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: effectiveSettings.breakingColor }}
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? 'Mettre à jour l’alerte' : 'Publier dans le bandeau'}</span>
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTextFr('');
                setTextAr('');
                setArticleSlug('');
              }}
              className="text-xs font-semibold text-slate-500"
            >
              Annuler l’édition
            </button>
          )}
        </div>
      </form>

      {/* Active & Archived Breaking News List */}
      <div className="space-y-3">
        {breakingNews.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="tabular-nums">Ordre #{item.sortOrder}</span>
                <span>·</span>
                <span
                  className={
                    item.status === 'active'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-500'
                  }
                >
                  {item.status === 'active'
                    ? 'Active'
                    : item.status === 'paused'
                      ? 'En pause'
                      : 'Archivée'}
                </span>
                <span>·</span>
                <span className="tabular-nums">{item.durationSeconds}s</span>
              </div>
              <p className="text-sm font-bold text-slate-950 dark:text-white">{item.textFr}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400" dir="rtl">
                {item.textAr}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                aria-label="Monter l’ordre"
                onClick={() => void handleReorder(item, -1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Descendre l’ordre"
                onClick={() => void handleReorder(item, 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(item.id);
                  setTextFr(item.textFr);
                  setTextAr(item.textAr);
                  setArticleSlug(item.articleSlug);
                  setDurationSeconds(item.durationSeconds);
                  setExpiresAt(item.expiresAt);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700"
              >
                Modifier
              </button>
              {item.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => void handleQuickStatus(item, 'paused')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleQuickStatus(item, 'active')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Activer</span>
                </button>
              )}
              {item.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => void handleQuickStatus(item, 'archived')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archiver</span>
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                aria-label="Supprimer l’alerte"
                onClick={() => void handleDeleteAlert(item.id)}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
