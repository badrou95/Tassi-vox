import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCopy } from '../data/i18n';
import { PublicLayout } from '../components/PublicLayout';

interface InfoPageProps {
  mode: 'contact' | 'legal';
}

export const InfoPage: React.FC<InfoPageProps> = ({ mode }) => {
  const { language, effectiveSettings } = useApp();
  const copy = getCopy(language);

  if (mode === 'legal') {
    const legalText =
      language === 'ar' ? effectiveSettings.legalTextAr : effectiveSettings.legalTextFr;
    const paragraphs = legalText.split('\n').filter((p) => p.trim().length > 0);
    return (
      <PublicLayout pageTitle={copy.legalTitle}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-8">
          <header className="space-y-2 pb-6 border-b border-slate-200 dark:border-slate-800">
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white">
              {copy.legalTitle}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {effectiveSettings.mediaName}
            </p>
          </header>
          <div className="space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {paragraphs.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout pageTitle={copy.contactTitle} pageDescription={copy.contactSubtitle}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-10">
        <header className="space-y-2 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white">
            {copy.contactTitle}
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">{copy.contactSubtitle}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2">
            <Mail className="w-5 h-5" style={{ color: effectiveSettings.primaryColor }} />
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">
              {language === 'ar' ? 'البريد الإلكتروني' : 'E-mail rédactionnel'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 break-all">
              {effectiveSettings.contactEmail}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2">
            <Phone className="w-5 h-5" style={{ color: effectiveSettings.primaryColor }} />
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">
              {language === 'ar' ? 'الهاتف' : 'Téléphone'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 tabular-nums">
              {effectiveSettings.contactPhone}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2">
            <MapPin className="w-5 h-5" style={{ color: effectiveSettings.primaryColor }} />
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">
              {language === 'ar' ? 'المقر التحريري' : 'Bureaux'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {language === 'ar'
                ? effectiveSettings.contactAddressAr
                : effectiveSettings.contactAddressFr}
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
