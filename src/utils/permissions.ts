import type {
  AdminUser,
  ArticleStatus,
  FamilyRole,
  Journalist,
  PermissionKey,
  PermissionsMap,
} from '../types';

export const FOUNDER_EMAIL = 'tmerzak@gmail.com';
export const TECH_DIRECTOR_EMAIL = 'badroumc@gmail.com';
export const CO_FOUNDER_EMAILS = [
  'tigrine156@gmail.com',
  'tigrinemelissalyna@gmail.com',
] as const;

export const ALL_PERMISSION_KEYS: readonly PermissionKey[] = [
  'view_dashboard',
  'view_articles',
  'create_articles',
  'edit_own_articles',
  'edit_all_articles',
  'delete_articles',
  'upload_media',
  'manage_categories',
  'manage_comments',
  'manage_journalists',
  'manage_site_settings',
  'manage_users',
  'manage_breaking_news',
  'view_stats',
] as const;

export function createEmptyPermissions(): PermissionsMap {
  return {
    view_dashboard: false,
    view_articles: false,
    create_articles: false,
    edit_own_articles: false,
    edit_all_articles: false,
    delete_articles: false,
    upload_media: false,
    manage_categories: false,
    manage_comments: false,
    manage_journalists: false,
    manage_site_settings: false,
    manage_users: false,
    manage_breaking_news: false,
    view_stats: false,
  };
}

export function createFounderPermissions(): PermissionsMap {
  return {
    view_dashboard: true,
    view_articles: true,
    create_articles: true,
    edit_own_articles: true,
    edit_all_articles: true,
    delete_articles: true,
    upload_media: true,
    manage_categories: true,
    manage_comments: true,
    manage_journalists: true,
    manage_site_settings: true,
    manage_users: true,
    manage_breaking_news: true,
    view_stats: true,
  };
}

export function createTechDirectorDefaultPermissions(): PermissionsMap {
  return {
    view_dashboard: true,
    view_articles: true,
    create_articles: true,
    edit_own_articles: true,
    edit_all_articles: true,
    delete_articles: false,
    upload_media: true,
    manage_categories: true,
    manage_comments: true,
    manage_journalists: true,
    manage_site_settings: true,
    manage_users: false,
    manage_breaking_news: true,
    view_stats: true,
  };
}

export function createCoFounderDefaultPermissions(): PermissionsMap {
  return {
    view_dashboard: true,
    view_articles: true,
    create_articles: true,
    edit_own_articles: true,
    edit_all_articles: false,
    delete_articles: false,
    upload_media: true,
    manage_categories: false,
    manage_comments: true,
    manage_journalists: false,
    manage_site_settings: false,
    manage_users: false,
    manage_breaking_news: true,
    view_stats: false,
  };
}

export function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

export interface AuthUserLike {
  email?: string | null;
  emailVerified?: boolean;
  providerData?: ReadonlyArray<{
    providerId?: string | null;
    email?: string | null;
  }>;
}

/**
 * Resolves the user's verified email address safely.
 * Supports both standard Firebase Auth ("One account per email") where user.email
 * and user.emailVerified are populated on the root object, AND multi-account mode
 * ("Create multiple accounts for each identity provider") where Google Sign-In stores
 * the verified email inside providerData[providerId === 'google.com'].
 */
export function extractVerifiedIdentity(user: AuthUserLike | null | undefined): {
  email: string;
  emailVerified: boolean;
} {
  if (!user) return { email: '', emailVerified: false };

  const directEmail = normalizeEmail(user.email);
  if (directEmail) {
    const hasGoogleProvider = Boolean(
      user.providerData?.some(
        (p) => p.providerId === 'google.com' && normalizeEmail(p.email) === directEmail
      )
    );
    return {
      email: directEmail,
      emailVerified: Boolean(user.emailVerified) || hasGoogleProvider,
    };
  }

  const googleProfile = user.providerData?.find(
    (p) => p.providerId === 'google.com' && normalizeEmail(p.email).length > 0
  );
  if (googleProfile) {
    return {
      email: normalizeEmail(googleProfile.email),
      emailVerified: true,
    };
  }

  const fallbackProfile = user.providerData?.find((p) => normalizeEmail(p.email).length > 0);
  if (fallbackProfile) {
    return {
      email: normalizeEmail(fallbackProfile.email),
      emailVerified: Boolean(user.emailVerified),
    };
  }

  return { email: '', emailVerified: false };
}

