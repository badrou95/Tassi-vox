import type {
  AdminUser,
  Article,
  BreakingNewsItem,
  Journalist,
  SiteSettings,
} from '../types';
import {
  CO_FOUNDER_EMAILS,
  FOUNDER_EMAIL,
  TECH_DIRECTOR_EMAIL,
  createCoFounderDefaultPermissions,
  createFounderPermissions,
  createTechDirectorDefaultPermissions,
  emailToDocId,
} from '../utils/permissions';

export const IMG_HERO_SUMMIT = '/src/assets/images/hero_diplomacy_summit_1795123058543.jpg';
export const IMG_CLEAN_ENERGY = '/src/assets/images/news_clean_energy_1795123058481.jpg';
export const IMG_MARITIME_TRADE = '/src/assets/images/news_tech_innovation_1795123058578.jpg';
export const IMG_CULTURE_GALLERY = '/src/assets/images/news_culture_heritage_1795123058192.jpg';
export const IMG_JOURNALIST_1 = '/src/assets/images/journalist_portrait_1_1795123058047.jpg';
export const IMG_JOURNALIST_2 = '/src/assets/images/journalist_portrait_2_1795123057641.jpg';
export const IMG_JOURNALIST_3 = '/src/assets/images/journalist_portrait_3_1795123057856.jpg';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  mediaName: 'TASSI-VOX',
  logoUrl: '',
  sloganFr: 'La voix indépendante de l’actualité internationale',
  sloganAr: 'الصوت المستقل للأخبار الدولية والتحليلات المعمقة',
  descriptionFr:
    'Média d’information internationale bilingue (français et arabe). Enquêtes de terrain, géopolitique, économie, transition énergétique et culture vérifiées par notre rédaction.',
  descriptionAr:
    'منصة إعلامية دولية ثنائية اللغة (الفرنسية والعربية). تحقيقات ميدانية، جيوسياسة، اقتصاد، انتقال طاقوي وثقافة بإشراف تحريري مستقل.',
  primaryColor: '#1D4ED8',
  secondaryColor: '#0B1220',
  accentColor: '#EA580C',
  breakingColor: '#DC2626',
  breakingBannerEnabled: true,
  heroTitleFr: 'L’information internationale, vérifiée et bilingue',
  heroTitleAr: 'الأخبار الدولية بدقة ومصداقية وباللغتين',
  heroSubtitleFr:
    'Décryptages géopolitiques, enquêtes économiques et reportages de terrain publiés en français et en arabe sous contrôle éditorial rigoureux.',
  heroSubtitleAr:
    'تحليلات جيوسياسية، تحقيقات اقتصادية وتقارير ميدانية تُنشر بالفرنسية والعربية وفق معايير تحريرية صارمة.',
  categories: [
    { id: 'geopolitique', nameFr: 'Géopolitique', nameAr: 'جيوسياسة', accentHex: '#1D4ED8' },
    { id: 'economie', nameFr: 'Économie & Énergie', nameAr: 'اقتصاد وطاقة', accentHex: '#0284C7' },
    { id: 'societe', nameFr: 'Société & Tech', nameAr: 'مجتمع وتكنولوجيا', accentHex: '#EA580C' },
    { id: 'culture', nameFr: 'Culture & Patrimoine', nameAr: 'ثقافة وتراث', accentHex: '#7C3AED' },
  ],
  navigation: [
    { id: 'home', path: '', labelFr: 'À la une', labelAr: 'الرئيسية' },
    { id: 'team', path: 'equipe', labelFr: 'Notre équipe', labelAr: 'هيئة التحرير' },
    { id: 'submit', path: 'soumettre', labelFr: 'Journalistes', labelAr: 'بوابة الصحفيين' },
    { id: 'contact', path: 'contact', labelFr: 'Contact', labelAr: 'اتصل بنا' },
  ],
  contactEmail: 'redaction@tassi-vox.media',
  contactPhone: '+213 21 00 42 18',
  contactAddressFr: 'Bureau Rédactionnel International — Alger & Paris',
  contactAddressAr: 'المكتب التحريري الدولي — الجزائر وباريس',
  socials: {
    x: 'https://x.com/tassivox',
    facebook: 'https://facebook.com/tassivox',
    instagram: 'https://instagram.com/tassivox',
    youtube: 'https://youtube.com/@tassivox',
    linkedin: 'https://linkedin.com/company/tassivox',
    website: 'https://tassi-vox.media',
  },
  footerTextFr:
    'TASSI-VOX est un média familial indépendant engagé pour un journalisme bilingue rigoureux, vérifié et accessible des deux rives de la Méditerranée.',
  footerTextAr:
    'تاسي-فوكس مؤسسة إعلامية مستقلة ملتزمة بصحافة ثنائية اللغة رصينة وموثوقة على ضفتي المتوسط.',
  legalTextFr:
    'Éditeur : Direction Fondatrice TASSI-VOX.\nDirecteur de la publication : Fondateur TASSI-VOX (tmerzak@gmail.com).\nHébergement : Infrastructure Cloud sécurisée.\nCharte éditoriale : Chaque article publié fait l’objet d’une vérification factuelle et d’une validation définitive exclusive par la direction fondatrice.\nDroits d’auteur : Toute reproduction partielle ou intégrale sans autorisation écrite est interdite.',
  legalTextAr:
    'الناشر: الإدارة المؤسِّسة لمنصة تاسي-فوكس.\nمدير النشر: مؤسس تاسي-فوكس (tmerzak@gmail.com).\nالاستضافة: بنية سحابية مؤمّنة.\nالميثاق التحريري: يخضع كل مقال منشور لتدقيق الوقائع والمصادقة النهائية الحصرية من طرف المؤسس.\nحقوق النشر: يمنع أي نسخ كلي أو جزئي دون إذن كتابي مسبق.',
  updatedByEmail: FOUNDER_EMAIL,
};

