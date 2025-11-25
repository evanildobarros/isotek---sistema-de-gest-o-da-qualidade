import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SectionDashboard } from './components/SectionDashboard';
import { SectionContexto } from './components/SectionContexto';
import { SectionMelhoria } from './components/SectionMelhoria';
import { SectionPerfil } from './components/SectionPerfil';

import { SectionPlaceholder } from './components/SectionPlaceholder';
import { UsersPage } from './components/UsersPage';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentsPage } from './components/DocumentsPage';
import { CorrectiveActionsPage } from './components/CorrectiveActionsPage';
import { AuditsPage } from './components/AuditsPage';
import { UnitsPage } from './components/UnitsPage';
import { StrategicDefinitionPage } from './components/StrategicDefinitionPage';
import { RiskMatrixPage } from './components/RiskMatrixPage';
import { StakeholdersPage } from './components/StakeholdersPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<SectionDashboard />} />
              <Route path="perfil" element={<SectionPerfil />} />

              {/* Grupo A: Estratégia (Plan) */}
              {/* 4.0 Contexto */}
              <Route path="contexto-analise" element={<SectionContexto />} />
              <Route path="definicao-estrategica" element={<StrategicDefinitionPage />} />
              <Route path="partes-interessadas" element={<StakeholdersPage />} />
              <Route path="processos-escopo" element={<SectionPlaceholder title="Processos e Escopo" />} />

              {/* Grupo A: Estratégia (Plan) - 6.0 Planejamento */}
              <Route path="matriz-riscos" element={<RiskMatrixPage />} />
              <Route path="objetivos-qualidade" element={<SectionPlaceholder title="Objetivos da Qualidade" />} />

              {/* 5.0 Liderança */}
              <Route path="politica-qualidade" element={<SectionPlaceholder title="Política da Qualidade" />} />
              <Route path="responsabilidades" element={<SectionPlaceholder title="Responsabilidades" />} />

              {/* 6.0 Planejamento */}
              <Route path="matriz-riscos" element={<SectionPlaceholder title="Matriz de Riscos" />} />
              <Route path="objetivos-qualidade" element={<SectionPlaceholder title="Objetivos da Qualidade" />} />

              {/* Grupo B: Execução (Do) */}
              {/* 7.0 Apoio */}
              <Route path="documentos" element={<DocumentsPage />} />
              <Route path="treinamentos" element={<SectionPlaceholder title="Competências e Treinamentos" />} />

              {/* 8.0 Operação */}
              <Route path="comercial" element={<SectionPlaceholder title="Comercial e Requisitos" />} />
              <Route path="fornecedores" element={<SectionPlaceholder title="Gestão de Fornecedores (PROCEM)" />} />
              <Route path="producao" element={<SectionPlaceholder title="Controle de Produção" />} />
              <Route path="saidas-nao-conformes" element={<SectionPlaceholder title="Saídas Não Conformes" />} />

              {/* Grupo C: Checagem (Check/Act) */}
              {/* 9.0 Avaliação */}
              <Route path="indicadores" element={<SectionPlaceholder title="Indicadores de Desempenho" />} />
              <Route path="auditorias" element={<AuditsPage />} />
              <Route path="analise-critica" element={<SectionPlaceholder title="Análise Crítica" />} />

              {/* 10.0 Melhoria */}
              <Route path="nao-conformidades" element={<SectionMelhoria />} />
              <Route path="acoes-corretivas" element={<CorrectiveActionsPage />} />

              {/* Configurações */}
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="unidades" element={<UnitsPage />} />
              <Route path="configuracoes" element={<SectionPlaceholder title="Perfil da Empresa" />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;