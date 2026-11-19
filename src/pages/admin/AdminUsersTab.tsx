import React, { useState } from 'react';
import { Lock, Plus, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PERMISSION_LABELS, ROLE_LABELS } from '../../data/i18n';
import type { AdminUser, FamilyRole, PermissionKey } from '../../types';
import {
  ALL_PERMISSION_KEYS,
  createCoFounderDefaultPermissions,
  createTechDirectorDefaultPermissions,
  emailToDocId,
  FOUNDER_EMAIL,
} from '../../utils/permissions';

export const AdminUsersTab: React.FC = () => {
  const { adminUsers, isFounder, effectiveSettings, saveAdminUser, deleteAdminUser } = useApp();

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('Membre familial autorisé');
  const [newRole, setNewRole] = useState<FamilyRole>('co_founder');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (!isFounder) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-[#111827] border border-red-200 dark:border-red-900 space-y-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
          <Lock className="w-5 h-5" />
          <span>Gestion des comptes réservée exclusivement au Fondateur</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Seul le compte propriétaire protégé (<code>{FOUNDER_EMAIL}</code>) peut ajouter,
          modifier, désactiver ou supprimer des membres familiaux et ajuster leurs 14 permissions
          individuelles.
        </p>
      </div>
    );
  }

  const handleAddFamilyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const normalized = newEmail.trim().toLowerCase();
    if (!normalized.includes('@') || newName.trim().length < 2) {
      setError('Veuillez saisir une adresse e-mail valide et un nom.');
      return;
    }
    setBusyId('new');
    try {
      const perms =
        newRole === 'tech_director'
          ? createTechDirectorDefaultPermissions()
          : createCoFounderDefaultPermissions();
      const account: AdminUser = {
        id: emailToDocId(normalized),
        email: normalized,
        displayName: newName.trim(),
        familyRelation: newRelation.trim() || 'Membre familial',
        role: newRole === 'founder' ? 'co_founder' : newRole,
        isActive: true,
        isProtectedOwner: false,
        permissions: perms,
        updatedByEmail: FOUNDER_EMAIL,
      };
      await saveAdminUser(account, true);
      setNewEmail('');
      setNewName('');
      setNotice(`Compte familial ${normalized} autorisé dans Firestore.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePermission = async (account: AdminUser, key: PermissionKey) => {
    if (account.isProtectedOwner || key === 'manage_users') return;
    setBusyId(account.id);
    setError('');
    setNotice('');
    try {
      await saveAdminUser(
        {
          ...account,
          permissions: {
            ...account.permissions,
            [key]: !account.permissions[key],
          },
        },
        false
      );
      setNotice(`Permission mise à jour pour ${account.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (account: AdminUser) => {
    if (account.isProtectedOwner) return;
    setBusyId(account.id);
    setError('');
    try {
      await saveAdminUser({ ...account, isActive: !account.isActive }, false);
      setNotice(
        account.isActive
          ? `Compte ${account.email} désactivé (accès /admin révoqué immédiatement).`
          : `Compte ${account.email} réactivé.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (account: AdminUser) => {
    if (account.isProtectedOwner) return;
    setBusyId(account.id);
    setError('');
    try {
      await deleteAdminUser(account);
      setNotice(`Compte ${account.email} retiré de la liste autorisée.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
          Comptes familiaux &amp; Permissions individuelles
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Seul le Fondateur ({FOUNDER_EMAIL}) gère cette liste. Même avec toutes les permissions
          éditoriales, aucun autre membre ne peut approuver ni publier un article.
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

      {/* Add Authorized Family Member */}
      <form
        onSubmit={handleAddFamilyAccount}
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
      >
        <h2 className="text-sm font-bold text-slate-950 dark:text-white">
          Ajouter un compte familial autorisé
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="adresse@gmail.com"
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom affiché"
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <input
            type="text"
            value={newRelation}
            onChange={(e) => setNewRelation(e.target.value)}
            placeholder="Fonction familiale"
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as FamilyRole)}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
          >
            <option value="co_founder">Co-fondateur</option>
            <option value="tech_director">Directeur technique</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busyId === 'new'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: effectiveSettings.primaryColor }}
        >
          <Plus className="w-4 h-4" />
          <span>Autoriser ce compte familial</span>
        </button>
      </form>

      {/* Family Accounts & Granular Permissions Matrix */}
      <div className="space-y-5">
        {adminUsers.map((account) => {
          const isOwner = account.isProtectedOwner || account.email === FOUNDER_EMAIL;
          return (
            <div
              key={account.id}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-950 dark:text-white">
                      {account.displayName}
                    </h3>
                    {isOwner && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold"
                        style={{ color: effectiveSettings.primaryColor }}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Propriétaire protégé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{account.email}</span> ·{' '}
                    {ROLE_LABELS[account.role].fr} · {account.familyRelation}
                  </p>
                </div>

                {!isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === account.id}
                      onClick={() => void handleToggleActive(account)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        account.isActive
                          ? 'border-amber-300 text-amber-800 dark:text-amber-300'
                          : 'border-emerald-300 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {account.isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>Désactiver</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Réactiver</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === account.id}
                      onClick={() => void handleDelete(account)}
                      aria-label={`Supprimer ${account.email}`}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 14 Granular Permissions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_PERMISSION_KEYS.map((permKey) => {
                  const locked = isOwner || permKey === 'manage_users';
                  const checked = isOwner ? true : account.permissions[permKey];
                  return (
                    <label
                      key={permKey}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs transition-colors ${
                        locked
                          ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked || busyId === account.id}
                        onChange={() => void handleTogglePermission(account, permKey)}
                        className="mt-0.5 w-4 h-4 rounded shrink-0"
                      />
                      <span className="space-y-0.5">
                        <span className="block font-semibold text-slate-900 dark:text-slate-100">
                          {PERMISSION_LABELS[permKey].fr}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {PERMISSION_LABELS[permKey].descriptionFr}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {!isOwner && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Restriction absolue Firebase : ce compte ne peut ni approuver ni publier un
                  article directement, même si toutes les permissions de rédaction sont cochées.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
