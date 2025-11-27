import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SectionDashboard } from './components/SectionDashboard';
import { SectionMelhoria } from './components/SectionMelhoria';
import { SectionPerfil } from './components/SectionPerfil';
import { SwotAnalysis } from './components/SwotAnalysis';

import { SectionPlaceholder } from './components/SectionPlaceholder';
import { UsersPage } from './components/UsersPage';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DocumentsPage } from './components/DocumentsPage';
import { AuditsPage } from './components/AuditsPage';
import { UnitsPage } from './components/UnitsPage';
import { StrategicDefinitionPage } from './components/StrategicDefinitionPage';
import { RiskMatrixPage } from './components/RiskMatrixPage';
import { StakeholdersPage } from './components/StakeholdersPage';
import { ScopePage } from './components/ScopePage';
import { SuperAdminPage } from './components/SuperAdminPage';
import { LeadershipPage } from './components/LeadershipPage';
import { QualityObjectivesPage } from './components/QualityObjectivesPage';
import { CompetenciesPage } from './components/CompetenciesPage';
import { SuppliersPage } from './components/SuppliersPage';
import { NonConformityPage } from './components/NonConformityPage';
import { SalesRequirementsPage } from './components/SalesRequirementsPage';
import { ProductionControlPage } from './components/ProductionControlPage';
import { CorrectiveActionsPage } from './components/CorrectiveActionsPage';
import { IndicatorsPage } from './components/IndicatorsPage';
import { ManagementReviewPage } from './components/ManagementReviewPage';
import { CompanyProfilePage } from './components/CompanyProfilePage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
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