import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuditorProvider, useAuditor } from './contexts/AuditorContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Auth components (Eager load login helps UX)
import { Login, ProtectedRoute } from './components/auth';

// Layout components
import { DashboardLayout } from './components/layout';

// Landing Page
import { LandingPage } from './LandingPage';

// Lazy Loaded Components

// Section components
const SectionDashboard = React.lazy(() => import('./components/sections/SectionDashboard').then(m => ({ default: m.SectionDashboard })));
const SectionPerfil = React.lazy(() => import('./components/sections/SectionPerfil').then(m => ({ default: m.SectionPerfil })));

// Page components - Auditor
const AuditorPortal = React.lazy(() => import('./components/pages/auditor/AuditorPortal').then(m => ({ default: m.AuditorPortal })));
const AuditorWalletPage = React.lazy(() => import('./components/pages/auditor/AuditorWalletPage').then(m => ({ default: m.AuditorWalletPage })));

// Page components - Strategic
const SwotAnalysis = React.lazy(() => import('./components/pages/strategic/SwotAnalysis').then(m => ({ default: m.SwotAnalysis })));
const StakeholdersPage = React.lazy(() => import('./components/pages/strategic/StakeholdersPage').then(m => ({ default: m.StakeholdersPage })));
const ScopePage = React.lazy(() => import('./components/pages/strategic/ScopePage').then(m => ({ default: m.ScopePage })));
const StrategicDefinitionPage = React.lazy(() => import('./components/pages/strategic/StrategicDefinitionPage').then(m => ({ default: m.StrategicDefinitionPage })));
const LeadershipPage = React.lazy(() => import('./components/pages/strategic/LeadershipPage').then(m => ({ default: m.LeadershipPage })));
const RiskMatrixPage = React.lazy(() => import('./components/pages/strategic/RiskMatrixPage').then(m => ({ default: m.RiskMatrixPage })));
const QualityObjectivesPage = React.lazy(() => import('./components/pages/strategic/QualityObjectivesPage').then(m => ({ default: m.QualityObjectivesPage })));
const ActionPlansPage = React.lazy(() => import('./components/pages/strategic/ActionPlansPage').then(m => ({ default: m.ActionPlansPage })));