export function emailToDocId(email: string): string {
  return normalizeEmail(email).replace(/[^a-z0-9]/g, '_');
}

export function isFounderEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === FOUNDER_EMAIL;
}

export function isBootstrappedFamilyEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return (
    normalized === FOUNDER_EMAIL ||
    normalized === TECH_DIRECTOR_EMAIL ||
    (CO_FOUNDER_EMAILS as readonly string[]).includes(normalized)
  );
}

export function findAdminRecord(
  email: string | null | undefined,
  adminUsers: AdminUser[]
): AdminUser | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return adminUsers.find((u) => normalizeEmail(u.email) === normalized) || null;
}

export function isAuthorizedFamilyAdmin(
  email: string | null | undefined,
  emailVerified: boolean,
  adminUsers: AdminUser[]
): boolean {
  if (!emailVerified) return false;
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (normalized === FOUNDER_EMAIL) return true;

  const record = findAdminRecord(normalized, adminUsers);
  if (record) {
    return record.isActive === true;
  }
  return isBootstrappedFamilyEmail(normalized);
}

export function resolveEffectiveRole(
  email: string | null | undefined,
  adminUsers: AdminUser[]
): FamilyRole | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  if (normalized === FOUNDER_EMAIL) return 'founder';
  const record = findAdminRecord(normalized, adminUsers);
  if (record) {
    return record.isActive ? record.role : null;
  }
  if (normalized === TECH_DIRECTOR_EMAIL) return 'tech_director';
  if ((CO_FOUNDER_EMAILS as readonly string[]).includes(normalized)) return 'co_founder';
  return null;
}

export function resolveEffectivePermissions(
  email: string | null | undefined,
  emailVerified: boolean,
  adminUsers: AdminUser[]
): PermissionsMap {
  if (!emailVerified) return createEmptyPermissions();
  const normalized = normalizeEmail(email);
  if (!normalized) return createEmptyPermissions();
  if (normalized === FOUNDER_EMAIL) return createFounderPermissions();

  const record = findAdminRecord(normalized, adminUsers);
  if (record) {
    if (!record.isActive) return createEmptyPermissions();
    // Security invariant: non-founders can NEVER receive manage_users
    return {
      ...createEmptyPermissions(),
      ...record.permissions,
      manage_users: false,
    };
  }

  if (normalized === TECH_DIRECTOR_EMAIL) return createTechDirectorDefaultPermissions();
  if ((CO_FOUNDER_EMAILS as readonly string[]).includes(normalized)) {
    return createCoFounderDefaultPermissions();
  }
  return createEmptyPermissions();
}

export function canUserPerform(
  email: string | null | undefined,
  emailVerified: boolean,
  permission: PermissionKey,
  adminUsers: AdminUser[]
): boolean {
  const perms = resolveEffectivePermissions(email, emailVerified, adminUsers);
  return perms[permission] === true;
}

/**
 * ABSOLUTE EDITORIAL RULE:
 * Only the verified Founder (tmerzak@gmail.com) may approve, publish, unpublish, or archive published articles.
 */
export function canApproveOrPublish(
  email: string | null | undefined,
  emailVerified: boolean
): boolean {
  return emailVerified && isFounderEmail(email);
}

export interface TransitionCheckResult {
  allowed: boolean;
  reason?: string;
}

