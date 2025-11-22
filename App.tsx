import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SectionDashboard } from './components/SectionDashboard';
import { SectionContexto } from './components/SectionContexto';
import { SectionMelhoria } from './components/SectionMelhoria';
import { SectionPlaceholder } from './components/SectionPlaceholder';
import { IsoSection } from './types';
import { Construction } from 'lucide-react';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<IsoSection>(IsoSection.DASHBOARD);

  const renderContent = () => {
    switch (activeSection) {
      case IsoSection.DASHBOARD:
        return <SectionDashboard />;

      // Gestão da Qualidade
      case IsoSection.NON_CONFORMANCES:
        return <SectionMelhoria />; // Reusing existing component
      case IsoSection.DOCUMENTS:
        return <SectionPlaceholder title="Documentos (GED)" />;
      case IsoSection.CORRECTIVE_ACTIONS:
        return <SectionPlaceholder title="Ações Corretivas" />;
      case IsoSection.AUDITS:
        return <SectionPlaceholder title="Auditorias" />;

      // Gestão de Riscos
      case IsoSection.RISK_MATRIX:
        return <SectionContexto />; // Reusing existing component (SWOT)
      case IsoSection.OPPORTUNITIES:
        return <SectionPlaceholder title="Oportunidades" />;

      // Gestão Administrativa
      case IsoSection.EMPLOYEES:
        return <SectionPlaceholder title="Colaboradores" />;
      case IsoSection.TRAININGS:
        return <SectionPlaceholder title="Treinamentos" />;

      // Relatórios
      case IsoSection.KPIS:
        return <SectionPlaceholder title="Indicadores (KPIs)" />;
      case IsoSection.MANAGEMENT_REVIEW:
        return <SectionPlaceholder title="Análise Crítica" />;

      // Configurações
      case IsoSection.USERS:
        return <SectionPlaceholder title="Usuários" />;
      case IsoSection.SYSTEM:
        return <SectionPlaceholder title="Sistema" />;

      default:
        return <SectionPlaceholder title={activeSection} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      <div className="flex-1 flex flex-col pl-64">
        <Header activeSection={activeSection} />

        <main className="flex-1 overflow-y-auto p-8 mt-16 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;