// Page components - Execution
const DocumentsPage = React.lazy(() => import('./components/pages/execution/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const CompetenciesPage = React.lazy(() => import('./components/pages/execution/CompetenciesPage').then(m => ({ default: m.CompetenciesPage })));
const SalesRequirementsPage = React.lazy(() => import('./components/pages/execution/SalesRequirementsPage').then(m => ({ default: m.SalesRequirementsPage })));
const SuppliersPage = React.lazy(() => import('./components/pages/execution/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const ProductionControlPage = React.lazy(() => import('./components/pages/execution/ProductionControlPage').then(m => ({ default: m.ProductionControlPage })));
const DocumentationPage = React.lazy(() => import('./components/pages/settings/DocumentationPage').then(m => ({ default: m.DocumentationPage }))); // Moved from execution/settings index mix

// Page components - Improvement
const NonConformityPage = React.lazy(() => import('./components/pages/improvement/NonConformityPage').then(m => ({ default: m.NonConformityPage })));
const CorrectiveActionsPage = React.lazy(() => import('./components/pages/improvement/CorrectiveActionsPage').then(m => ({ default: m.CorrectiveActionsPage })));
const IndicatorsPage = React.lazy(() => import('./components/pages/improvement/IndicatorsPage').then(m => ({ default: m.IndicatorsPage })));
const AuditsPage = React.lazy(() => import('./components/pages/improvement/AuditsPage').then(m => ({ default: m.AuditsPage })));
const ManagementReviewPage = React.lazy(() => import('./components/pages/improvement/ManagementReviewPage').then(m => ({ default: m.ManagementReviewPage })));
const ExternalAuditsPage = React.lazy(() => import('./components/pages/improvement/ExternalAuditsPage').then(m => ({ default: m.ExternalAuditsPage })));
const ExternalAuditDetailsPage = React.lazy(() => import('./components/pages/improvement/ExternalAuditDetailsPage').then(m => ({ default: m.ExternalAuditDetailsPage })));
const CompanyFindingsResponsePage = React.lazy(() => import('./components/pages/improvement/CompanyFindingsResponsePage').then(m => ({ default: m.CompanyFindingsResponsePage })));

// Page components - Settings
const UsersPage = React.lazy(() => import('./components/pages/settings/UsersPage').then(m => ({ default: m.UsersPage })));
const UnitsPage = React.lazy(() => import('./components/pages/settings/UnitsPage').then(m => ({ default: m.UnitsPage })));
const CompanyProfilePage = React.lazy(() => import('./components/pages/settings/CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })));
const SuperAdminPage = React.lazy(() => import('./components/pages/settings/SuperAdminPage').then(m => ({ default: m.SuperAdminPage })));
const SupportPage = React.lazy(() => import('./components/pages/settings/SupportPage').then(m => ({ default: m.SupportPage })));
const AuditAssignmentsPage = React.lazy(() => import('./components/pages/settings/AuditAssignmentsPage').then(m => ({ default: m.AuditAssignmentsPage })));

const DynamicToaster: React.FC = () => {
  const { isAuditorMode } = useAuditor();
  const offset = isAuditorMode ? 160 : 112;

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      offset={offset}
      toastOptions={{
        style: {
          marginTop: '0px',
          marginLeft: '304px',
        },
      }}
    />
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuditorProvider>
          <ThemeProvider>
            <DynamicToaster />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/super-admin" element={<SuperAdminPage />} />

                {/* Auditor Portal - Redirect to new route inside DashboardLayout */}
                <Route path="/auditor-portal" element={<Navigate to="/app/auditor-portal" replace />} />

                {/* Protected Routes */}
                <Route path="/app" element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="dashboard" element={<SectionDashboard />} />
                    <Route path="auditor-portal" element={<AuditorPortal />} />
                    <Route path="minha-carteira" element={<AuditorWalletPage />} />
                    <Route path="perfil" element={<SectionPerfil />} />

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
                    <Route path="auditorias-externas" element={<ExternalAuditsPage />} />
                    <Route path="auditorias-externas/:id" element={<ExternalAuditDetailsPage />} />
                    <Route path="apontamentos-auditoria" element={<CompanyFindingsResponsePage />} />
                    <Route path="analise-critica" element={<ManagementReviewPage />} />

                    {/* 10.0 Melhoria */}
                    <Route path="acoes-corretivas" element={<CorrectiveActionsPage />} />
                    <Route path="nao-conformidades" element={<Navigate to="/app/acoes-corretivas" replace />} />

                    {/* Configurações */}
                    <Route path="usuarios" element={<UsersPage />} />
                    <Route path="unidades" element={<UnitsPage />} />
                    <Route path="auditores" element={<AuditAssignmentsPage />} />
                    <Route path="ajuda" element={<DocumentationPage />} />
                    <Route path="configuracoes" element={<CompanyProfilePage />} />
                    <Route path="suporte" element={<SupportPage />} />
                    <Route path="sistema" element={<Navigate to="/app/configuracoes" replace />} />

                    {/* Legacy Routes Redirects */}
                    <Route path="contexto" element={<Navigate to="/app/contexto-analise" replace />} />
                    <Route path="oportunidades" element={<Navigate to="/app/matriz-riscos" replace />} />
                    <Route path="sistema-infraestrutura" element={<Navigate to="/app/sistema" replace />} />
                    <Route path="sistema-recursos" element={<Navigate to="/app/sistema" replace />} />
                    <Route path="operacao-controle" element={<Navigate to="/app/producao" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ThemeProvider>
        </AuditorProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;