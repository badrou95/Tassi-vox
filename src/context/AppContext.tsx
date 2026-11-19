import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  deleteStorageFileByUrl,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase';
import {
  DEFAULT_ADMIN_USERS,
  DEFAULT_ARTICLES,
  DEFAULT_BREAKING_NEWS,
  DEFAULT_JOURNALISTS,
  DEFAULT_SITE_SETTINGS,
} from '../data/seedData';
import type {
  AdminUser,
  Article,
  ArticleStatus,
  AuditLog,
  BreakingNewsItem,
  FamilyRole,
  Journalist,
  JournalistAccount,
  JournalistAccountStatus,
  Language,
  PermissionsMap,
  SiteSettings,
  Submission,
} from '../types';
import {
  MAX_SUBMISSION_IMAGE_BYTES,
  canApproveOrPublish,
  canModifyAdminAccount,
  canUserPerform,
  emailToDocId,
  extractVerifiedIdentity,
  isAuthorizedFamilyAdmin,
  isFounderEmail,
  normalizeEmail,
  resolveEffectivePermissions,
  resolveEffectiveRole,
  validateArticleTransition,
} from '../utils/permissions';

interface AppContextValue {
  // Theme & Language
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // Auth & Family RBAC
  user: User | null;
  userEmail: string;
  emailVerified: boolean;
  jwtEmailMissing: boolean;
  authReady: boolean;
  isFamilyMember: boolean;
  isFounder: boolean;
  currentRole: FamilyRole | null;
  currentPermissions: PermissionsMap;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;

