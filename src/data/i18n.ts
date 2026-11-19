import type { ArticleStatus, FamilyRole, Language, PermissionKey, SubmissionStatus } from '../types';

export const UI_COPY = {
  fr: {
    breakingLabel: 'DERNIÈRE MINUTE',
    searchPlaceholder: 'Rechercher un article, un sujet…',
    allCategories: 'Toute l’actualité',
    leadStoryKicker: 'À la une',
    latestDispatches: 'Fil d’actualité',
    readArticle: 'Lire l’article',
    minRead: 'min de lecture',
    byAuthor: 'Par',
    ourEditorialTeam: 'Notre équipe rédactionnelle',
    viewAllJournalists: 'Découvrir toute la rédaction',
    viewProfile: 'Voir le profil',
    publishedArticles: 'Publications signées',
    noPublishedYet: 'Aucun article publié pour le moment.',
    languageFallbackBanner:
      'Cet article n’a pas encore été validé dans cette langue par la rédaction. Affichage de la version originale validée :',
    switchToLanguage: 'العربية',
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    adminAccess: 'Espace Direction',
    legalTitle: 'Mentions légales & Charte éditoriale',
    contactTitle: 'Contacter la rédaction',
    contactSubtitle: 'Pour toute demande presse, partenariat ou signalement éditorial.',
    submitPortalTitle: 'Portail de soumission des journalistes externes',
    submitPortalSubtitle:
      'Transmettez vos articles et propositions de reportages en toute sécurité à l’équipe éditoriale familiale TASSI-VOX. Les journalistes externes n’ont aucun accès au panneau d’administration ni à la publication directe.',
    submitSignInRequired: 'Connexion journaliste vérifiée requise pour envoyer une proposition sécurisée et suivre son statut.',
    submitSuccess: 'Votre proposition a été transmise de manière sécurisée à l’équipe éditoriale.',
    mySubmissions: 'Mes propositions transmises',
    myPublicProfile: 'Mon profil journaliste public',
    editMyBio: 'Modifier ma biographie publique',
    coverageAreas: 'Domaines de couverture',
    careerPath: 'Parcours professionnel et journalistique',
    relatedStories: 'Dans la même rubrique',
    backHome: 'Retour à la une',
    backTeam: 'Retour à l’équipe',
    copyright: 'Tous droits réservés.',
    previewModeBanner: 'MODE PRÉVISUALISATION — Modifications non enregistrées dans Firebase',
  },
  ar: {
    breakingLabel: 'عاجل',
    searchPlaceholder: 'ابحث عن مقال أو موضوع…',
    allCategories: 'كل الأخبار',
    leadStoryKicker: 'الحدث الأبرز',
    latestDispatches: 'آخر الأخبار',
    readArticle: 'اقرأ المقال',
    minRead: 'دقائق للقراءة',
    byAuthor: 'بقلم',
    ourEditorialTeam: 'هيئة التحرير',
    viewAllJournalists: 'التعرف على كامل هيئة التحرير',
    viewProfile: 'عرض الملف الشخصي',
    publishedArticles: 'المقالات المنشورة',
    noPublishedYet: 'لا توجد مقالات منشورة حالياً.',
    languageFallbackBanner:
      'لم تتم المصادقة على النسخة العربية لهذا المقال بعد من طرف هيئة التحرير. يتم عرض النسخة الأصلية المعتمدة:',
    switchToLanguage: 'Français',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    adminAccess: 'فضاء الإدارة',
    legalTitle: 'البيانات القانونية والميثاق التحريري',
    contactTitle: 'تواصل مع هيئة التحرير',
    contactSubtitle: 'للاستفسارات الصحفية، الشراكات أو المراسلات التحريرية.',
    submitPortalTitle: 'بوابة إرسال المقالات للصحفيين الخارجيين',
    submitPortalSubtitle:
      'أرسل مقالاتك ومقترحاتك الصحفية بأمان إلى الفريق التحريري العائلي لمنصة تاسي-فوكس. لا يمتلك الصحفيون الخارجيون أي وصول إلى لوحة الإدارة أو النشر المباشر.',
    submitSignInRequired: 'يرجى تسجيل الدخول بحساب صحفي موثّق لإرسال مقترحك بأمان ومتابعة حالته.',
    submitSuccess: 'تم إرسال مقترحك بنجاح وبأمان إلى الفريق التحريري.',
    mySubmissions: 'مقترحاتي المرسلة',
    myPublicProfile: 'ملفي الصحفي العام',
    editMyBio: 'تعديل سيرتي العامة',
    coverageAreas: 'مجالات التغطية',
    careerPath: 'المسار المهني والصحفي',
    relatedStories: 'في نفس القسم',
    backHome: 'العودة إلى الرئيسية',
    backTeam: 'العودة إلى هيئة التحرير',
    copyright: 'جميع الحقوق محفوظة.',
    previewModeBanner: 'وضع المعاينة المباشرة — التغييرات غير محفوظة بعد في Firebase',
  },
} as const;

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, { fr: string; ar: string }> = {
  draft: { fr: 'Brouillon', ar: 'مسودة' },
  pending_review: { fr: 'En attente de validation', ar: 'قيد انتظار المصادقة' },
  changes_requested: { fr: 'Corrections demandées', ar: 'مطلوب تعديلات' },
  approved: { fr: 'Approuvé (Fondateur)', ar: 'مصادق عليه' },
  published: { fr: 'Publié', ar: 'منشور' },
  archived: { fr: 'Archivé', ar: 'مؤرشف' },
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, { fr: string; ar: string }> = {
  received: { fr: 'Reçu par la rédaction', ar: 'تم الاستلام' },
  in_review: { fr: 'En cours de relecture', ar: 'قيد المراجعة' },
  converted_to_draft: { fr: 'Converti en brouillon éditorial', ar: 'تم تحويله لمسودة تحريرية' },
  declined: { fr: 'Non retenu', ar: 'لم يُعتمد' },
};

export const ROLE_LABELS: Record<FamilyRole, { fr: string; ar: string }> = {
  founder: { fr: 'Fondateur (Contrôle total)', ar: 'المؤسس (صلاحية كاملة)' },
  tech_director: { fr: 'Directeur technique', ar: 'المدير التقني' },
  co_founder: { fr: 'Co-fondateur', ar: 'شريك مؤسس' },
};

export const PERMISSION_LABELS: Record<PermissionKey, { fr: string; descriptionFr: string }> = {
  view_dashboard: {
    fr: 'Consulter le tableau de bord',
    descriptionFr: 'Accès à la vue d’ensemble et aux indicateurs de la rédaction.',
  },
  view_articles: {
    fr: 'Consulter les articles',
    descriptionFr: 'Voir tous les brouillons, articles en attente et articles publiés.',
  },
  create_articles: {
    fr: 'Ajouter des articles',
    descriptionFr: 'Rédiger des brouillons bilingues et convertir les propositions externes.',
  },
  edit_own_articles: {
    fr: 'Modifier ses propres articles',
    descriptionFr: 'Éditer uniquement les brouillons créés par son propre compte.',
  },
  edit_all_articles: {
    fr: 'Modifier les articles de l’équipe',
    descriptionFr: 'Corriger les brouillons et textes en attente de toute l’équipe (hors articles publiés).',
  },
  delete_articles: {
    fr: 'Supprimer des brouillons',
    descriptionFr: 'Supprimer les articles non publiés (les articles publiés restent exclusifs au Fondateur).',
  },
  upload_media: {
    fr: 'Ajouter des images',
    descriptionFr: 'Téléverser des visuels éditoriaux dans Firebase Storage.',
  },
  manage_categories: {
    fr: 'Gérer les catégories',
    descriptionFr: 'Ajouter, renommer ou organiser les rubriques FR/AR.',
  },
  manage_comments: {
    fr: 'Modérer les remarques éditoriales',
    descriptionFr: 'Consulter et traiter les retours lecteurs et notes rédactionnelles.',
  },
  manage_journalists: {
    fr: 'Gérer les profils des journalistes',
    descriptionFr: 'Créer, modifier ou masquer les fiches publiques de l’équipe rédactionnelle.',
  },
  manage_site_settings: {
    fr: 'Modifier les paramètres du site',
    descriptionFr: 'Personnaliser le nom, logo, couleurs, menus, contact et mentions légales.',
  },
  manage_users: {
    fr: 'Gérer les comptes utilisateurs (Réservé Fondateur)',
    descriptionFr: 'Verrouillé au seul Fondateur par règle de sécurité Firebase.',
  },
  manage_breaking_news: {
    fr: 'Gérer le bandeau Dernière Minute',
    descriptionFr: 'Publier, ordonner, mettre en pause ou archiver les alertes urgentes.',
  },
  view_stats: {
    fr: 'Consulter les statistiques',
    descriptionFr: 'Accéder aux statistiques de lecture et d’activité éditoriale.',
  },
};

export function getCopy(lang: Language) {
  return UI_COPY[lang];
}
