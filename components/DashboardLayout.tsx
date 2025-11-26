import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { IsoSection } from '../types';

export const DashboardLayout: React.FC = () => {
    const location = useLocation();

    // Helper to determine active section for Header title
    // This is a simple mapping based on path
    const getActiveSection = (): string => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return IsoSection.DASHBOARD;
        if (path.includes('/perfil')) return IsoSection.USER_PROFILE;

        // Estratégia
        if (path.includes('/contexto-analise')) return IsoSection.CONTEXT_ANALYSIS;
        if (path.includes('/definicao-estrategica')) return IsoSection.STRATEGIC_DEFINITION;
        if (path.includes('/partes-interessadas')) return IsoSection.STAKEHOLDERS;
        if (path.includes('/processos-escopo')) return IsoSection.PROCESSES_SCOPE;
        if (path.includes('/matriz-riscos')) return IsoSection.RISK_MATRIX;
        if (path.includes('/objetivos-qualidade')) return IsoSection.QUALITY_OBJECTIVES;

        // Execução
        if (path.includes('/documentos')) return IsoSection.DOCUMENTS;
        if (path.includes('/treinamentos')) return IsoSection.COMPETENCIES_TRAINING;
        if (path.includes('/comercial')) return IsoSection.COMMERCIAL_REQUIREMENTS;
        if (path.includes('/fornecedores')) return IsoSection.SUPPLIER_MANAGEMENT;
        if (path.includes('/producao')) return IsoSection.PRODUCTION_CONTROL;
        if (path.includes('/saidas-nao-conformes')) return IsoSection.NON_CONFORMING_OUTPUTS;

        // Checagem
        if (path.includes('/indicadores')) return IsoSection.PERFORMANCE_INDICATORS;
        if (path.includes('/auditorias')) return IsoSection.INTERNAL_AUDITS;
        if (path.includes('/analise-critica')) return IsoSection.MANAGEMENT_REVIEW;

        // Melhoria
        if (path.includes('/nao-conformidades')) return IsoSection.NON_CONFORMANCES;
        if (path.includes('/acoes-corretivas')) return IsoSection.CORRECTIVE_ACTIONS;

        // Configurações
        if (path.includes('/usuarios')) return IsoSection.SETTINGS_USERS;
        if (path.includes('/unidades')) return IsoSection.UNITS;
        if (path.includes('/configuracoes')) return IsoSection.COMPANY_PROFILE;

        return 'Isotek';
    };

    const activeTitle = getActiveSection();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar />

            <div className="flex-1 flex flex-col pl-72">
                <Header activeSection={activeTitle as IsoSection} />

                <main className="flex-1 overflow-y-auto p-8 mt-16 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
