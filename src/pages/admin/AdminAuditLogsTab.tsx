import React from 'react';
import { Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/i18n';
import { formatEditorialDate } from '../../utils/routing';

export const AdminAuditLogsTab: React.FC = () => {
  const { auditLogs, effectiveSettings } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-2xl font-bold text-slate-950 dark:text-white">
          Journal d’audit immuable
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Historique infalsifiable des approbations, publications, modifications de permissions et
          changements de paramètres (lecture seule, suppression interdite par Firestore Rules).
        </p>
      </div>

      {auditLogs.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
          Aucune action journalisée dans Firestore pour le moment. Chaque action effectuée depuis ce
          panneau est automatiquement enregistrée ici.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                  <th className="py-3 px-4 text-start">Action</th>
                  <th className="py-3 px-4 text-start">Détails</th>
                  <th className="py-3 px-4 text-start">Acteur</th>
                  <th className="py-3 px-4 text-end">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono text-xs font-semibold whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ color: effectiveSettings.primaryColor }}
                      >
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.actorEmail}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ROLE_LABELS[log.actorRole]?.fr || log.actorRole}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 text-end tabular-nums whitespace-nowrap">
                      {formatEditorialDate(log.createdAt, 'fr') || 'À l’instant'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
