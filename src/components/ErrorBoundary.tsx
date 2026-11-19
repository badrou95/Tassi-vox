import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Erreur inattendue.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('TASSI-VOX ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = `Accès ou opération refusée (${parsed.operationType || 'firestore'} — ${parsed.path || ''}) : ${parsed.error}`;
        }
      } catch {
        // Keep raw message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090E1A] p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-bold">Sécurité ou erreur d’application</h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 break-words">
              {friendly}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/fr';
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--tv-primary)' }}
            >
              <RotateCcw className="w-4 h-4" />
              Revenir à l’accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