export function validateArticleTransition(params: {
  actorEmail: string | null | undefined;
  emailVerified: boolean;
  existingStatus: ArticleStatus | null; // null on create
  nextStatus: ArticleStatus;
  isArticleCreator: boolean;
  adminUsers: AdminUser[];
}): TransitionCheckResult {
  const { actorEmail, emailVerified, existingStatus, nextStatus, isArticleCreator, adminUsers } =
    params;

  if (!emailVerified || !isAuthorizedFamilyAdmin(actorEmail, emailVerified, adminUsers)) {
    return { allowed: false, reason: 'Accès réservé aux membres autorisés de la famille.' };
  }

  // Founder has exclusive full transition control
  if (canApproveOrPublish(actorEmail, emailVerified)) {
    return { allowed: true };
  }

  const perms = resolveEffectivePermissions(actorEmail, emailVerified, adminUsers);

  // Non-founder creation rule
  if (existingStatus === null) {
    if (!perms.create_articles) {
      return { allowed: false, reason: 'Permission "Ajouter des articles" requise.' };
    }
    if (nextStatus !== 'draft' && nextStatus !== 'pending_review') {
      return {
        allowed: false,
        reason: 'Seul le fondateur peut approuver ou publier un article.',
      };
    }
    return { allowed: true };
  }

  // Non-founder update rule
  const canEdit = perms.edit_all_articles || (perms.edit_own_articles && isArticleCreator);
  if (!canEdit) {
    return { allowed: false, reason: 'Vous ne disposez pas de la permission de modifier cet article.' };
  }

  if (existingStatus === 'published' || existingStatus === 'approved' || existingStatus === 'archived') {
    return {
      allowed: false,
      reason: 'Un article approuvé, publié ou archivé ne peut être modifié que par le fondateur.',
    };
  }

  if (nextStatus !== 'draft' && nextStatus !== 'pending_review') {
    return {
      allowed: false,
      reason: 'Seul le fondateur (tmerzak@gmail.com) peut approuver, publier ou demander des corrections.',
    };
  }

  return { allowed: true };
}

export function canModifyAdminAccount(params: {
  actorEmail: string | null | undefined;
  emailVerified: boolean;
  targetAccount: AdminUser;
  nextRole: FamilyRole;
  nextIsActive: boolean;
  isDelete?: boolean;
}): TransitionCheckResult {
  const { actorEmail, emailVerified, targetAccount, nextRole, nextIsActive, isDelete } = params;

  if (!canApproveOrPublish(actorEmail, emailVerified)) {
    return {
      allowed: false,
      reason: 'Seul le fondateur peut gérer les comptes administrateurs et leurs permissions.',
    };
  }

  const targetIsProtected =
    targetAccount.isProtectedOwner || isFounderEmail(targetAccount.email);

  if (targetIsProtected) {
    if (isDelete) {
      return { allowed: false, reason: 'Le compte propriétaire du fondateur ne peut pas être supprimé.' };
    }
    if (nextRole !== 'founder' || !nextIsActive) {
      return {
        allowed: false,
        reason: 'Le compte fondateur est protégé et ne peut être ni rétrogradé ni désactivé.',
      };
    }
  } else if (!isDelete && nextRole === 'founder') {
    return {
      allowed: false,
      reason: 'Le rôle Fondateur est unique et réservé au propriétaire principal.',
    };
  }

  return { allowed: true };
}

export function canEditJournalistProfile(params: {
  actorEmail: string | null | undefined;
  actorUid: string | null | undefined;
  emailVerified: boolean;
  journalist: Journalist;
  adminUsers: AdminUser[];
}): { canEditFull: boolean; canEditOwnBioOnly: boolean } {
  const { actorEmail, actorUid, emailVerified, journalist, adminUsers } = params;
  if (!emailVerified) return { canEditFull: false, canEditOwnBioOnly: false };

  if (canUserPerform(actorEmail, emailVerified, 'manage_journalists', adminUsers)) {
    return { canEditFull: true, canEditOwnBioOnly: false };
  }

  if (actorUid && journalist.ownerUid && journalist.ownerUid === actorUid) {
    return { canEditFull: false, canEditOwnBioOnly: true };
  }

  return { canEditFull: false, canEditOwnBioOnly: false };
}
