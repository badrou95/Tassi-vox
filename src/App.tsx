import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { extractLanguageFromPath } from './utils/routing';
import { HomePage } from './pages/HomePage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { TeamPage } from './pages/TeamPage';
import { JournalistProfilePage } from './pages/JournalistProfilePage';
import { SubmissionPortalPage } from './pages/SubmissionPortalPage';
import { InfoPage } from './pages/InfoPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const LocaleSync: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage } = useApp();

  useEffect(() => {
    const pathLang = extractLanguageFromPath(location.pathname);
    if (pathLang && pathLang !== language) {
      setLanguage(pathLang);
    }
  }, [location.pathname, language, setLanguage]);

  return null;
};

const RootRedirect: React.FC = () => {
  const { language } = useApp();
  return <Navigate to={`/${language}`} replace />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <LocaleSync />
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* French Routes (/fr/...) */}
            <Route path="/fr" element={<HomePage />} />
            <Route path="/fr/article/:slug" element={<ArticleDetailPage />} />
            <Route path="/fr/equipe" element={<TeamPage />} />
            <Route path="/fr/equipe/:id" element={<JournalistProfilePage />} />
            <Route path="/fr/soumettre" element={<SubmissionPortalPage />} />
            <Route path="/fr/contact" element={<InfoPage mode="contact" />} />
            <Route path="/fr/mentions-legales" element={<InfoPage mode="legal" />} />

            {/* Arabic RTL Routes (/ar/...) */}
            <Route path="/ar" element={<HomePage />} />
            <Route path="/ar/article/:slug" element={<ArticleDetailPage />} />
            <Route path="/ar/equipe" element={<TeamPage />} />
            <Route path="/ar/equipe/:id" element={<JournalistProfilePage />} />
            <Route path="/ar/soumettre" element={<SubmissionPortalPage />} />
            <Route path="/ar/contact" element={<InfoPage mode="contact" />} />
            <Route path="/ar/mentions-legales" element={<InfoPage mode="legal" />} />

            {/* Strictly Private Family Admin Panel */}
            <Route path="/admin" element={<AdminDashboardPage />} />

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
