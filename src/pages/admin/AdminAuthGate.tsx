import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../../components/BrandLogo';
import { FOUNDER_EMAIL } from '../../utils/permissions';

export const AdminAuthGate: React.FC = () => {
  const {
    user,
    authReady,
    isFamilyMember,
    effectiveSettings,
    signInWithGoogle,
    signInWithEmail,
    resetPassword,
    logout,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'reset' | 'recovery'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim() || !password) {
      setError('Veuillez saisir votre adresse e-mail et votre mot de passe.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setError(
          'La connexion E-mail/Mot de passe doit être activée dans Firebase Console (Authentication → Sign-in method → Email/Password). Vous pouvez utiliser "Connexion avec Google" immédiatement.'
        );
      } else {
        setError('Identifiants invalides ou compte non activé. Vérifiez votre e-mail et mot de passe.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse e-mail familiale.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email);
      setNotice(
        'Un lien sécurisé de réinitialisation du mot de passe vient d’être envoyé par Firebase à cette adresse e-mail.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’envoyer le lien de réinitialisation.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion Google interrompue.');
    } finally {
      setBusy(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090E1A]">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Vérification de session sécurisée…
        </p>
      </div>
    );
  }

  // Signed in, but NOT an authorized family member (e.g., external journalist or unverified email)
  if (user && !isFamilyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090E1A] p-6">
        <div className="max-w-lg w-full bg-white dark:bg-[#111827] border border-red-200 dark:border-red-900/70 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-7 h-7 shrink-0" />
            <h1 className="font-editorial text-2xl font-bold">Accès strictement refusé</h1>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Le compte <strong>{user.email}</strong>{' '}
            {!user.emailVerified
              ? 'n’a pas encore validé son adresse e-mail.'
              : 'ne figure pas sur la liste familiale autorisée pour le panneau /admin.'}
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-900 dark:text-white">
              Sécurité appliquée par Firebase Rules :
            </p>
            <p>
              Le panneau d’administration est strictement privé et réservé à la famille fondatrice.
              Les journalistes externes ne disposent d’aucun accès à /admin et doivent passer par le
              portail de soumission sécurisé.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/fr/soumettre"
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: effectiveSettings.primaryColor }}
            >
              Portail journalistes
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Changer de compte
            </button>
            <Link
              to="/fr"
              className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white ms-auto"
            >
              Site public
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090E1A] flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/fr" aria-label="Retour au site public">
            <BrandLogo />
          </Link>
          <Link
            to="/fr"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Site public</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-7 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5" style={{ color: effectiveSettings.primaryColor }} />
              <span>Espace Administration Privé — Famille Fondatrice</span>
            </div>
            <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
              {mode === 'login'
                ? 'Connexion Direction & Rédaction'
                : mode === 'reset'
                  ? 'Réinitialisation du mot de passe'
                  : 'Récupération du compte Fondateur'}
            </h1>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 leading-relaxed"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {mode === 'login' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Connexion avec Google (Famille)</span>
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="shrink mx-3 text-xs text-slate-400">ou par e-mail</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <form onSubmit={handleEmailSignIn} noValidate className="space-y-4">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Adresse e-mail autorisée
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Mot de passe
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {busy ? 'Connexion…' : 'Se connecter par e-mail'}
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setNotice('');
                    setMode('reset');
                  }}
                  className="font-semibold hover:underline"
                  style={{ color: effectiveSettings.primaryColor }}
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setNotice('');
                    setMode('recovery');
                  }}
                  className="font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Procédure récupération Fondateur
                </button>
              </div>
            </>
          )}

          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Saisissez votre adresse e-mail familiale pour recevoir un lien Firebase de
                réinitialisation de mot de passe.
              </p>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Adresse e-mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={FOUNDER_EMAIL}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                <Mail className="w-4 h-4" />
                <span>Envoyer le lien de réinitialisation</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Retour à la connexion
              </button>
            </form>
          )}

          {mode === 'recovery' && (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-950 dark:text-white">
                  <KeyRound className="w-4 h-4" style={{ color: effectiveSettings.accentColor }} />
                  <span>Protocole sécurisé — Compte Fondateur ({FOUNDER_EMAIL})</span>
                </div>
                <ol className="list-decimal ps-4 space-y-1.5">
                  <li>
                    <strong>Protection propriétaire :</strong> Aucun autre administrateur ne peut
                    supprimer, désactiver ou rétrograder le compte Fondateur (verrouillé dans les
                    règles serveur Firebase).
                  </li>
                  <li>
                    <strong>Récupération mot de passe :</strong> Envoyez un lien Firebase officiel
                    exclusivement vers <code>{FOUNDER_EMAIL}</code>.
                  </li>
                  <li>
                    <strong>Connexion Google 2FA :</strong> En cas de perte du mot de passe local,
                    reconnectez-vous via Google Sign-In avec <code>{FOUNDER_EMAIL}</code> (protégé
                    par la double authentification Google).
                  </li>
                  <li>
                    <strong>Recours ultime console Firebase :</strong> Le propriétaire du projet
                    Firebase peut réinitialiser le compte dans Firebase Console → Authentication
                    sans modifier les règles ni exposer d’accès public.
                  </li>
                </ol>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(FOUNDER_EMAIL);
                  setMode('reset');
                }}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: effectiveSettings.accentColor }}
              >
                Envoyer une réinitialisation vers {FOUNDER_EMAIL}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Retour à la connexion
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Accès strictement contrôlé par Firebase Authentication &amp; Firestore Security Rules.
          Seuls les comptes familiaux autorisés peuvent accéder à ce panneau.
        </p>
      </div>
    </div>
  );
};
