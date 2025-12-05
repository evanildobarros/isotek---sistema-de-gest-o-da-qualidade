import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth components
import { Login, ProtectedRoute } from './components/auth';

// Layout components
import { DashboardLayout } from './components/layout';

// Landing Page
import { LandingPage } from './LandingPage';

// Section components (keep these eager loaded as they're frequently used)
import { SectionDashboard, SectionPerfil } from './components/sections';

// Lazy load page components for better performance
// Strategic
const SwotAnalysis = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.SwotAnalysis })));
const StakeholdersPage = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.StakeholdersPage })));
const ScopePage = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.ScopePage })));
const StrategicDefinitionPage = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.StrategicDefinitionPage })));
const LeadershipPage = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.LeadershipPage })));
const RiskMatrixPage = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.RiskMatrixPage })));
const QualityObjectivesPage = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.QualityObjectivesPage })));
const ActionPlansPage = lazy(() => import('./components/pages/strategic').then(m => ({ default: m.ActionPlansPage })));

// Execution
const DocumentsPage = lazy(() => import('./components/pages/execution').then(m => ({ default: m.DocumentsPage })));
const CompetenciesPage = lazy(() => import('./components/pages/execution').then(m => ({ default: m.CompetenciesPage })));
const SalesRequirementsPage = lazy(() => import('./components/pages/execution').then(m => ({ default: m.SalesRequirementsPage })));
const SuppliersPage = lazy(() => import('./components/pages/execution').then(m => ({ default: m.SuppliersPage })));
const ProductionControlPage = lazy(() => import('./components/pages/execution').then(m => ({ default: m.ProductionControlPage })));

// Improvement
const NonConformityPage = lazy(() => import('./components/pages/improvement').then(m => ({ default: m.NonConformityPage })));
const CorrectiveActionsPage = lazy(() => import('./components/pages/improvement').then(m => ({ default: m.CorrectiveActionsPage })));
const IndicatorsPage = lazy(() => import('./components/pages/improvement').then(m => ({ default: m.IndicatorsPage })));
const AuditsPage = lazy(() => import('./components/pages/improvement').then(m => ({ default: m.AuditsPage })));
const ManagementReviewPage = lazy(() => import('./components/pages/improvement').then(m => ({ default: m.ManagementReviewPage })));

// Settings
const UsersPage = lazy(() => import('./components/pages/settings').then(m => ({ default: m.UsersPage })));
const UnitsPage = lazy(() => import('./components/pages/settings').then(m => ({ default: m.UnitsPage })));
const CompanyProfilePage = lazy(() => import('./components/pages/settings').then(m => ({ default: m.CompanyProfilePage })));
const SuperAdminPage = lazy(() => import('./components/pages/settings').then(m => ({ default: m.SuperAdminPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#025159] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500">Carregando...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/super-admin" element={<SuperAdminPage />} />

            {/* Protected Routes */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<SectionDashboard />} />
                <Route path="perfil" element={<SectionPerfil />} />

                {/* Lazy loaded routes with Suspense */}
                <Route path="*" element={
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Grupo A: Estratégia (Plan) */}
                      <Route path="contexto-analise" element={<SwotAnalysis />} />
                      <Route path="definicao-estrategica" element={<StrategicDefinitionPage />} />
                      <Route path="partes-interessadas" element={<StakeholdersPage />} />
                      <Route path="processos-escopo" element={<ScopePage />} />

                      {/* Grupo A: Estratégia (Plan) - 5.0 Liderança */}
                      <Route path="politica-qualidade" element={<LeadershipPage />} />
                      <Route path="responsabilidades" element={<LeadershipPage />} />

                      {/* Grupo A: Estratégia (Plan) - 6.0 Planejamento */}
                      <Route path="matriz-riscos" element={<RiskMatrixPage />} />
                      <Route path="planos-de-acao" element={<ActionPlansPage />} />
                      <Route path="objetivos-qualidade" element={<QualityObjectivesPage />} />

                      {/* Grupo B: Execução (Do) */}
                      {/* 7.0 Apoio */}
                      <Route path="documentos" element={<DocumentsPage />} />
                      <Route path="treinamentos" element={<CompetenciesPage />} />

                      {/* 8.0 Operação */}
                      <Route path="comercial" element={<SalesRequirementsPage />} />
                      <Route path="fornecedores" element={<SuppliersPage />} />
                      <Route path="producao" element={<ProductionControlPage />} />
                      <Route path="saidas-nao-conformes" element={<NonConformityPage />} />

                      {/* Grupo C: Checagem (Check/Act) */}
                      {/* 9.0 Avaliação */}
                      <Route path="indicadores" element={<IndicatorsPage />} />
                      <Route path="auditorias" element={<AuditsPage />} />
                      <Route path="analise-critica" element={<ManagementReviewPage />} />

                      {/* 10.0 Melhoria */}
                      <Route path="acoes-corretivas" element={<CorrectiveActionsPage />} />
                      <Route path="nao-conformidades" element={<Navigate to="/app/acoes-corretivas" replace />} />

                      {/* Configurações */}
                      <Route path="usuarios" element={<UsersPage />} />
                      <Route path="unidades" element={<UnitsPage />} />
                      <Route path="configuracoes" element={<CompanyProfilePage />} />
                      <Route path="sistema" element={<Navigate to="/app/configuracoes" replace />} />

                      {/* Legacy Routes Redirects (Optional, or keep for compatibility) */}
                      <Route path="contexto" element={<Navigate to="/app/contexto-analise" replace />} />
                      <Route path="oportunidades" element={<Navigate to="/app/matriz-riscos" replace />} />
                      <Route path="sistema-infraestrutura" element={<Navigate to="/app/sistema" replace />} />
                      <Route path="sistema-recursos" element={<Navigate to="/app/sistema" replace />} />
                      <Route path="operacao-controle" element={<Navigate to="/app/producao" replace />} />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                } />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;