export const DEFAULT_BREAKING_NEWS: BreakingNewsItem[] = [
  {
    id: 'bn-summit-2026',
    textFr:
      'Sommet méditerranéen de l’énergie : accord historique sur l’interconnexion solaire entre les deux rives',
    textAr:
      'قمة الطاقة المتوسطية: توقيع اتفاق تاريخي حول الربط الكهربائي الشمسي بين ضفتي المتوسط',
    articleSlug: 'sommet-mediterraneen-interconnexion-energetique-2026',
    status: 'active',
    sortOrder: 1,
    durationSeconds: 32,
    expiresAt: '2026-12-31T23:59:59Z',
    createdByUid: 'seed-founder',
    createdByEmail: FOUNDER_EMAIL,
  },
  {
    id: 'bn-maritime-hub',
    textFr:
      'Corridors maritimes numériques : +18 % de flux logistiques enregistrés au troisième trimestre en Méditerranée',
    textAr:
      'الممرات البحرية الرقمية: ارتفاع بنسبة 18% في التدفقات اللوجستية خلال الربع الثالث بالمتوسط',
    articleSlug: 'ports-intelligents-mediterranee-mutation-logistique',
    status: 'active',
    sortOrder: 2,
    durationSeconds: 32,
    expiresAt: '2026-12-31T23:59:59Z',
    createdByUid: 'seed-founder',
    createdByEmail: FOUNDER_EMAIL,
  },
  {
    id: 'bn-solar-corridor',
    textFr:
      'Transition énergétique : le nouveau corridor solaire saharien franchit le cap des 4,2 gigawatts installés',
    textAr:
      'الانتقال الطاقوي: الممر الشمسي الصحراوي الجديد يتجاوز عتبة 4.2 غيغاواط من القدرة الإنتاجية',
    articleSlug: 'corridor-solaire-saharien-cap-4-gigawatts',
    status: 'active',
    sortOrder: 3,
    durationSeconds: 32,
    expiresAt: '2026-12-31T23:59:59Z',
    createdByUid: 'seed-founder',
    createdByEmail: FOUNDER_EMAIL,
  },
];

