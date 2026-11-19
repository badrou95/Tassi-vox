import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Palette, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SiteSettings } from '../../types';
import { uploadMediaFile } from '../../lib/firebase';

const VIVID_PRESETS = [
  {
    name: 'Cobalt International (Défaut)',
    primary: '#1D4ED8',
    secondary: '#0B1220',
    accent: '#EA580C',
    breaking: '#DC2626',
  },
  {
    name: 'Indigo & Ambre Press',
    primary: '#4338CA',
    secondary: '#0F172A',
    accent: '#D97706',
    breaking: '#E11D48',
  },
  {
    name: 'Azuré Méditerranée',
    primary: '#0284C7',
    secondary: '#082F49',
    accent: '#F97316',
    breaking: '#DC2626',
  },
];

export const AdminCustomizationTab: React.FC = () => {
  const { siteSettings, previewSettings, setPreviewSettings, saveSiteSettings, currentPermissions } =
    useApp();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<SiteSettings>(() =>
    structuredClone(previewSettings || siteSettings)
  );
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const url = await uploadMediaFile(file, 'branding');
      setDraft((prev) => ({ ...prev, logoUrl: url }));
      setSavedMsg('Logo téléversé dans Firebase Storage. Cliquez sur Enregistrer pour publier.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur de téléversement du logo.');
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = () => {
    setPreviewSettings(draft);
    navigate('/fr');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    setSavedMsg('');
    try {
      await saveSiteSettings(draft);
      setSavedMsg('Paramètres enregistrés dans Firebase et appliqués en direct sur le site public.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setBusy(false);
    }
  };

  const addCategory = () => {
    if (draft.categories.length >= 20) return;
    const id = `rubrique-${draft.categories.length + 1}`;
    setDraft({
      ...draft,
      categories: [
        ...draft.categories,
        { id, nameFr: 'Nouvelle rubrique', nameAr: 'قسم جديد', accentHex: draft.primaryColor },
      ],
    });
  };

  const addNavLink = () => {
    if (draft.navigation.length >= 10) return;
    setDraft({
      ...draft,
      navigation: [
        ...draft.navigation,
        { id: `nav-${Date.now()}`, path: 'contact', labelFr: 'Nouveau lien', labelAr: 'رابط جديد' },
      ],
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
            Personnalisation complète du site
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Modifiez l’identité, les couleurs, les textes FR/AR, les rubriques, la navigation et les
            informations légales en temps réel sans toucher au code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Eye className="w-4 h-4" />
            <span>Prévisualiser avant validation</span>
          </button>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: draft.primaryColor }}
          >
            <Save className="w-4 h-4" />
            <span>{busy ? 'Enregistrement…' : 'Enregistrer dans Firebase'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}
      {savedMsg && (
        <div role="status" className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300">
          {savedMsg}
        </div>
      )}

      {/* 1. Brand Identity & Logo */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          1. Identité du média &amp; Logo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="block space-y-1 text-xs font-semibold">
            <span>Nom du média</span>
            <input
              type="text"
              value={draft.mediaName}
              onChange={(e) => setDraft({ ...draft, mediaName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>URL du logo personnalisé (laisser vide pour le logo vectoriel)</span>
            <input
              type="text"
              value={draft.logoUrl}
              onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </label>
          {currentPermissions.upload_media && (
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 h-[38px]">
              <Upload className="w-4 h-4" />
              <span>Téléverser un logo (Storage)</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1 text-xs font-semibold">
            <span>Slogan (Français)</span>
            <input
              type="text"
              value={draft.sloganFr}
              onChange={(e) => setDraft({ ...draft, sloganFr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>الشعار (العربية)</span>
            <input
              type="text"
              dir="rtl"
              value={draft.sloganAr}
              onChange={(e) => setDraft({ ...draft, sloganAr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>Titre d’accueil (Français)</span>
            <input
              type="text"
              value={draft.heroTitleFr}
              onChange={(e) => setDraft({ ...draft, heroTitleFr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>عنوان الصفحة الرئيسية (العربية)</span>
            <input
              type="text"
              dir="rtl"
              value={draft.heroTitleAr}
              onChange={(e) => setDraft({ ...draft, heroTitleAr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>Sous-titre d’accueil (Français)</span>
            <textarea
              rows={2}
              value={draft.heroSubtitleFr}
              onChange={(e) => setDraft({ ...draft, heroSubtitleFr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>الوصف التمهيدي (العربية)</span>
            <textarea
              rows={2}
              dir="rtl"
              value={draft.heroSubtitleAr}
              onChange={(e) => setDraft({ ...draft, heroSubtitleAr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
        </div>
      </section>

      {/* 2. Vivid Color Palette */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4" style={{ color: draft.primaryColor }} />
            <span>2. Palette de couleurs vives &amp; modernes</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {VIVID_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary,
                    accentColor: preset.accent,
                    breakingColor: preset.breaking,
                  })
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              ['primaryColor', 'Principale (Vive)'],
              ['secondaryColor', 'Secondaire (Contraste)'],
              ['accentColor', 'Accentuation (CTA)'],
              ['breakingColor', 'Rouge Dernière Minute'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1.5 text-xs font-semibold">
              <span>{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                />
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* 3. Categories & Navigation */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              3. Rubriques &amp; Catégories
            </h2>
            <button
              type="button"
              onClick={addCategory}
              className="inline-flex items-center gap-1 text-xs font-bold"
              style={{ color: draft.primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="space-y-2.5">
            {draft.categories.map((cat, idx) => (
              <div key={cat.id + idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={cat.nameFr}
                  onChange={(e) => {
                    const next = [...draft.categories];
                    next[idx] = { ...cat, nameFr: e.target.value };
                    setDraft({ ...draft, categories: next });
                  }}
                  placeholder="Nom FR"
                  className="col-span-5 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={cat.nameAr}
                  onChange={(e) => {
                    const next = [...draft.categories];
                    next[idx] = { ...cat, nameAr: e.target.value };
                    setDraft({ ...draft, categories: next });
                  }}
                  placeholder="الاسم بالعربية"
                  className="col-span-5 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="button"
                  aria-label="Supprimer rubrique"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      categories: draft.categories.filter((_, i) => i !== idx),
                    })
                  }
                  className="col-span-2 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded justify-self-end"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              4. Menu de navigation
            </h2>
            <button
              type="button"
              onClick={addNavLink}
              className="inline-flex items-center gap-1 text-xs font-bold"
              style={{ color: draft.primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="space-y-2.5">
            {draft.navigation.map((nav, idx) => (
              <div key={nav.id + idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={nav.labelFr}
                  onChange={(e) => {
                    const next = [...draft.navigation];
                    next[idx] = { ...nav, labelFr: e.target.value };
                    setDraft({ ...draft, navigation: next });
                  }}
                  placeholder="FR"
                  className="col-span-4 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={nav.labelAr}
                  onChange={(e) => {
                    const next = [...draft.navigation];
                    next[idx] = { ...nav, labelAr: e.target.value };
                    setDraft({ ...draft, navigation: next });
                  }}
                  placeholder="AR"
                  className="col-span-4 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={nav.path}
                  onChange={(e) => {
                    const next = [...draft.navigation];
                    next[idx] = { ...nav, path: e.target.value };
                    setDraft({ ...draft, navigation: next });
                  }}
                  placeholder="chemin"
                  className="col-span-3 px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                />
                <button
                  type="button"
                  aria-label="Supprimer lien"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      navigation: draft.navigation.filter((_, i) => i !== idx),
                    })
                  }
                  className="col-span-1 p-1 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Contact, Socials, Footer & Legal */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          5. Coordonnées, Réseaux sociaux, Pied de page &amp; Mentions légales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1 text-xs font-semibold">
            <span>E-mail de contact</span>
            <input
              type="email"
              value={draft.contactEmail}
              onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>Téléphone</span>
            <input
              type="text"
              value={draft.contactPhone}
              onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>Pied de page (FR)</span>
            <textarea
              rows={2}
              value={draft.footerTextFr}
              onChange={(e) => setDraft({ ...draft, footerTextFr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>تذييل الصفحة (AR)</span>
            <textarea
              rows={2}
              dir="rtl"
              value={draft.footerTextAr}
              onChange={(e) => setDraft({ ...draft, footerTextAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>Mentions légales (FR)</span>
            <textarea
              rows={4}
              value={draft.legalTextFr}
              onChange={(e) => setDraft({ ...draft, legalTextFr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>البيانات القانونية (AR)</span>
            <textarea
              rows={4}
              dir="rtl"
              value={draft.legalTextAr}
              onChange={(e) => setDraft({ ...draft, legalTextAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </label>
        </div>
      </section>
    </form>
  );
};
