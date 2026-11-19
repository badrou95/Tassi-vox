import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Moon,
  Palette,
  Radio,
  ScrollText,
  ShieldCheck,
  Sun,
  Users,
  UserSquare2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/i18n';
import { BrandLogo } from '../../components/BrandLogo';
import { AdminAuthGate } from './AdminAuthGate';
import { AdminArticlesTab } from './AdminArticlesTab';
import { AdminBreakingNewsTab } from './AdminBreakingNewsTab';
import { AdminCustomizationTab } from './AdminCustomizationTab';
import { AdminJournalistsTab } from './AdminJournalistsTab';
import { AdminSubmissionsTab } from './AdminSubmissionsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminAuditLogsTab } from './AdminAuditLogsTab';

type AdminTab =
  | 'overview'
  | 'articles'
  | 'submissions'
  | 'breaking'
  | 'customization'
  | 'journalists'
  | 'users'
  | 'audit';

export const AdminDashboardPage: React.FC = () => {
  const {
    user,
    authReady,
    isFamilyMember,
    isFounder,
    currentRole,
    currentPermissions,
    theme,
    toggleTheme,
    logout,
    effectiveSettings,
    articles,
    breakingNews,
    journalists,
    submissions,
    auditLogs,
    isFirestoreSeeded,
    seedInitialDatabase,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  if (!authReady || !user || !isFamilyMember) {
    return <AdminAuthGate />;
  }

  const pendingCount = articles.filter((a) => a.status === 'pending_review').length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const activeBreakingCount = breakingNews.filter((b) => b.status === 'active').length;
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'received').length;

  const allNavItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
    badge?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      visible: currentPermissions.view_dashboard || isFounder,
    },
    {
      id: 'articles',
      label: 'Articles & Validation',
      icon: FileText,
      visible: currentPermissions.view_articles || currentPermissions.create_articles || isFounder,
      badge: pendingCount,
    },
    {
      id: 'submissions',
      label: 'Propositions externes',
      icon: Inbox,
      visible: currentPermissions.create_articles || currentPermissions.view_articles || isFounder,
      badge: pendingSubmissionsCount,
    },
    {
      id: 'breaking',
      label: 'Dernière Minute',
      icon: Radio,
      visible: currentPermissions.manage_breaking_news || isFounder,
    },
    {
      id: 'customization',
      label: 'Personnalisation du site',
      icon: Palette,
      visible: currentPermissions.manage_site_settings || currentPermissions.manage_categories || isFounder,
    },
    {
      id: 'journalists',
      label: 'Équipe rédactionnelle',
      icon: UserSquare2,
      visible: currentPermissions.manage_journalists || isFounder,
    },
    {
      id: 'users',
      label: 'Comptes & Permissions',
      icon: Users,
      visible: isFounder,
    },
    {
      id: 'audit',
      label: 'Journal d’audit',
      icon: ScrollText,
      visible: isFounder || currentPermissions.view_stats,
    },
  ];
  const navItems = allNavItems.filter((item) => item.visible);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMessage('');
    try {
      await seedInitialDatabase();
      setSeedMessage(
        'Base Firebase initialisée avec succès (comptes familiaux, paramètres TASSI-VOX, articles bilingues, équipe rédactionnelle et dernières minutes).'
      );
    } catch (err) {
      setSeedMessage(err instanceof Error ? err.message : 'Erreur d’initialisation.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#090E1A] text-slate-900 dark:text-slate-100">
      {/* Left Admin Sidebar (264px on desktop) */}
      <aside className="lg:w-[264px] shrink-0 bg-white dark:bg-[#0B1220] border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <Link to="/fr">
              <BrandLogo />
            </Link>
          </div>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white">
              <ShieldCheck
                className="w-4 h-4 shrink-0"
                style={{ color: effectiveSettings.primaryColor }}
              />
              <span className="truncate">
                {currentRole ? ROLE_LABELS[currentRole].fr : 'Membre familial'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>

          <nav className="p-3 space-y-1" aria-label="Navigation administration">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    active
                      ? 'text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                  style={active ? { backgroundColor: effectiveSettings.primaryColor } : undefined}
                >
                  <span className="inline-flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                        active ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Link
            to="/fr"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Voir le site public</span>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion sécurisée</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Breadcrumb Bar */}
        <header className="h-16 px-6 bg-white dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
            <span>{effectiveSettings.mediaName}</span>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-slate-950 dark:text-white">Administration Privée</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          {/* Founder 1-Click Initial Firebase Database Bootstrap */}
          {isFounder && !isFirestoreSeeded && (
            <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-sm">
                <p className="font-bold text-slate-950 dark:text-white">
                  Initialiser les collections Firebase Firestore
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Enregistrez en un clic les 4 comptes familiaux autorisés, la charte graphique,
                  l’équipe rédactionnelle, les articles bilingues et le bandeau Dernière Minute dans
                  votre base Firestore.
                </p>
              </div>
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeed}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: effectiveSettings.primaryColor }}
              >
                <Database className="w-4 h-4" />
                <span>{seeding ? 'Initialisation…' : 'Initialiser Firebase'}</span>
              </button>
            </div>
          )}

          {seedMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm text-emerald-800 dark:text-emerald-300">
              {seedMessage}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
                  Tableau de bord rédactionnel
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Pilotage en temps réel du média bilingue {effectiveSettings.mediaName}.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Articles publiés
                  </span>
                  <p className="text-3xl font-bold font-tabular text-slate-950 dark:text-white">
                    {publishedCount}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    En attente Fondateur
                  </span>
                  <p
                    className="text-3xl font-bold font-tabular"
                    style={{ color: effectiveSettings.accentColor }}
                  >
                    {pendingCount}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Alertes Dernière Minute
                  </span>
                  <p
                    className="text-3xl font-bold font-tabular"
                    style={{ color: effectiveSettings.breakingColor }}
                  >
                    {activeBreakingCount}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Journalistes publics
                  </span>
                  <p className="text-3xl font-bold font-tabular text-slate-950 dark:text-white">
                    {journalists.length}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
                  <h2 className="font-bold text-base text-slate-950 dark:text-white">
                    Gouvernance familiale active
                  </h2>
                  <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <li>
                      • <strong>Fondateur :</strong> <code>tmerzak@gmail.com</code> — Validation
                      définitive, publication &amp; gestion exclusive des accès.
                    </li>
                    <li>
                      • <strong>Directeur technique :</strong> <code>badroumc@gmail.com</code> —
                      Maintenance, personnalisation et gestion technique selon permissions.
                    </li>
                    <li>
                      • <strong>Co-fondateurs :</strong> <code>tigrine156@gmail.com</code> &amp;{' '}
                      <code>tigrinemelissalyna@gmail.com</code> — Rédaction et édition selon
                      permissions attribuées.
                    </li>
                    <li>
                      • <strong>Journalistes externes :</strong> Profils publics &amp; portail de
                      soumission sécurisé uniquement, zéro accès /admin.
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
                  <h2 className="font-bold text-base text-slate-950 dark:text-white">
                    Activité récente ({auditLogs.length})
                  </h2>
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Les actions sensibles (approbations, publications, modifications de
                      permissions et personnalisations) s’afficheront ici en temps réel.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {auditLogs.slice(0, 5).map((log) => (
                        <li key={log.id} className="py-2.5 space-y-0.5">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {log.action}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400">{log.details}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'articles' && <AdminArticlesTab />}
          {activeTab === 'submissions' && <AdminSubmissionsTab />}
          {activeTab === 'breaking' && <AdminBreakingNewsTab />}
          {activeTab === 'customization' && <AdminCustomizationTab />}
          {activeTab === 'journalists' && <AdminJournalistsTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'audit' && <AdminAuditLogsTab />}
        </main>
      </div>
    </div>
  );
};