export const DEFAULT_JOURNALISTS: Journalist[] = [
  {
    id: 'karim-benali',
    fullNameFr: 'Karim Benali',
    fullNameAr: 'كريم بن علي',
    roleFr: 'Grand Reporter — Géopolitique & Diplomatie',
    roleAr: 'كبير المراسلين — الجيوسياسة والدبلوماسية',
    bioFr:
      'Spécialiste des relations euro-méditerranéennes et des sommets diplomatiques depuis plus de 18 ans.',
    bioAr:
      'متخصص في العلاقات الأورو-متوسطية والقمم الدبلوماسية الدولية لأكثر من 18 عاماً.',
    careerFr:
      'Diplômé en sciences politiques et relations internationales, Karim Benali a couvert les principales conférences diplomatiques à Genève, Bruxelles, Alger et Tunis. Il dirige les grandes enquêtes géopolitiques de TASSI-VOX.',
    careerAr:
      'حاصل على شهادة عليا في العلوم السياسية والعلاقات الدولية، غطى كريم بن علي أبرز المؤتمرات الدبلوماسية في جنيف وبروكسل والجزائر وتونس، ويشرف على التحقيقات الجيوسياسية الكبرى.',
    coverageAreasFr: ['Diplomatie', 'Méditerranée', 'Institutions internationales'],
    coverageAreasAr: ['الدبلوماسية', 'حوض المتوسط', 'المؤسسات الدولية'],
    photoUrl: IMG_JOURNALIST_1,
    socials: {
      x: 'https://x.com/kbenali_press',
      linkedin: 'https://linkedin.com/in/karim-benali-press',
    },
    ownerUid: '',
    isVisible: true,
  },
  {
    id: 'nadia-mansouri',
    fullNameFr: 'Nadia Mansouri',
    fullNameAr: 'نادية منصوري',
    roleFr: 'Journaliste Économique & Transition Énergétique',
    roleAr: 'صحفية اقتصادية ومختصة في الانتقال الطاقوي',
    bioFr:
      'Analyste des marchés énergétiques, des infrastructures portuaires et des politiques industrielles vertes.',
    bioAr:
      'محللة لأسواق الطاقة والبنى التحتية المينائية والسياسات الصناعية الخضراء في شمال إفريقيا وأوروبا.',
    careerFr:
      'Ancienne correspondante économique pour la presse financière internationale, Nadia Mansouri décrypte les investissements renouvelables, la logistique maritime et l’innovation industrielle dans le bassin méditerranéen.',
    careerAr:
      'مراسلة اقتصادية سابقة لعدد من المنابر المالية الدولية، تتابع نادية منصوري استثمارات الطاقات المتجددة واللوجستيك البحري والابتكار الصناعي.',
    coverageAreasFr: ['Énergie solaire', 'Économie maritime', 'Finance verte'],
    coverageAreasAr: ['الطاقة الشمسية', 'الاقتصاد البحري', 'التمويل الأخضر'],
    photoUrl: IMG_JOURNALIST_2,
    socials: {
      x: 'https://x.com/nmansouri_eco',
      linkedin: 'https://linkedin.com/in/nadia-mansouri-eco',
    },
    ownerUid: '',
    isVisible: true,
  },
  {
    id: 'youssef-haddad',
    fullNameFr: 'Youssef Haddad',
    fullNameAr: 'يوسف حداد',
    roleFr: 'Correspondant Culture, Architecture & Société',
    roleAr: 'مراسل الثقافة والعمارة وقضايا المجتمع',
    bioFr:
      'Chroniqueur dédié aux musées contemporains, au patrimoine architectural et aux mutations numériques.',
    bioAr:
      'كاتب ومراسل متخصص في المتاحف المعاصرة والتراث المعماري والتحولات الرقمية المعاصرة.',
    careerFr:
      'Essayiste et journaliste culturel bilingue, Youssef Haddad explore les passerelles artistiques entre le Maghreb et l’Europe, les nouvelles scènes architecturales et les transformations culturelles de la jeunesse.',
    careerAr:
      'كاتب وصحفي ثقافي ثنائي اللغة، يستكشف يوسف حداد الجسور الفنية بين المغرب العربي وأوروبا والمشهد المعماري المعاصر وتحولات المجتمع.',
    coverageAreasFr: ['Culture', 'Architecture', 'Patrimoine', 'Société numérique'],
    coverageAreasAr: ['الثقافة', 'العمارة', 'التراث', 'المجتمع الرقمي'],
    photoUrl: IMG_JOURNALIST_3,
    socials: {
      x: 'https://x.com/yhaddad_culture',
      website: 'https://tassi-vox.media',
    },
    ownerUid: '',
    isVisible: true,
  },
];

