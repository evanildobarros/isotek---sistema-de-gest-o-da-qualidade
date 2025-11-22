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
        if (path.includes('/documentos')) return IsoSection.DOCUMENTS;
        if (path.includes('/nao-conformidades')) return IsoSection.NON_CONFORMANCES;
        if (path.includes('/acoes-corretivas')) return IsoSection.CORRECTIVE_ACTIONS;
        if (path.includes('/auditorias')) return IsoSection.AUDITS;
        if (path.includes('/contexto')) return IsoSection.RISK_MATRIX; // Mapped to Contexto
        if (path.includes('/oportunidades')) return IsoSection.OPPORTUNITIES;
        if (path.includes('/colaboradores')) return IsoSection.EMPLOYEES;
        if (path.includes('/treinamentos')) return IsoSection.TRAININGS;
        if (path.includes('/indicadores')) return IsoSection.KPIS;
        if (path.includes('/analise-critica')) return IsoSection.MANAGEMENT_REVIEW;
        if (path.includes('/usuarios')) return IsoSection.USERS;
        if (path.includes('/sistema')) return IsoSection.SYSTEM;

        return 'Isotek';
    };

    const activeTitle = getActiveSection();

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 flex flex-col pl-64">
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
