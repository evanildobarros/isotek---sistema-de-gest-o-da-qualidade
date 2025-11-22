import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SectionDashboard } from './components/SectionDashboard';
import { SectionContexto } from './components/SectionContexto';
import { SectionMelhoria } from './components/SectionMelhoria';
import { IsoSection } from './types';
import { Construction } from 'lucide-react';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<IsoSection>(IsoSection.DASHBOARD);

  const renderContent = () => {
    switch (activeSection) {
      case IsoSection.DASHBOARD:
        return <SectionDashboard />;
      case IsoSection.CONTEXTO:
        return <SectionContexto />;
      case IsoSection.MELHORIA:
        return <SectionMelhoria />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Construction size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Módulo em Desenvolvimento</h2>
            <p className="text-gray-500 max-w-md mt-2">
              Esta seção do sistema Isotek ({activeSection}) estará disponível na próxima atualização do sistema.
            </p>
          </div>
        );
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