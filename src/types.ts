export type Language = 'fr' | 'ar';

export type FamilyRole = 'founder' | 'tech_director' | 'co_founder';

export type PermissionKey =
  | 'view_dashboard'
  | 'view_articles'
  | 'create_articles'
  | 'edit_own_articles'
  | 'edit_all_articles'
  | 'delete_articles'
  | 'upload_media'
  | 'manage_categories'
  | 'manage_comments'
  | 'manage_journalists'
  | 'manage_site_settings'
  | 'manage_users'
  | 'manage_breaking_news'
  | 'view_stats';

export type PermissionsMap = Record<PermissionKey, boolean>;

export type ArticleStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'archived';

export type BreakingStatus = 'active' | 'paused' | 'archived';

export type SubmissionStatus = 'received' | 'in_review' | 'converted_to_draft' | 'declined';

export type JournalistAccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface CategoryConfig {
  id: string;
  nameFr: string;
  nameAr: string;
  accentHex?: string;
}

export interface NavItemConfig {
  id: string;
  path: string;
  labelFr: string;
  labelAr: string;
}

export interface SocialLinks {
  x?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
}

export interface SiteSettings {
  mediaName: string;
  logoUrl: string;
  sloganFr: string;
  sloganAr: string;
  descriptionFr: string;
  descriptionAr: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  breakingColor: string;
  breakingBannerEnabled: boolean;
  heroTitleFr: string;
  heroTitleAr: string;
  heroSubtitleFr: string;
  heroSubtitleAr: string;
  categories: CategoryConfig[];
  navigation: NavItemConfig[];
  contactEmail: string;
  contactPhone: string;
  contactAddressFr: string;
  contactAddressAr: string;
  socials: SocialLinks;
  footerTextFr: string;
  footerTextAr: string;
  legalTextFr: string;
  legalTextAr: string;
  updatedByEmail: string;
  updatedAt?: unknown;
}

export interface BreakingNewsItem {
  id: string;
  textFr: string;
  textAr: string;
  articleSlug: string;
  status: BreakingStatus;
  sortOrder: number;
  durationSeconds: number;
  expiresAt: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ArticleLocaleContent {
  title: string;
  subtitle: string;
  summary: string;
  content: string;
  coverImageUrl: string;
  coverCaption: string;
  ready: boolean;
}

export interface Article {
  id: string;
  slug: string;
  categoryId: string;
  authorId: string;
  status: ArticleStatus;
  isFeatured: boolean;
  fr: ArticleLocaleContent;
  ar: ArticleLocaleContent;
  reviewNotes: string;
  createdByUid: string;
  createdByEmail: string;
  approvedByEmail: string;
  approvedAt: string;
  publishedAt: string;
  viewsCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Journalist {
  id: string;
  fullNameFr: string;
  fullNameAr: string;
  roleFr: string;
  roleAr: string;
  bioFr: string;
  bioAr: string;
  careerFr: string;
  careerAr: string;
  coverageAreasFr: string[];
  coverageAreasAr: string[];
  photoUrl: string;
  socials: SocialLinks;
  ownerUid: string;
  isVisible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JournalistAccount {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  specialty: string;
  phoneOrContact: string;
  bio: string;
  portfolioUrl: string;
  status: JournalistAccountStatus;
  reviewedByEmail: string;
  reviewNotes: string;
  linkedJournalistId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Submission {
  id: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  language: 'fr' | 'ar' | 'bilingual';
  categoryId: string;
  titleFr: string;
  titleAr: string;
  summaryFr: string;
  summaryAr: string;
  contentFr: string;
  contentAr: string;
  coverImageUrl: string;
  coverImageCaption: string;
  coverImageSizeBytes: number;
  notesForEditors: string;
  status: SubmissionStatus;
  linkedArticleId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  familyRelation: string;
  role: FamilyRole;
  isActive: boolean;
  isProtectedOwner: boolean;
  permissions: PermissionsMap;
  updatedByEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuditLog {
  id: string;
  action: string;
  targetCollection: string;
  targetId: string;
  details: string;
  actorUid: string;
  actorEmail: string;
  actorRole: FamilyRole;
  createdAt?: unknown;
}
