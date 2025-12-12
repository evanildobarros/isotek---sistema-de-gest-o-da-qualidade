import React from 'react';
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

// Section components
import { SectionDashboard, SectionPerfil } from './components/sections';

// Page components - Strategic
import {
  SwotAnalysis,
  StakeholdersPage,
  ScopePage,
  StrategicDefinitionPage,
  LeadershipPage,
  RiskMatrixPage,
  QualityObjectivesPage,
  ActionPlansPage
} from './components/pages/strategic';

// Page components - Execution
import {
  DocumentsPage,
  CompetenciesPage,
  SalesRequirementsPage,
  SuppliersPage,
  ProductionControlPage,
  DocumentationPage
} from './components/pages';

// Page components - Improvement
import {
  NonConformityPage,
  CorrectiveActionsPage,
  IndicatorsPage,
  AuditsPage,
  ManagementReviewPage
} from './components/pages/improvement';

// Page components - Settings
import {
  UsersPage,
  UnitsPage,
  CompanyProfilePage,
  SuperAdminPage,
  SupportPage
} from './components/pages/settings';

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
                <Route path="ajuda" element={<DocumentationPage />} />
                <Route path="configuracoes" element={<CompanyProfilePage />} />
                <Route path="suporte" element={<SupportPage />} />
                <Route path="sistema" element={<Navigate to="/app/configuracoes" replace />} />

                {/* Legacy Routes Redirects (Optional, or keep for compatibility) */}
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
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;