  // Data (Live Firestore merged cleanly with starter catalog if unseeded)
  siteSettings: SiteSettings;
  previewSettings: SiteSettings | null;
  setPreviewSettings: (settings: SiteSettings | null) => void;
  effectiveSettings: SiteSettings;
  articles: Article[];
  publishedArticles: Article[];
  breakingNews: BreakingNewsItem[];
  activeBreakingNews: BreakingNewsItem[];
  journalists: Journalist[];
  visibleJournalists: Journalist[];
  journalistAccounts: JournalistAccount[];
  myJournalistAccount: JournalistAccount | null;
  submissions: Submission[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
  isFirestoreSeeded: boolean;

  // Mutations (All write to Firestore + Audit Log)
  seedInitialDatabase: () => Promise<void>;
  saveSiteSettings: (next: SiteSettings) => Promise<void>;
  saveBreakingNews: (item: BreakingNewsItem, isNew: boolean) => Promise<void>;
  deleteBreakingNews: (id: string) => Promise<void>;
  saveArticle: (article: Article, isNew: boolean) => Promise<void>;
  transitionArticleStatus: (
    article: Article,
    nextStatus: ArticleStatus,
    reviewNotes?: string
  ) => Promise<void>;
  deleteArticle: (article: Article) => Promise<void>;
  purgeArchivedArticles: () => Promise<number>;
  saveJournalist: (journalist: Journalist, isNew: boolean) => Promise<void>;
  updateOwnJournalistProfile: (
    journalist: Journalist,
    patch: Pick<
      Journalist,
      | 'fullNameFr'
      | 'fullNameAr'
      | 'roleFr'
      | 'roleAr'
      | 'bioFr'
      | 'bioAr'
      | 'careerFr'
      | 'careerAr'
      | 'coverageAreasFr'
      | 'coverageAreasAr'
      | 'photoUrl'
      | 'socials'
    >
  ) => Promise<void>;
  deleteJournalist: (id: string) => Promise<void>;
  requestJournalistAccount: (payload: {
    fullName: string;
    specialty: string;
    phoneOrContact: string;
    bio: string;
    portfolioUrl: string;
  }) => Promise<void>;
  reviewJournalistAccount: (
    account: JournalistAccount,
    status: JournalistAccountStatus,
    reviewNotes?: string,
    alsoCreatePublicProfile?: boolean
  ) => Promise<void>;
  deleteJournalistAccount: (account: JournalistAccount) => Promise<void>;
  createSubmission: (
    payload: Omit<Submission, 'id' | 'authorUid' | 'authorEmail' | 'status' | 'linkedArticleId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateSubmissionStatus: (
    submission: Submission,
    status: Submission['status'],
    linkedArticleId?: string
  ) => Promise<void>;
  saveAdminUser: (account: AdminUser, isNew: boolean) => Promise<void>;
  deleteAdminUser: (account: AdminUser) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function clampString(val: string | undefined, max: number): string {
  return (val || '').trim().slice(0, max);
}

function sanitizeSocials(socials: SiteSettings['socials'] | undefined): SiteSettings['socials'] {
  const out: SiteSettings['socials'] = {};
  const allowed: (keyof SiteSettings['socials'])[] = [
    'x',
    'facebook',
    'instagram',
    'youtube',
    'linkedin',
    'website',
  ];
  for (const key of allowed) {
    const val = socials?.[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      out[key] = val.trim().slice(0, 300);
    }
  }
  return out;
}

function sanitizeHexColor(val: string | undefined, fallback: string): string {
  const cleaned = (val || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned : fallback;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('tassivox-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'fr';
    const stored = window.localStorage.getItem('tassivox-lang');
    return stored === 'ar' ? 'ar' : 'fr';
  });

  const [user, setUser] = useState<User | null>(null);
  const [jwtEmailMissing, setJwtEmailMissing] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [firestoreSettings, setFirestoreSettings] = useState<SiteSettings | null>(null);
  const [previewSettings, setPreviewSettings] = useState<SiteSettings | null>(null);
  const [firestoreArticles, setFirestoreArticles] = useState<Article[] | null>(null);
  const [firestoreBreaking, setFirestoreBreaking] = useState<BreakingNewsItem[] | null>(null);
  const [firestoreJournalists, setFirestoreJournalists] = useState<Journalist[] | null>(null);
  const [firestoreJournalistAccounts, setFirestoreJournalistAccounts] = useState<JournalistAccount[]>([]);
  const [myJournalistAccount, setMyJournalistAccount] = useState<JournalistAccount | null>(null);
  const [firestoreSubmissions, setFirestoreSubmissions] = useState<Submission[]>([]);
  const [firestoreAdminUsers, setFirestoreAdminUsers] = useState<AdminUser[]>([]);
  const [firestoreAuditLogs, setFirestoreAuditLogs] = useState<AuditLog[]>([]);

  // Validate Firestore connection on startup
  useEffect(() => {
    void testConnection();
  }, []);

  // Theme class sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('tassivox-theme', theme);
  }, [theme]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem('tassivox-lang', lang);
  }, []);

  // Language & RTL direction sync
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Auth listener + JWT email claim verification
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setJwtEmailMissing(false);
        return;
      }
      void firebaseUser
        .getIdTokenResult()
        .then((res) => {
          const claims = res.claims as {
            email?: unknown;
            email_verified?: unknown;
            firebase?: {
              sign_in_provider?: unknown;
              identities?: { email?: unknown };
            };
          };
          const hasDirect =
            typeof claims.email === 'string' &&
            claims.email.length > 0 &&
            claims.email_verified === true;
          const hasGoogleId =
            claims.firebase?.sign_in_provider === 'google.com' &&
            Array.isArray(claims.firebase?.identities?.email) &&
            claims.firebase.identities.email.length > 0;
          setJwtEmailMissing(!(hasDirect || hasGoogleId));
        })
        .catch(() => {
          setJwtEmailMissing(false);
        });
    });
    return () => unsub();
  }, []);

  const adminUsers = useMemo(() => {
    if (firestoreAdminUsers.length > 0) return firestoreAdminUsers;
    return DEFAULT_ADMIN_USERS;
  }, [firestoreAdminUsers]);

  const resolvedIdentity = useMemo(() => extractVerifiedIdentity(user), [user]);
  const userEmail = resolvedIdentity.email;
  const emailVerified = resolvedIdentity.emailVerified;

  const isFounder = useMemo(
    () => canApproveOrPublish(userEmail, emailVerified),
    [userEmail, emailVerified]
  );

  const isFamilyMember = useMemo(
    () => isAuthorizedFamilyAdmin(userEmail, emailVerified, adminUsers),
    [userEmail, emailVerified, adminUsers]
  );

  const currentRole = useMemo(
    () => (isFamilyMember ? resolveEffectiveRole(userEmail, adminUsers) : null),
    [isFamilyMember, userEmail, adminUsers]
  );

  const currentPermissions = useMemo(
    () => resolveEffectivePermissions(userEmail, emailVerified, adminUsers),
    [userEmail, emailVerified, adminUsers]
  );

  // Public Firestore listeners (siteSettings, active breakingNews, published articles, visible journalists)
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'siteSettings', 'main'),
      (snap) => {
        if (snap.exists()) {
          setFirestoreSettings(snap.data() as SiteSettings);
        } else {
          setFirestoreSettings(null);
        }
      },
      (err) => {
        console.warn('siteSettings listener fallback:', err.message);
      }
    );

    const breakingQuery = isFamilyMember
      ? collection(db, 'breakingNews')
      : query(collection(db, 'breakingNews'), where('status', '==', 'active'));

    const unsubBreaking = onSnapshot(
      breakingQuery,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<BreakingNewsItem, 'id'>) }))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setFirestoreBreaking(list);
      },
      (err) => {
        console.warn('breakingNews listener fallback:', err.message);
      }
    );

    const canViewAllArticles = isFamilyMember && currentPermissions.view_articles;
    const articlesQuery = canViewAllArticles
      ? collection(db, 'articles')
      : query(collection(db, 'articles'), where('status', '==', 'published'));

    const unsubArticles = onSnapshot(
      articlesQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }));
        setFirestoreArticles(list);
      },
      (err) => {
        console.warn('articles listener fallback:', err.message);
      }
    );

    const journalistsQuery = isFamilyMember
      ? collection(db, 'journalists')
      : query(collection(db, 'journalists'), where('isVisible', '==', true));

    const unsubJournalists = onSnapshot(
      journalistsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Journalist, 'id'>) }));
        setFirestoreJournalists(list);
      },
      (err) => {
        console.warn('journalists listener fallback:', err.message);
      }
    );

    return () => {
      unsubSettings();
      unsubBreaking();
      unsubArticles();
      unsubJournalists();
    };
  }, [isFamilyMember, currentPermissions.view_articles]);

  // Private adminUsers listener (Founder gets all; non-founder family member gets only their own doc)
  useEffect(() => {
    if (!authReady || !user || !emailVerified) {
      setFirestoreAdminUsers([]);
      return;
    }

    if (isFounder) {
      const unsub = onSnapshot(
        collection(db, 'adminUsers'),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminUser, 'id'>) }));
          setFirestoreAdminUsers(list);
        },
        (err) => {
          console.warn('adminUsers list error:', err.message);
        }
      );
      return () => unsub();
    }

    // Non-founder signed-in user: check only their own email doc (strict PII isolation)
    const ownId = emailToDocId(userEmail);
    const unsubOwn = onSnapshot(
      doc(db, 'adminUsers', ownId),
      (snap) => {
        if (snap.exists()) {
          setFirestoreAdminUsers([
            { id: snap.id, ...(snap.data() as Omit<AdminUser, 'id'>) },
          ]);
        } else {
          setFirestoreAdminUsers([]);
        }
      },
      () => {
        setFirestoreAdminUsers([]);
      }
    );
    return () => unsubOwn();
  }, [authReady, user, emailVerified, isFounder, userEmail]);

  // Submissions & Audit Logs listeners (strictly scoped by identity)
  useEffect(() => {
    if (!authReady || !user || !emailVerified) {
      setFirestoreSubmissions([]);
      setFirestoreAuditLogs([]);
      return;
    }

    const subQuery = isFamilyMember
      ? collection(db, 'submissions')
      : query(collection(db, 'submissions'), where('authorUid', '==', user.uid));

    const unsubSubs = onSnapshot(
      subQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) }));
        setFirestoreSubmissions(list);
      },
      (err) => {
        console.warn('submissions listener error:', err.message);
      }
    );

    let unsubLogs: (() => void) | undefined;
    let unsubAccounts: (() => void) | undefined;

    if (isFamilyMember) {
      unsubLogs = onSnapshot(
        collection(db, 'auditLogs'),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) }));
          list.sort((a, b) => {
            const ta =
              a.createdAt && typeof (a.createdAt as { toMillis?: () => number }).toMillis === 'function'
                ? (a.createdAt as { toMillis: () => number }).toMillis()
                : 0;
            const tb =
              b.createdAt && typeof (b.createdAt as { toMillis?: () => number }).toMillis === 'function'
                ? (b.createdAt as { toMillis: () => number }).toMillis()
                : 0;
            return tb - ta;
          });
          setFirestoreAuditLogs(list);
        },
        (err) => {
          console.warn('auditLogs listener error:', err.message);
        }
      );

      unsubAccounts = onSnapshot(
        collection(db, 'journalistAccounts'),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JournalistAccount, 'id'>),
          }));
          list.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return a.fullName.localeCompare(b.fullName);
          });
          setFirestoreJournalistAccounts(list);
          setMyJournalistAccount(list.find((acc) => acc.uid === user.uid) || null);
        },
        (err) => {
          console.warn('journalistAccounts list error:', err.message);
        }
      );
    } else {
      setFirestoreAuditLogs([]);
      setFirestoreJournalistAccounts([]);
      unsubAccounts = onSnapshot(
        doc(db, 'journalistAccounts', user.uid),
        (snap) => {
          if (snap.exists()) {
            setMyJournalistAccount({
              id: snap.id,
              ...(snap.data() as Omit<JournalistAccount, 'id'>),
            });
          } else {
            setMyJournalistAccount(null);
          }
        },
        () => {
          setMyJournalistAccount(null);
        }
      );
    }

    return () => {
      unsubSubs();
      if (unsubLogs) unsubLogs();
      if (unsubAccounts) unsubAccounts();
    };
  }, [authReady, user, emailVerified, isFamilyMember]);

  const siteSettings = firestoreSettings || DEFAULT_SITE_SETTINGS;
  const effectiveSettings = previewSettings || siteSettings;

  // Sync live custom CSS variables from effectiveSettings
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tv-primary', effectiveSettings.primaryColor);
    root.style.setProperty('--tv-secondary', effectiveSettings.secondaryColor);
    root.style.setProperty('--tv-accent', effectiveSettings.accentColor);
    root.style.setProperty('--tv-breaking', effectiveSettings.breakingColor);
  }, [effectiveSettings]);

  const isFirestoreSeeded = Boolean(
    firestoreSettings ||
      (firestoreArticles && firestoreArticles.length > 0) ||
      (firestoreJournalists && firestoreJournalists.length > 0) ||
      (firestoreBreaking && firestoreBreaking.length > 0) ||
      firestoreAdminUsers.length > 0
  );

  const articles =
    firestoreArticles && (firestoreArticles.length > 0 || firestoreSettings)
      ? firestoreArticles
      : DEFAULT_ARTICLES;
  const publishedArticles = useMemo(
    () =>
      articles
        .filter((a) => a.status === 'published')
        .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '')),
    [articles]
  );

  const breakingNews =
    firestoreBreaking && (firestoreBreaking.length > 0 || firestoreSettings)
      ? firestoreBreaking
      : DEFAULT_BREAKING_NEWS;
  const activeBreakingNews = useMemo(
    () =>
      breakingNews
        .filter((b) => b.status === 'active')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [breakingNews]
  );

  const journalists =
    firestoreJournalists && (firestoreJournalists.length > 0 || firestoreSettings)
      ? firestoreJournalists
      : DEFAULT_JOURNALISTS;
  const visibleJournalists = useMemo(
    () => journalists.filter((j) => j.isVisible),
    [journalists]
  );

  // Helper: Append immutable audit log
  const writeAuditLog = useCallback(
    async (action: string, targetCollection: string, targetId: string, details: string) => {
      if (!user || !currentRole || !emailVerified) return;
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const path = `auditLogs/${logId}`;
      try {
        await setDoc(doc(db, 'auditLogs', logId), {
          action: clampString(action, 80),
          targetCollection: clampString(targetCollection, 64),
          targetId: clampString(targetId, 128),
          details: clampString(details, 600),
          actorUid: user.uid,
          actorEmail: userEmail,
          actorRole: currentRole,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, currentRole, emailVerified, userEmail]
  );

  // Auth actions
  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await sendEmailVerification(cred.user);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logout = useCallback(async () => {
    setPreviewSettings(null);
    await signOut(auth);
  }, []);

  // Founder 1-click initial Firestore seed
  const seedInitialDatabase = useCallback(async () => {
    if (!user || !isFounder) {
      throw new Error('Seul le fondateur (tmerzak@gmail.com) peut initialiser la base Firebase.');
    }
    const batch = writeBatch(db);

    batch.set(doc(db, 'siteSettings', 'main'), {
      ...DEFAULT_SITE_SETTINGS,
      socials: sanitizeSocials(DEFAULT_SITE_SETTINGS.socials),
      updatedByEmail: userEmail,
      updatedAt: serverTimestamp(),
    });

    for (const admin of DEFAULT_ADMIN_USERS) {
      batch.set(doc(db, 'adminUsers', admin.id), {
        email: admin.email,
        displayName: admin.displayName,
        familyRelation: admin.familyRelation,
        role: admin.role,
        isActive: admin.isActive,
        isProtectedOwner: admin.isProtectedOwner,
        permissions: admin.permissions,
        updatedByEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const j of DEFAULT_JOURNALISTS) {
      batch.set(doc(db, 'journalists', j.id), {
        fullNameFr: j.fullNameFr,
        fullNameAr: j.fullNameAr,
        roleFr: j.roleFr,
        roleAr: j.roleAr,
        bioFr: j.bioFr,
        bioAr: j.bioAr,
        careerFr: j.careerFr,
        careerAr: j.careerAr,
        coverageAreasFr: j.coverageAreasFr,
        coverageAreasAr: j.coverageAreasAr,
        photoUrl: j.photoUrl,
        socials: sanitizeSocials(j.socials),
        ownerUid: j.ownerUid,
        isVisible: j.isVisible,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const b of DEFAULT_BREAKING_NEWS) {
      batch.set(doc(db, 'breakingNews', b.id), {
        textFr: b.textFr,
        textAr: b.textAr,
        articleSlug: b.articleSlug,
        status: b.status,
        sortOrder: b.sortOrder,
        durationSeconds: b.durationSeconds,
        expiresAt: b.expiresAt,
        createdByUid: user.uid,
        createdByEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const a of DEFAULT_ARTICLES) {
      batch.set(doc(db, 'articles', a.id), {
        slug: a.slug,
        categoryId: a.categoryId,
        authorId: a.authorId,
        status: a.status,
        isFeatured: a.isFeatured,
        fr: a.fr,
        ar: a.ar,
        reviewNotes: a.reviewNotes,
        createdByUid: user.uid,
        createdByEmail: userEmail,
        approvedByEmail: a.status === 'published' ? userEmail : '',
        approvedAt: a.approvedAt,
        publishedAt: a.publishedAt,
        viewsCount: a.viewsCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      await writeAuditLog(
        'SEED_DATABASE',
        'siteSettings',
        'main',
        'Initialisation complète de la base Firebase TASSI-VOX (comptes familiaux, paramètres, articles, journalistes, dernières minutes).'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-seed');
    }
  }, [user, isFounder, userEmail, writeAuditLog]);

  // Save SiteSettings
  const saveSiteSettings = useCallback(
    async (next: SiteSettings) => {
      if (!user || !canUserPerform(userEmail, emailVerified, 'manage_site_settings', adminUsers)) {
        throw new Error('Permission "Modifier les paramètres du site" requise.');
      }
      const payload = {
        mediaName: clampString(next.mediaName, 80) || 'TASSI-VOX',
        logoUrl: clampString(next.logoUrl, 500),
        sloganFr: clampString(next.sloganFr, 200),
        sloganAr: clampString(next.sloganAr, 200),
        descriptionFr: clampString(next.descriptionFr, 600),
        descriptionAr: clampString(next.descriptionAr, 600),
        primaryColor: sanitizeHexColor(next.primaryColor, DEFAULT_SITE_SETTINGS.primaryColor),
        secondaryColor: sanitizeHexColor(next.secondaryColor, DEFAULT_SITE_SETTINGS.secondaryColor),
        accentColor: sanitizeHexColor(next.accentColor, DEFAULT_SITE_SETTINGS.accentColor),
        breakingColor: sanitizeHexColor(next.breakingColor, DEFAULT_SITE_SETTINGS.breakingColor),
        breakingBannerEnabled: Boolean(next.breakingBannerEnabled),
        heroTitleFr: clampString(next.heroTitleFr, 160),
        heroTitleAr: clampString(next.heroTitleAr, 160),
        heroSubtitleFr: clampString(next.heroSubtitleFr, 360),
        heroSubtitleAr: clampString(next.heroSubtitleAr, 360),
        categories: next.categories.slice(0, 20),
        navigation: next.navigation.slice(0, 10),
        contactEmail: clampString(next.contactEmail, 160),
        contactPhone: clampString(next.contactPhone, 60),
        contactAddressFr: clampString(next.contactAddressFr, 240),
        contactAddressAr: clampString(next.contactAddressAr, 240),
        socials: sanitizeSocials(next.socials),
        footerTextFr: clampString(next.footerTextFr, 400),
        footerTextAr: clampString(next.footerTextAr, 400),
        legalTextFr: clampString(next.legalTextFr, 8000),
        legalTextAr: clampString(next.legalTextAr, 8000),
        updatedByEmail: userEmail,
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'siteSettings', 'main'), payload);
        setPreviewSettings(null);
        await writeAuditLog(
          'UPDATE_SITE_SETTINGS',
          'siteSettings',
          'main',
          `Mise à jour des paramètres du site (${payload.mediaName}, couleurs ${payload.primaryColor}/${payload.accentColor}).`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'siteSettings/main');
      }
    },
    [user, userEmail, emailVerified, adminUsers, writeAuditLog]
  );

  // Save Breaking News
  const saveBreakingNews = useCallback(
    async (item: BreakingNewsItem, isNew: boolean) => {
      if (!user || !canUserPerform(userEmail, emailVerified, 'manage_breaking_news', adminUsers)) {
        throw new Error('Permission "Gérer le bandeau Dernière Minute" requise.');
      }
      const id = isNew ? `bn_${Date.now()}` : item.id;
      const docRef = doc(db, 'breakingNews', id);
      try {
        const existsInDb = !isNew && (await getDoc(docRef)).exists();
        if (isNew || !existsInDb) {
          await setDoc(docRef, {
            textFr: clampString(item.textFr, 260),
            textAr: clampString(item.textAr, 260),
            articleSlug: clampString(item.articleSlug, 140),
            status: item.status,
            sortOrder: Math.max(0, Math.min(9999, Number(item.sortOrder) || 0)),
            durationSeconds: Math.max(5, Math.min(180, Number(item.durationSeconds) || 30)),
            expiresAt: clampString(item.expiresAt, 64),
            createdByUid: user.uid,
            createdByEmail: userEmail,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(docRef, {
            textFr: clampString(item.textFr, 260),
            textAr: clampString(item.textAr, 260),
            articleSlug: clampString(item.articleSlug, 140),
            status: item.status,
            sortOrder: Math.max(0, Math.min(9999, Number(item.sortOrder) || 0)),
            durationSeconds: Math.max(5, Math.min(180, Number(item.durationSeconds) || 30)),
            expiresAt: clampString(item.expiresAt, 64),
            updatedAt: serverTimestamp(),
          });
        }
        await writeAuditLog(
          isNew ? 'CREATE_BREAKING_NEWS' : 'UPDATE_BREAKING_NEWS',
          'breakingNews',
          id,
          `Alerte Dernière Minute (${item.status}) : ${clampString(item.textFr, 120)}`
        );
      } catch (err) {
        handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, `breakingNews/${id}`);
      }
    },
    [user, userEmail, emailVerified, adminUsers, writeAuditLog]
  );

  const deleteBreakingNews = useCallback(
    async (id: string) => {
      if (!user || !canUserPerform(userEmail, emailVerified, 'manage_breaking_news', adminUsers)) {
        throw new Error('Permission requise pour supprimer une alerte.');
      }
      try {
        const hasLiveItems = Boolean(firestoreBreaking && firestoreBreaking.length > 0);
        if (!hasLiveItems) {
          const batch = writeBatch(db);
          const remaining = DEFAULT_BREAKING_NEWS.filter((b) => b.id !== id);
          for (const b of remaining) {
            batch.set(doc(db, 'breakingNews', b.id), {
              textFr: b.textFr,
              textAr: b.textAr,
              articleSlug: b.articleSlug,
              status: b.status,
              sortOrder: b.sortOrder,
              durationSeconds: b.durationSeconds,
              expiresAt: b.expiresAt,
              createdByUid: user.uid,
              createdByEmail: userEmail,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          if (!firestoreSettings && canUserPerform(userEmail, emailVerified, 'manage_site_settings', adminUsers)) {
            batch.set(doc(db, 'siteSettings', 'main'), {
              ...DEFAULT_SITE_SETTINGS,
              socials: sanitizeSocials(DEFAULT_SITE_SETTINGS.socials),
              updatedByEmail: userEmail,
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();
        } else {
          await deleteDoc(doc(db, 'breakingNews', id));
        }
        await writeAuditLog('DELETE_BREAKING_NEWS', 'breakingNews', id, 'Suppression d’une alerte Dernière Minute.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `breakingNews/${id}`);
      }
    },
    [user, userEmail, emailVerified, adminUsers, firestoreBreaking, firestoreSettings, writeAuditLog]
  );

  // Save Article (strictly validates Founder-only publish rule)
  const saveArticle = useCallback(
    async (article: Article, isNew: boolean) => {
      if (!user) throw new Error('Authentification requise.');
      const existing = isNew ? null : articles.find((a) => a.id === article.id) || null;
      const check = validateArticleTransition({
        actorEmail: userEmail,
        emailVerified,
        existingStatus: existing ? existing.status : null,
        nextStatus: article.status,
        isArticleCreator: existing ? existing.createdByUid === user.uid : true,
        adminUsers,
      });
      if (!check.allowed) {
        throw new Error(check.reason || 'Action non autorisée.');
      }

      const id = isNew ? `art_${Date.now()}` : article.id;
      const nowIso = new Date().toISOString();
      const sanitizeLocale = (loc: Article['fr']) => ({
        title: clampString(loc.title, 220),
        subtitle: clampString(loc.subtitle, 320),
        summary: clampString(loc.summary, 700),
        content: clampString(loc.content, 40000),
        coverImageUrl: clampString(loc.coverImageUrl, 500),
        coverCaption: clampString(loc.coverCaption, 240),
        ready: Boolean(loc.ready),
      });

      const docRef = doc(db, 'articles', id);
      try {
        const existsInDb = !isNew && (await getDoc(docRef)).exists();
        if (isNew || !existsInDb) {
          const isPublishingNow = isFounder && article.status === 'published';
          const isApprovingNow = isFounder && (article.status === 'approved' || article.status === 'published');
          await setDoc(docRef, {
            slug: clampString(article.slug, 120),
            categoryId: clampString(article.categoryId, 64),
            authorId: clampString(article.authorId, 128),
            status: article.status,
            isFeatured: Boolean(article.isFeatured),
            fr: sanitizeLocale(article.fr),
            ar: sanitizeLocale(article.ar),
            reviewNotes: isFounder ? clampString(article.reviewNotes, 2000) : '',
            createdByUid: user.uid,
            createdByEmail: userEmail,
            approvedByEmail: isApprovingNow ? userEmail : '',
            approvedAt: isApprovingNow ? nowIso : '',
            publishedAt: isPublishingNow ? nowIso : '',
            viewsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (isFounder) {
          const isPublishingNow = article.status === 'published';
          const isApprovingNow = article.status === 'approved' || article.status === 'published';
          await updateDoc(docRef, {
            slug: clampString(article.slug, 120),
            categoryId: clampString(article.categoryId, 64),
            authorId: clampString(article.authorId, 128),
            status: article.status,
            isFeatured: Boolean(article.isFeatured),
            fr: sanitizeLocale(article.fr),
            ar: sanitizeLocale(article.ar),
            reviewNotes: clampString(article.reviewNotes, 2000),
            approvedByEmail: isApprovingNow ? article.approvedByEmail || userEmail : article.approvedByEmail,
            approvedAt: isApprovingNow ? article.approvedAt || nowIso : article.approvedAt,
            publishedAt: isPublishingNow ? article.publishedAt || nowIso : article.publishedAt,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Non-founder family member update (strict affectedKeys subset)
          await updateDoc(docRef, {
            slug: clampString(article.slug, 120),
            categoryId: clampString(article.categoryId, 64),
            authorId: clampString(article.authorId, 128),
            status: article.status,
            isFeatured: Boolean(article.isFeatured),
            fr: sanitizeLocale(article.fr),
            ar: sanitizeLocale(article.ar),
            updatedAt: serverTimestamp(),
          });
        }

        await writeAuditLog(
          isNew ? 'CREATE_ARTICLE' : 'UPDATE_ARTICLE',
          'articles',
          id,
          `Article "${clampString(article.fr.title || article.ar.title, 100)}" — statut : ${article.status}`
        );
      } catch (err) {
        handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, `articles/${id}`);
      }
    },
    [user, articles, userEmail, emailVerified, adminUsers, isFounder, writeAuditLog]
  );

  // Workflow transition (Founder exclusive publish/approve; authorized admins may archive or restore archived to draft)
  const transitionArticleStatus = useCallback(
    async (article: Article, nextStatus: ArticleStatus, reviewNotes = '') => {
      if (!user) throw new Error('Authentification requise.');
      const check = validateArticleTransition({
        actorEmail: userEmail,
        emailVerified,
        existingStatus: article.status,
        nextStatus,
        isArticleCreator: article.createdByUid === user.uid,
        adminUsers,
      });
      if (!check.allowed) {
        throw new Error(check.reason || 'Transition non autorisée.');
      }

      const nowIso = new Date().toISOString();
      const docRef = doc(db, 'articles', article.id);
      try {
        const existsInDb = (await getDoc(docRef)).exists();
        if (!existsInDb) {
          // Starter catalog article not yet stored in Firestore:
          // materialize starter articles so archiving/updating persists cleanly.
          const hasLiveArticles = Boolean(firestoreArticles && firestoreArticles.length > 0);
          if (!hasLiveArticles && !firestoreSettings && isFounder) {
            const batch = writeBatch(db);
            for (const a of DEFAULT_ARTICLES) {
              const effectiveStatus = a.id === article.id ? nextStatus : a.status;
              batch.set(doc(db, 'articles', a.id), {
                slug: a.slug,
                categoryId: a.categoryId,
                authorId: a.authorId,
                status: effectiveStatus,
                isFeatured: a.isFeatured,
                fr: a.fr,
                ar: a.ar,
                reviewNotes: a.id === article.id ? clampString(reviewNotes || a.reviewNotes, 2000) : a.reviewNotes,
                createdByUid: user.uid,
                createdByEmail: userEmail,
                approvedByEmail: effectiveStatus === 'published' || effectiveStatus === 'approved' ? userEmail : a.approvedByEmail,
                approvedAt: effectiveStatus === 'published' || effectiveStatus === 'approved' ? a.approvedAt || nowIso : a.approvedAt,
                publishedAt: effectiveStatus === 'published' ? a.publishedAt || nowIso : a.publishedAt,
                viewsCount: a.viewsCount,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            if (canUserPerform(userEmail, emailVerified, 'manage_site_settings', adminUsers)) {
              batch.set(doc(db, 'siteSettings', 'main'), {
                ...DEFAULT_SITE_SETTINGS,
                socials: sanitizeSocials(DEFAULT_SITE_SETTINGS.socials),
                updatedByEmail: userEmail,
                updatedAt: serverTimestamp(),
              });
            }
            await batch.commit();
          } else {
            // Non-founder archiving an unseeded starter article: create as draft first if needed, or save directly if allowed
            if (!isFounder && nextStatus === 'archived') {
              await setDoc(docRef, {
                slug: clampString(article.slug, 120),
                categoryId: clampString(article.categoryId, 64),
                authorId: clampString(article.authorId, 128),
                status: 'draft',
                isFeatured: Boolean(article.isFeatured),
                fr: article.fr,
                ar: article.ar,
                reviewNotes: '',
                createdByUid: user.uid,
                createdByEmail: userEmail,
                approvedByEmail: '',
                approvedAt: '',
                publishedAt: '',
                viewsCount: article.viewsCount || 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              await updateDoc(docRef, { status: 'archived', updatedAt: serverTimestamp() });
            } else {
              await setDoc(docRef, {
                slug: clampString(article.slug, 120),
                categoryId: clampString(article.categoryId, 64),
                authorId: clampString(article.authorId, 128),
                status: nextStatus,
                isFeatured: Boolean(article.isFeatured),
                fr: article.fr,
                ar: article.ar,
                reviewNotes: isFounder ? clampString(reviewNotes || article.reviewNotes, 2000) : '',
                createdByUid: user.uid,
                createdByEmail: userEmail,
                approvedByEmail: isFounder && (nextStatus === 'approved' || nextStatus === 'published') ? userEmail : '',
                approvedAt: isFounder && (nextStatus === 'approved' || nextStatus === 'published') ? nowIso : '',
                publishedAt: isFounder && nextStatus === 'published' ? nowIso : '',
                viewsCount: article.viewsCount || 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
        } else if (isFounder) {
          const patch: Record<string, unknown> = {
            status: nextStatus,
            reviewNotes: clampString(reviewNotes || article.reviewNotes, 2000),
            updatedAt: serverTimestamp(),
          };
          if (nextStatus === 'approved' || nextStatus === 'published') {
            patch.approvedByEmail = userEmail;
            patch.approvedAt = nowIso;
          }
          if (nextStatus === 'published') {
            patch.publishedAt = nowIso;
          }
          await updateDoc(docRef, patch);
        } else {
          await updateDoc(docRef, {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
        }

        await writeAuditLog(
          `ARTICLE_STATUS_${nextStatus.toUpperCase()}`,
          'articles',
          article.id,
          `Transition ${article.status} → ${nextStatus} pour "${clampString(article.fr.title || article.ar.title, 100)}"${reviewNotes ? ` (${clampString(reviewNotes, 150)})` : ''}`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `articles/${article.id}`);
      }
    },
    [user, userEmail, emailVerified, adminUsers, isFounder, firestoreArticles, firestoreSettings, writeAuditLog]
  );

  const deleteArticle = useCallback(
    async (article: Article) => {
      if (!user) throw new Error('Authentification requise.');
      if (!isFounder && !canUserPerform(userEmail, emailVerified, 'delete_articles', adminUsers)) {
        throw new Error('Permission "Supprimer des articles" requise.');
      }
      try {
        const hasLiveArticles = Boolean(firestoreArticles && firestoreArticles.length > 0);
        if (!hasLiveArticles && !firestoreSettings) {
          // Starter catalog not yet materialized in Firestore: persist remaining starter articles + siteSettings
          const batch = writeBatch(db);
          const remaining = DEFAULT_ARTICLES.filter((a) => a.id !== article.id);
          for (const a of remaining) {
            const safeStatus: ArticleStatus = isFounder
              ? a.status
              : a.status === 'published' || a.status === 'approved'
                ? 'pending_review'
                : a.status;
            batch.set(doc(db, 'articles', a.id), {
              slug: a.slug,
              categoryId: a.categoryId,
              authorId: a.authorId,
              status: safeStatus,
              isFeatured: a.isFeatured,
              fr: a.fr,
              ar: a.ar,
              reviewNotes: isFounder ? a.reviewNotes : '',
              createdByUid: user.uid,
              createdByEmail: userEmail,
              approvedByEmail: isFounder && safeStatus === 'published' ? userEmail : '',
              approvedAt: isFounder && safeStatus === 'published' ? a.approvedAt : '',
              publishedAt: isFounder && safeStatus === 'published' ? a.publishedAt : '',
              viewsCount: a.viewsCount,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          if (canUserPerform(userEmail, emailVerified, 'manage_site_settings', adminUsers)) {
            batch.set(doc(db, 'siteSettings', 'main'), {
              ...DEFAULT_SITE_SETTINGS,
              socials: sanitizeSocials(DEFAULT_SITE_SETTINGS.socials),
              updatedByEmail: userEmail,
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();
        } else {
          await deleteDoc(doc(db, 'articles', article.id));
          if (
            firestoreArticles &&
            firestoreArticles.length <= 1 &&
            !firestoreSettings &&
            canUserPerform(userEmail, emailVerified, 'manage_site_settings', adminUsers)
          ) {
            await setDoc(doc(db, 'siteSettings', 'main'), {
              ...DEFAULT_SITE_SETTINGS,
              socials: sanitizeSocials(DEFAULT_SITE_SETTINGS.socials),
              updatedByEmail: userEmail,
              updatedAt: serverTimestamp(),
            });
          }
        }

        // Clean up Firebase Storage cover images to genuinely free storage space
        const urlsToFree = Array.from(
          new Set([article.fr.coverImageUrl, article.ar.coverImageUrl].filter(Boolean))
        );
        await Promise.all(urlsToFree.map((u) => deleteStorageFileByUrl(u)));

        await writeAuditLog(
          'DELETE_ARTICLE',
          'articles',
          article.id,
          `Suppression définitive de l’article "${clampString(article.fr.title || article.ar.title, 100)}" (espace libéré).`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `articles/${article.id}`);
      }
    },
    [user, isFounder, userEmail, emailVerified, adminUsers, firestoreArticles, firestoreSettings, writeAuditLog]
  );

  // Bulk-purge all archived articles + their Firebase Storage images to free space
  const purgeArchivedArticles = useCallback(async (): Promise<number> => {
    if (!user) throw new Error('Authentification requise.');
    if (!isFounder && !canUserPerform(userEmail, emailVerified, 'delete_articles', adminUsers)) {
      throw new Error('Permission "Supprimer des articles" requise pour vider les archives.');
    }
    const archived = articles.filter((a) => a.status === 'archived');
    if (archived.length === 0) return 0;

    try {
      const batch = writeBatch(db);
      const urlsToFree = new Set<string>();
      for (const a of archived) {
        batch.delete(doc(db, 'articles', a.id));
        if (a.fr.coverImageUrl) urlsToFree.add(a.fr.coverImageUrl);
        if (a.ar.coverImageUrl) urlsToFree.add(a.ar.coverImageUrl);
      }
      await batch.commit();
      await Promise.all(Array.from(urlsToFree).map((u) => deleteStorageFileByUrl(u)));
      await writeAuditLog(
        'PURGE_ARCHIVED_ARTICLES',
        'articles',
        'archived_batch',
        `Purge de ${archived.length} article(s) archivé(s) et nettoyage des médias associés pour libérer de l’espace.`
      );
      return archived.length;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'articles/archived');
    }
  }, [user, isFounder, userEmail, emailVerified, adminUsers, articles, writeAuditLog]);

  // Save Journalist Profile (Family admin)
  const saveJournalist = useCallback(
    async (journalist: Journalist, isNew: boolean) => {
      if (!user || !canUserPerform(userEmail, emailVerified, 'manage_journalists', adminUsers)) {
        throw new Error('Permission "Gérer les profils des journalistes" requise.');
      }
      const id = isNew ? `jour_${Date.now()}` : journalist.id;
      const basePayload = {
        fullNameFr: clampString(journalist.fullNameFr, 120),
        fullNameAr: clampString(journalist.fullNameAr, 120),
        roleFr: clampString(journalist.roleFr, 120),
        roleAr: clampString(journalist.roleAr, 120),
        bioFr: clampString(journalist.bioFr, 600),
        bioAr: clampString(journalist.bioAr, 600),
        careerFr: clampString(journalist.careerFr, 3000),
        careerAr: clampString(journalist.careerAr, 3000),
        coverageAreasFr: journalist.coverageAreasFr.map((s) => clampString(s, 60)).filter(Boolean).slice(0, 10),
        coverageAreasAr: journalist.coverageAreasAr.map((s) => clampString(s, 60)).filter(Boolean).slice(0, 10),
        photoUrl: clampString(journalist.photoUrl, 500),
        socials: sanitizeSocials(journalist.socials),
        ownerUid: clampString(journalist.ownerUid, 128),
        isVisible: Boolean(journalist.isVisible),
      };
      const docRef = doc(db, 'journalists', id);
      try {
        const existsInDb = !isNew && (await getDoc(docRef)).exists();
        if (isNew || !existsInDb) {
          await setDoc(docRef, {
            ...basePayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(docRef, {
            ...basePayload,
            updatedAt: serverTimestamp(),
          });
        }
        await writeAuditLog(
          isNew ? 'CREATE_JOURNALIST' : 'UPDATE_JOURNALIST',
          'journalists',
          id,
          `Profil journaliste "${basePayload.fullNameFr || basePayload.fullNameAr}" (visible: ${basePayload.isVisible ? 'oui' : 'masqué'}).`
        );
      } catch (err) {
        handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, `journalists/${id}`);
      }
    },
    [user, userEmail, emailVerified, adminUsers, writeAuditLog]
  );

  // External journalist updating ONLY their own linked public biographical fields
  const updateOwnJournalistProfile = useCallback(
    async (
      journalist: Journalist,
      patch: Pick<
        Journalist,
        | 'fullNameFr'
        | 'fullNameAr'
        | 'roleFr'
        | 'roleAr'
        | 'bioFr'
        | 'bioAr'
        | 'careerFr'
        | 'careerAr'
        | 'coverageAreasFr'
        | 'coverageAreasAr'
        | 'photoUrl'
        | 'socials'
      >
    ) => {
      if (!user || !emailVerified || journalist.ownerUid !== user.uid) {
        throw new Error('Vous ne pouvez modifier que votre propre profil public lié.');
      }
      try {
        await updateDoc(doc(db, 'journalists', journalist.id), {
          fullNameFr: clampString(patch.fullNameFr, 120),
          fullNameAr: clampString(patch.fullNameAr, 120),
          roleFr: clampString(patch.roleFr, 120),
          roleAr: clampString(patch.roleAr, 120),
          bioFr: clampString(patch.bioFr, 600),
          bioAr: clampString(patch.bioAr, 600),
          careerFr: clampString(patch.careerFr, 3000),
          careerAr: clampString(patch.careerAr, 3000),
          coverageAreasFr: patch.coverageAreasFr.map((s) => clampString(s, 60)).filter(Boolean).slice(0, 10),
          coverageAreasAr: patch.coverageAreasAr.map((s) => clampString(s, 60)).filter(Boolean).slice(0, 10),
          photoUrl: clampString(patch.photoUrl, 500),
          socials: sanitizeSocials(patch.socials),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `journalists/${journalist.id}`);
      }
    },
    [user, emailVerified]
  );

  const deleteJournalist = useCallback(
    async (id: string) => {
      if (!user || (!isFounder && !canUserPerform(userEmail, emailVerified, 'manage_journalists', adminUsers))) {
        throw new Error('Permission "Gérer les profils des journalistes" requise pour supprimer une fiche.');
      }
      try {
        const hasLiveJournalists = Boolean(firestoreJournalists && firestoreJournalists.length > 0);
        if (!hasLiveJournalists && !firestoreSettings) {
          // Starter catalog has not been materialized in Firestore yet:
          // persist remaining starter journalists + siteSettings so the deleted journalist disappears immediately.
          const batch = writeBatch(db);
          const remaining = DEFAULT_JOURNALISTS.filter((j) => j.id !== id);
          for (const j of remaining) {
            batch.set(doc(db, 'journalists', j.id), {
              fullNameFr: j.fullNameFr,
              fullNameAr: j.fullNameAr,
              roleFr: j.roleFr,
              roleAr: j.roleAr,
              bioFr: j.bioFr,
              bioAr: j.bioAr,
              careerFr: j.careerFr,
              careerAr: j.careerAr,
              coverageAreasFr: j.coverageAreasFr,
              coverageAreasAr: j.coverageAreasAr,
              photoUrl: j.photoUrl,
              socials: sanitizeSocials(j.socials),
              ownerUid: j.ownerUid,
              isVisible: j.isVisible,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          if (canUserPerform(userEmail, emailVerified, 'manage_site_settings', adminUsers)) {
            batch.set(doc(db, 'siteSettings', 'main'), {
              ...DEFAULT_SITE_SETTINGS,
              socials: sanitizeSocials(DEFAULT_SITE_SETTINGS.socials),
              updatedByEmail: userEmail,
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();
        } else {
          await deleteDoc(doc(db, 'journalists', id));
          // Ensure deleting the last journalist does not resurrect starter defaults
          if (
            firestoreJournalists &&
            firestoreJournalists.length <= 1 &&
            !firestoreSettings &&
            canUserPerform(userEmail, emailVerified, 'manage_site_settings', adminUsers)
          ) {
            await setDoc(doc(db, 'siteSettings', 'main'), {
              ...DEFAULT_SITE_SETTINGS,
              socials: sanitizeSocials(DEFAULT_SITE_SETTINGS.socials),
              updatedByEmail: userEmail,
              updatedAt: serverTimestamp(),
            });
          }
        }
        await writeAuditLog('DELETE_JOURNALIST', 'journalists', id, 'Suppression d’une fiche journaliste.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `journalists/${id}`);
      }
    },
    [user, isFounder, userEmail, emailVerified, adminUsers, firestoreJournalists, firestoreSettings, writeAuditLog]
  );

  // External journalist account registration (strictly starts as 'pending', awaits Direction approval)
  const requestJournalistAccount = useCallback(
    async (payload: {
      fullName: string;
      specialty: string;
      phoneOrContact: string;
      bio: string;
      portfolioUrl: string;
    }) => {
      if (!user || !emailVerified || !userEmail) {
        throw new Error('Connexion avec adresse e-mail vérifiée requise.');
      }
      const fullName = clampString(payload.fullName, 120);
      if (fullName.length < 2) {
        throw new Error('Veuillez renseigner votre nom complet (2 caractères minimum).');
      }
      const docRef = doc(db, 'journalistAccounts', user.uid);
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, {
            fullName,
            specialty: clampString(payload.specialty, 160),
            phoneOrContact: clampString(payload.phoneOrContact, 80),
            bio: clampString(payload.bio, 600),
            portfolioUrl: clampString(payload.portfolioUrl, 300),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(docRef, {
            uid: user.uid,
            email: userEmail,
            fullName,
            specialty: clampString(payload.specialty, 160),
            phoneOrContact: clampString(payload.phoneOrContact, 80),
            bio: clampString(payload.bio, 600),
            portfolioUrl: clampString(payload.portfolioUrl, 300),
            status: 'pending',
            reviewedByEmail: '',
            reviewNotes: '',
            linkedJournalistId: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `journalistAccounts/${user.uid}`);
      }
    },
    [user, emailVerified, userEmail]
  );

  // Direction review of journalist account (approve / reject / suspend)
  const reviewJournalistAccount = useCallback(
    async (
      account: JournalistAccount,
      status: JournalistAccountStatus,
      reviewNotes = '',
      alsoCreatePublicProfile = false
    ) => {
      if (!user || (!isFounder && !canUserPerform(userEmail, emailVerified, 'manage_journalists', adminUsers))) {
        throw new Error('Permission "Gérer les profils des journalistes" requise.');
      }
      try {
        let linkedId = account.linkedJournalistId || '';
        if (status === 'approved' && alsoCreatePublicProfile && !linkedId) {
          linkedId = `jour_${Date.now()}`;
          await setDoc(doc(db, 'journalists', linkedId), {
            fullNameFr: clampString(account.fullName, 120),
            fullNameAr: clampString(account.fullName, 120),
            roleFr: clampString(account.specialty || 'Journaliste contributeur', 120),
            roleAr: clampString(account.specialty || 'صحفي مساهم', 120),
            bioFr: clampString(account.bio, 600),
            bioAr: clampString(account.bio, 600),
            careerFr: '',
            careerAr: '',
            coverageAreasFr: account.specialty ? [clampString(account.specialty, 60)] : [],
            coverageAreasAr: [],
            photoUrl: '',
            socials: account.portfolioUrl ? sanitizeSocials({ website: account.portfolioUrl }) : {},
            ownerUid: account.uid,
            isVisible: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        await updateDoc(doc(db, 'journalistAccounts', account.uid), {
          status,
          reviewedByEmail: userEmail,
          reviewNotes: clampString(reviewNotes, 500),
          linkedJournalistId: linkedId,
          updatedAt: serverTimestamp(),
        });

        await writeAuditLog(
          `JOURNALIST_ACCOUNT_${status.toUpperCase()}`,
          'journalistAccounts',
          account.uid,
          `Compte journaliste ${account.fullName} (${account.email}) → ${status}${reviewNotes ? ` : ${clampString(reviewNotes, 140)}` : ''}`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `journalistAccounts/${account.uid}`);
      }
    },
    [user, isFounder, userEmail, emailVerified, adminUsers, writeAuditLog]
  );

  const deleteJournalistAccount = useCallback(
    async (account: JournalistAccount) => {
      if (!user || (!isFounder && !canUserPerform(userEmail, emailVerified, 'manage_journalists', adminUsers))) {
        throw new Error('Permission "Gérer les profils des journalistes" requise.');
      }
      try {
        await deleteDoc(doc(db, 'journalistAccounts', account.uid));
        await writeAuditLog(
          'DELETE_JOURNALIST_ACCOUNT',
          'journalistAccounts',
          account.uid,
          `Suppression du compte journaliste externe ${account.fullName} (${account.email}).`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `journalistAccounts/${account.uid}`);
      }
    },
    [user, isFounder, userEmail, emailVerified, adminUsers, writeAuditLog]
  );

  // External journalist secure submission (APPROVED accounts only + mandatory <= 2MB photo)
  const createSubmission = useCallback(
    async (
      payload: Omit<
        Submission,
        'id' | 'authorUid' | 'authorEmail' | 'status' | 'linkedArticleId' | 'createdAt' | 'updatedAt'
      >
    ) => {
      if (!user || !emailVerified) {
        throw new Error('Connexion avec adresse e-mail vérifiée requise pour soumettre un article.');
      }
      if (!isFamilyMember && myJournalistAccount?.status !== 'approved') {
        throw new Error(
          'Votre compte journaliste doit d’abord être approuvé par la Direction avant de pouvoir soumettre un article.'
        );
      }
      const coverUrl = clampString(payload.coverImageUrl, 500);
      const coverBytes = Number(payload.coverImageSizeBytes) || 0;
      if (!coverUrl.startsWith('https://') || coverBytes <= 0 || coverBytes > MAX_SUBMISSION_IMAGE_BYTES) {
        throw new Error(
          'Une photo d’article téléversée (JPG, PNG ou WebP, 2 Mo maximum) est obligatoire pour soumettre un article.'
        );
      }
      const id = `sub_${Date.now()}`;
      try {
        await setDoc(doc(db, 'submissions', id), {
          authorUid: user.uid,
          authorName: clampString(payload.authorName, 120),
          authorEmail: userEmail,
          language: payload.language,
          categoryId: clampString(payload.categoryId, 64),
          titleFr: clampString(payload.titleFr, 220),
          titleAr: clampString(payload.titleAr, 220),
          summaryFr: clampString(payload.summaryFr, 600),
          summaryAr: clampString(payload.summaryAr, 600),
          contentFr: clampString(payload.contentFr, 25000),
          contentAr: clampString(payload.contentAr, 25000),
          coverImageUrl: coverUrl,
          coverImageCaption: clampString(payload.coverImageCaption, 240),
          coverImageSizeBytes: coverBytes,
          notesForEditors: clampString(payload.notesForEditors, 1000),
          status: 'received',
          linkedArticleId: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `submissions/${id}`);
      }
    },
    [user, emailVerified, userEmail, isFamilyMember, myJournalistAccount]
  );

  const updateSubmissionStatus = useCallback(
    async (submission: Submission, status: Submission['status'], linkedArticleId = '') => {
      if (!user || !canUserPerform(userEmail, emailVerified, 'create_articles', adminUsers)) {
        throw new Error('Permission éditoriale requise.');
      }
      try {
        await updateDoc(doc(db, 'submissions', submission.id), {
          status,
          linkedArticleId: clampString(linkedArticleId || submission.linkedArticleId, 128),
          updatedAt: serverTimestamp(),
        });
        await writeAuditLog(
          'UPDATE_SUBMISSION_STATUS',
          'submissions',
          submission.id,
          `Proposition de ${submission.authorName} passée au statut "${status}".`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `submissions/${submission.id}`);
      }
    },
    [user, userEmail, emailVerified, adminUsers, writeAuditLog]
  );

  // Founder-only Family Admin Account Management
  const saveAdminUser = useCallback(
    async (account: AdminUser, isNew: boolean) => {
      if (!user || !isFounder) {
        throw new Error('Seul le fondateur (tmerzak@gmail.com) peut gérer les comptes familiaux.');
      }
      const normalized = normalizeEmail(account.email);
      const docId = emailToDocId(normalized);
      const isProtected = isFounderEmail(normalized);

      if (!isNew) {
        const check = canModifyAdminAccount({
          actorEmail: userEmail,
          emailVerified,
          targetAccount: account,
          nextRole: account.role,
          nextIsActive: account.isActive,
        });
        if (!check.allowed) throw new Error(check.reason);
      }

      const safePermissions: PermissionsMap = {
        ...account.permissions,
        manage_users: isProtected,
      };

      try {
        if (isNew) {
          await setDoc(doc(db, 'adminUsers', docId), {
            email: normalized,
            displayName: clampString(account.displayName, 120),
            familyRelation: clampString(account.familyRelation, 120),
            role: isProtected ? 'founder' : account.role === 'founder' ? 'co_founder' : account.role,
            isActive: isProtected ? true : Boolean(account.isActive),
            isProtectedOwner: isProtected,
            permissions: safePermissions,
            updatedByEmail: userEmail,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'adminUsers', docId), {
            displayName: clampString(account.displayName, 120),
            familyRelation: clampString(account.familyRelation, 120),
            role: isProtected ? 'founder' : account.role === 'founder' ? 'co_founder' : account.role,
            isActive: isProtected ? true : Boolean(account.isActive),
            permissions: safePermissions,
            updatedByEmail: userEmail,
            updatedAt: serverTimestamp(),
          });
        }
        await writeAuditLog(
          isNew ? 'CREATE_FAMILY_ADMIN' : 'UPDATE_FAMILY_PERMISSIONS',
          'adminUsers',
          docId,
          `Compte familial ${normalized} (${account.role}, actif: ${account.isActive ? 'oui' : 'non'}).`
        );
      } catch (err) {
        handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, `adminUsers/${docId}`);
      }
    },
    [user, isFounder, userEmail, emailVerified, writeAuditLog]
  );

  const deleteAdminUser = useCallback(
    async (account: AdminUser) => {
      const check = canModifyAdminAccount({
        actorEmail: userEmail,
        emailVerified,
        targetAccount: account,
        nextRole: account.role,
        nextIsActive: account.isActive,
        isDelete: true,
      });
      if (!check.allowed) throw new Error(check.reason);
      const docId = emailToDocId(account.email);
      try {
        await deleteDoc(doc(db, 'adminUsers', docId));
        await writeAuditLog(
          'DELETE_FAMILY_ADMIN',
          'adminUsers',
          docId,
          `Retrait de l’accès familial pour ${account.email}.`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `adminUsers/${docId}`);
      }
    },
    [userEmail, emailVerified, writeAuditLog]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value: AppContextValue = {
    theme,
    toggleTheme,
    language,
    setLanguage,
    user,
    userEmail,
    emailVerified,
    jwtEmailMissing,
    authReady,
    isFamilyMember,
    isFounder,
    currentRole,
    currentPermissions,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
    siteSettings,
    previewSettings,
    setPreviewSettings,
    effectiveSettings,
    articles,
    publishedArticles,
    breakingNews,
    activeBreakingNews,
    journalists,
    visibleJournalists,
    journalistAccounts: firestoreJournalistAccounts,
    myJournalistAccount,
    submissions: firestoreSubmissions,
    adminUsers,
    auditLogs: firestoreAuditLogs,
    isFirestoreSeeded,
    seedInitialDatabase,
    saveSiteSettings,
    saveBreakingNews,
    deleteBreakingNews,
    saveArticle,
    transitionArticleStatus,
    deleteArticle,
    purgeArchivedArticles,
    saveJournalist,
    updateOwnJournalistProfile,
    deleteJournalist,
    requestJournalistAccount,
    reviewJournalistAccount,
    deleteJournalistAccount,
    createSubmission,
    updateSubmissionStatus,
    saveAdminUser,
    deleteAdminUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