export const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'art-summit-2026',
    slug: 'sommet-mediterraneen-interconnexion-energetique-2026',
    categoryId: 'geopolitique',
    authorId: 'karim-benali',
    status: 'published',
    isFeatured: true,
    fr: {
      title: 'Sommet méditerranéen : un pacte stratégique redessine l’équilibre énergétique entre les deux rives',
      subtitle: 'Douze délégations scellent un cadre commun de coopération électrique, industrielle et diplomatique à l’horizon 2035.',
      summary:
        'Réunis pour un sommet exceptionnel, les chefs de délégations du bassin méditerranéen ont adopté une feuille de route commune combinant câbles sous-marins haute tension, souveraineté énergétique et financements croisés.',
      content:
        'Les discussions auront duré plus de quarante-huit heures à huis clos avant d’aboutir à un texte salué comme un tournant diplomatique majeur. Face aux tensions persistantes sur les chaînes d’approvisionnement mondiales, douze États riverains ont entériné la création d’un corridor d’interconnexion électrique capable d’acheminer l’électricité propre produite au Sud vers les grands pôles industriels européens.\n\nAu-delà de la dimension technique, l’accord consacre un changement de doctrine : il ne s’agit plus d’une relation asymétrique d’exportation brute, mais d’un partenariat industriel partagé incluant transfert technologique, usines locales de composants photovoltaïques et formation d’ingénieurs sur les deux rives.\n\nSelon les documents consultés par TASSI-VOX, une première tranche de 6,8 milliards d’euros sera mobilisée dès le premier semestre 2027 pour moderniser les postes de transformation côtiers et sécuriser les tracés sous-marins. Les analystes soulignent toutefois que la réussite du pacte dépendra de la gouvernance partagée et de la stabilité réglementaire dans la durée.',
      coverImageUrl: IMG_HERO_SUMMIT,
      coverCaption: 'Séance plénière du Sommet méditerranéen de la coopération stratégique et énergétique.',
      ready: true,
    },
    ar: {
      title: 'القمة المتوسطية: ميثاق استراتيجي يعيد رسم التوازن الطاقوي بين ضفتي المتوسط',
      subtitle: 'اثنا عشر وفداً يوقّعون إطاراً مشتركاً للتعاون الكهربائي والصناعي والدبلوماسي في أفق 2035.',
      summary:
        'اعتمدت الوفود المشاركة في القمة المتوسطية خارطة طريق طموحة تجمع بين الكوابل البحرية عالية التوتر والسيادة الطاقوية والتمويل المشترك للبنى التحتية.',
      content:
        'استمرت المشاورات لأكثر من ثمانٍ وأربعين ساعة خلف أبواب مغلقة قبل الإعلان عن وثيقة وُصفت بالمنعطف الدبلوماسي الأبرز خلال العقد الأخير. وأمام التحديات المتسارعة في سلاسل الإمداد العالمية، اتفقت اثنتا عشرة دولة متوسطية على إنشاء ممر للربط الكهربائي ينقل الطاقة النظيفة المنتجة في الجنوب نحو الأقطاب الصناعية الكبرى.\n\nوإلى جانب البعد التقني، يكرّس الاتفاق تحولاً في فلسفة الشراكة: فلم تعد العلاقة قائمة على التصدير الخام، بل على تعاون صناعي متكامل يشمل نقل التكنولوجيا، وتوطين مصانع الألواح الشمسية، وتكوين الكفاءات الهندسية على الضفتين.\n\nووفق وثائق اطلعت عليها «تاسي-فوكس»، سيتم رصد شطر أول بقيمة 6.8 مليار يورو مطلع عام 2027 لتحديث محطات التحويل الساحلية وتأمين المسارات البحرية، فيما يؤكد الخبراء أن نجاح الميثاق يظل رهيناً بالحوكمة المشتركة واستقرار الأطر التنظيمية.',
      coverImageUrl: IMG_HERO_SUMMIT,
      coverCaption: 'الجلسة العامة للقمة المتوسطية للتعاون الاستراتيجي والطاقوي.',
      ready: true,
    },
    reviewNotes: 'Validé pour publication à la une (éditions FR & AR).',
    createdByUid: 'seed-tech',
    createdByEmail: TECH_DIRECTOR_EMAIL,
    approvedByEmail: FOUNDER_EMAIL,
    approvedAt: '2026-11-18T10:15:00Z',
    publishedAt: '2026-11-18T10:30:00Z',
    viewsCount: 4820,
  },
  {
    id: 'art-solar-corridor',
    slug: 'corridor-solaire-saharien-cap-4-gigawatts',
    categoryId: 'economie',
    authorId: 'nadia-mansouri',
    status: 'published',
    isFeatured: false,
    fr: {
      title: 'Corridor solaire saharien : comment les nouvelles centrales hybrides changent la donne industrielle',
      subtitle: 'Couplées au stockage thermique et à l’éolien de plateau, les nouvelles installations atteignent une disponibilité record.',
      summary:
        'En franchissant le cap des 4,2 gigawatts opérationnels, les parcs hybrides solaire-éolien du Sud redéfinissent le coût marginal de l’électricité pour l’industrie lourde et le dessalement.',
      content:
        'Sur les hauts plateaux arides, l’alignement millimétré des miroirs cylindro-paraboliques témoigne d’une accélération sans précédent. En moins de trente-six mois, la combinaison du solaire à concentration et de turbines éoliennes de dernière génération a permis de lisser l’intermittence qui freinait jadis l’adoption industrielle.\n\nLes opérateurs interrogés par notre rédaction confirment une baisse de 27 % du coût du mégawattheure comparé aux projets mis en service en 2021. Cette compétitivité attire déjà des unités de dessalement d’eau de mer et des fonderies bas-carbone cherchant une alimentation stable jour et nuit.\n\nReste un défi central : la maintenance prédictive en milieu désertique et le déploiement de réseaux de transport haute tension capables d’absorber ces pics de production sans perte thermique.',
      coverImageUrl: IMG_CLEAN_ENERGY,
      coverCaption: 'Parc hybride solaire et éolien sur les plateaux méridionaux au lever du jour.',
      ready: true,
    },
    ar: {
      title: 'الممر الشمسي الصحراوي: كيف تغيّر المحطات الهجينة الجديدة المعادلة الصناعية',
      subtitle: 'بفضل الجمع بين التخزين الحراري وطاقة الرياح، تحقق المنشآت الجديدة مستويات جاهزية قياسية.',
      summary:
        'مع تجاوز عتبة 4.2 غيغاواط قيد التشغيل، تعيد الحقول الهجينة للشمس والرياح رسم كلفة الكهرباء للصناعات الثقيلة ومحطات تحلية المياه.',
      content:
        'على امتداد الهضاب المشمسة، تعكس صفوف المرايا الشمسية وتوربينات الرياح تسارعاً غير مسبوق في مشاريع الطاقة النظيفة. ففي أقل من ثلاث سنوات، أتاح دمج الطاقة الشمسية المركّزة مع التخزين الحراري تجاوز معضلة التقطع التي كانت تحدّ من الاعتماد الصناعي عليها.\n\nوأكد مشغّلون في تصريحات لـ«تاسي-فوكس» انخفاض كلفة الميغاواط الساعي بنسبة 27% مقارنة بمشاريع عام 2021، ما جعل هذه الأقطاب الطاقوية وجهة جذابة لوحدات تحلية مياه البحر والصناعات منخفضة الكربون.\n\nويبقى التحدي المحوري متمثلاً في الصيانة التنبؤية داخل البيئات الصحراوية وتوسيع شبكات النقل ذات الجهد العالي لاستيعاب فائض الإنتاج بكفاءة عالية.',
      coverImageUrl: IMG_CLEAN_ENERGY,
      coverCaption: 'محطة هجينة للطاقة الشمسية وطاقة الرياح في الهضاب الجنوبية عند الشروق.',
      ready: true,
    },
    reviewNotes: '',
    createdByUid: 'seed-tech',
    createdByEmail: TECH_DIRECTOR_EMAIL,
    approvedByEmail: FOUNDER_EMAIL,
    approvedAt: '2026-11-17T14:00:00Z',
    publishedAt: '2026-11-17T14:20:00Z',
    viewsCount: 3190,
  },
  {
    id: 'art-maritime-ports',
    slug: 'ports-intelligents-mediterranee-mutation-logistique',
    categoryId: 'societe',
    authorId: 'nadia-mansouri',
    status: 'published',
    isFeatured: false,
    fr: {
      title: 'Ports intelligents : la révolution numérique qui accélère le commerce maritime méditerranéen',
      subtitle: 'Jumeaux numériques, douanes dématérialisées et électrification à quai transforment la cadence des terminaux.',
      summary:
        'Les grands terminaux à conteneurs de la rive sud et nord déploient des plateformes temps réel réduisant de près d’un tiers le temps d’attente des navires.',
      content:
        'À la tombée du soir, le ballet silencieux des portiques automatisés illustre la profonde transformation des infrastructures portuaires. Longtemps pénalisés par la congestion documentaire, plusieurs ports stratégiques ont adopté un guichet numérique unifié interconnectant armateurs, transitaires et administrations douanières.\n\nLes résultats mesurés sur les trois derniers trimestres sont éloquents : le temps moyen d’escale a reculé de 31 % et le volume traité a progressé de 18 %. Parallèlement, l’électrification des quais permet aux porte-conteneurs de couper leurs moteurs auxiliaires durant le déchargement, réduisant sensiblement les émissions urbaines.\n\nPour les économies régionales, cette fluidité logistique devient un levier direct d’attractivité industrielle et d’exportation agricole à haute valeur ajoutée.',
      coverImageUrl: IMG_MARITIME_TRADE,
      coverCaption: 'Terminal maritime à conteneurs équipé de systèmes de gestion logistique en temps réel.',
      ready: true,
    },
    ar: {
      title: 'الموانئ الذكية: الثورة الرقمية التي تسرّع وتيرة التجارة البحرية في المتوسط',
      subtitle: 'التوائم الرقمية والجمارك الإلكترونية وكهربة الأرصفة تعيد تشكيل أداء المحطات البحرية.',
      summary:
        'تعتمد محطات الحاويات الكبرى منصات بيانات فورية ساهمت في تقليص مدة انتظار السفن بنحو الثلث ورفع حجم المبادلات.',
      content:
        'مع حلول المساء، يكشف إيقاع الرافعات الحديثة عن تحول عميق في البنية التحتية المينائية. فبعد سنوات من بطء الإجراءات الورقية، اعتمدت عدة موانئ استراتيجية شباكاً رقمياً موحداً يربط بين شركات الشحن والعبور وإدارات الجمارك.\n\nوتشير البيانات المسجلة خلال الفصول الثلاثة الأخيرة إلى تراجع متوسط مدة توقف السفن بنسبة 31% وارتفاع حجم الشحنات المعالجة بنسبة 18%. وبالتوازي، يتيح تزويد الأرصفة بالكهرباء للسفن إطفاء محركاتها المساعدة أثناء التفريغ، ما يقلل الانبعاثات داخل المدن الساحلية.\n\nويرى اقتصاديون أن هذه المرونة اللوجستية تشكل رافعة حقيقية لتنافسية الصادرات الصناعية والزراعية الإقليمية.',
      coverImageUrl: IMG_MARITIME_TRADE,
      coverCaption: 'محطة حاويات بحرية مجهزة بأنظمة التتبع واللوجستيك الذكي.',
      ready: true,
    },
    reviewNotes: '',
    createdByUid: 'seed-cofounder',
    createdByEmail: CO_FOUNDER_EMAILS[0],
    approvedByEmail: FOUNDER_EMAIL,
    approvedAt: '2026-11-16T09:10:00Z',
    publishedAt: '2026-11-16T09:30:00Z',
    viewsCount: 2740,
  },
  {
    id: 'art-culture-museums',
    slug: 'renaissance-architecturale-musees-contemporains-mediterranee',
    categoryId: 'culture',
    authorId: 'youssef-haddad',
    status: 'published',
    isFeatured: false,
    fr: {
      title: 'Architecture et mémoire : la renaissance des musées contemporains sur les deux rives',
      subtitle: 'De nouveaux espaces dialoguent entre pierre taillée traditionnelle, lumière naturelle et créations contemporaines.',
      summary:
        'Une nouvelle génération d’architectes réinvente l’institution muséale en mariant savoir-faire vernaculaires, sobriété climatique et programmation internationale.',
      content:
        'Sous les hautes voûtes de pierre claire, la lumière zénithale sculpte le sol sans recourir à une climatisation énergivore. Partout autour du bassin méditerranéen, une vague de rénovations et d’ouvertures muséales affirme un langage architectural ancré dans son territoire tout en parlant au monde.\n\nLes conservateurs privilégient désormais des parcours ouverts mêlant tapisseries patrimoniales, sculptures de verre et installations numériques. La fréquentation des moins de trente ans a bondi de 42 % sur un an dans les établissements ayant adopté une médiation bilingue et des ateliers ouverts.\n\nPlus que de simples vitrines, ces lieux s’imposent comme des forums civiques où se réinvente la mémoire collective contemporaine.',
      coverImageUrl: IMG_CULTURE_GALLERY,
      coverCaption: 'Galerie contemporaine alliant arches de pierre calcaire et installations artistiques.',
      ready: true,
    },
    ar: {
      title: 'العمارة والذاكرة: نهضة المتاحف المعاصرة على ضفتي المتوسط',
      subtitle: 'فضاءات ثقافية جديدة تجمع بين الحجر التقليدي والضوء الطبيعي والإبداع الفني المعاصر.',
      summary:
        'يعيد جيل جديد من المعماريين ابتكار الفضاء المتحفي عبر المزج بين الحرفية التراثية والاستدامة المناخية والبرمجة الدولية.',
      content:
        'تحت الأقواس الحجرية الشاهقة، ينسج الضوء الطبيعي لوحات هندسية متجددة مع الحفاظ على اعتدال الحرارة داخلياً دون استهلاك مفرط للطاقة. وفي مختلف مدن المتوسط، تبرز موجة جديدة من المتاحف التي تتبنى لغة معمارية متجذرة في هويتها ومنفتحة على العالم.\n\nويحرص القيّمون الفنيون على بناء مسارات عرض تجمع بين المنسوجات التراثية والمنحوتات الزجاجية والأعمال الرقمية، ما ساهم في ارتفاع إقبال الشباب دون الثلاثين بنسبة 42% خلال عام واحد.\n\nوهكذا تتحول هذه الفضاءات من مجرد قاعات عرض إلى منتديات ثقافية حيّة تعيد صياغة الذاكرة الجماعية المعاصرة.',
      coverImageUrl: IMG_CULTURE_GALLERY,
      coverCaption: 'قاعة عرض معاصرة تجمع بين الأقواس الحجرية والأعمال الفنية الحديثة.',
      ready: true,
    },
    reviewNotes: '',
    createdByUid: 'seed-cofounder-2',
    createdByEmail: CO_FOUNDER_EMAILS[1],
    approvedByEmail: FOUNDER_EMAIL,
    approvedAt: '2026-11-15T16:40:00Z',
    publishedAt: '2026-11-15T17:00:00Z',
    viewsCount: 2150,
  },
  {
    id: 'art-pending-water-innovation',
    slug: 'technologies-dessalement-bas-carbone-maghreb',
    categoryId: 'economie',
    authorId: 'karim-benali',
    status: 'pending_review',
    isFeatured: false,
    fr: {
      title: 'Dessalement bas-carbone : les nouvelles stations côtières alimentées par le solaire',
      subtitle: 'En attente de validation définitive du Fondateur avant mise en ligne.',
      summary:
        'Une enquête de terrain sur l’intégration de membranes haute efficacité et de parcs photovoltaïques dédiés pour sécuriser l’eau potable.',
      content:
        'Cet article est prêt pour la relecture finale de la direction fondatrice. Il détaille les avancées technologiques en osmose inverse basse pression et leur impact sur la résilience hydrique des grandes métropoles côtières.',
      coverImageUrl: IMG_CLEAN_ENERGY,
      coverCaption: 'Infrastructure côtière couplée au solaire.',
      ready: true,
    },
    ar: {
      title: 'تحلية المياه منخفضة الكربون: المحطات الساحلية الجديدة المعتمدة على الطاقة الشمسية',
      subtitle: 'بانتظار المصادقة النهائية من المؤسس قبل النشر الرسمي.',
      summary:
        'تحقيق ميداني حول دمج الأغشية عالية الكفاءة والحقول الشمسية المخصصة لتأمين المياه الصالحة للشرب.',
      content:
        'هذا المقال جاهز للمراجعة النهائية من قبل المؤسس. يتناول التطورات التقنية في التناضح العكسي منخفض الضغط وأثرها في تعزيز الأمن المائي للمدن الساحلية.',
      coverImageUrl: IMG_CLEAN_ENERGY,
      coverCaption: 'بنية ساحلية لتحلية المياه تعمل بالطاقة الشمسية.',
      ready: true,
    },
    reviewNotes: 'Soumis par le Directeur technique pour approbation finale du Fondateur.',
    createdByUid: 'seed-tech',
    createdByEmail: TECH_DIRECTOR_EMAIL,
    approvedByEmail: '',
    approvedAt: '',
    publishedAt: '',
    viewsCount: 0,
  },
];

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: emailToDocId(FOUNDER_EMAIL),
    email: FOUNDER_EMAIL,
    displayName: 'Fondateur TASSI-VOX',
    familyRelation: 'Fondateur (Père) — Propriétaire protégé',
    role: 'founder',
    isActive: true,
    isProtectedOwner: true,
    permissions: createFounderPermissions(),
    updatedByEmail: FOUNDER_EMAIL,
  },
  {
    id: emailToDocId(TECH_DIRECTOR_EMAIL),
    email: TECH_DIRECTOR_EMAIL,
    displayName: 'Directeur Technique',
    familyRelation: 'Administrateur technique & gestion du site',
    role: 'tech_director',
    isActive: true,
    isProtectedOwner: false,
    permissions: createTechDirectorDefaultPermissions(),
    updatedByEmail: FOUNDER_EMAIL,
  },
  {
    id: emailToDocId(CO_FOUNDER_EMAILS[0]),
    email: CO_FOUNDER_EMAILS[0],
    displayName: 'Co-fondateur (Tigrine)',
    familyRelation: 'Membre familial — Co-fondateur',
    role: 'co_founder',
    isActive: true,
    isProtectedOwner: false,
    permissions: createCoFounderDefaultPermissions(),
    updatedByEmail: FOUNDER_EMAIL,
  },
  {
    id: emailToDocId(CO_FOUNDER_EMAILS[1]),
    email: CO_FOUNDER_EMAILS[1],
    displayName: 'Co-fondatrice (Melissa Lyna)',
    familyRelation: 'Membre familial — Co-fondatrice',
    role: 'co_founder',
    isActive: true,
    isProtectedOwner: false,
    permissions: createCoFounderDefaultPermissions(),
    updatedByEmail: FOUNDER_EMAIL,
  },
];
