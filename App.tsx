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

const App: React.FC = () => {
  return (
    <BrowserRouter>
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

            {/* Gestão da Qualidade */}
            <Route path="documentos" element={<SectionPlaceholder title="Documentos (GED)" />} />
            <Route path="nao-conformidades" element={<SectionMelhoria />} />
            <Route path="acoes-corretivas" element={<SectionPlaceholder title="Ações Corretivas" />} />
            <Route path="auditorias" element={<SectionPlaceholder title="Auditorias" />} />

            {/* Gestão de Riscos */}
            <Route path="contexto" element={<SectionContexto />} />
            <Route path="oportunidades" element={<SectionPlaceholder title="Oportunidades" />} />

            {/* Gestão Administrativa */}
            <Route path="colaboradores" element={<SectionPlaceholder title="Colaboradores" />} />
            <Route path="treinamentos" element={<SectionPlaceholder title="Treinamentos" />} />

            {/* Relatórios */}
            <Route path="indicadores" element={<SectionPlaceholder title="Indicadores (KPIs)" />} />
            <Route path="analise-critica" element={<SectionPlaceholder title="Análise Crítica" />} />

            {/* Configurações */}
            <Route path="usuarios" element={<SectionPlaceholder title="Usuários" />} />
            <Route path="sistema" element={<SectionPlaceholder title="Sistema" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;