import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AiChatWidget, AuditActionPanel } from '../common';
import { IsoSection } from '../../types';
import { useAuditor } from '../../contexts/AuditorContext';
import { Eye, ArrowLeft } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auditor Context
    const { isAuditorMode, targetCompany, exitAuditorMode, currentContext } = useAuditor();

    const handleExitAuditorMode = () => {
        exitAuditorMode();
        navigate('/app/auditor-portal');
    };

    // Helper to determine active section for Header title
    // This is a simple mapping based on path
    const getActiveSection = (): string => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'Dashboard';
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
            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col lg:pl-72">
                {/* Barra de Modo Auditoria */}
                {isAuditorMode && targetCompany && (
                    <div className="fixed top-0 right-0 left-0 lg:left-72 h-12 bg-amber-400 text-amber-900 px-3 md:px-4 flex items-center justify-between z-50 shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <Eye size={18} className="animate-pulse flex-shrink-0" />
                            <div className="flex items-center gap-1 md:gap-2 whitespace-nowrap overflow-hidden">
                                <span className="font-bold text-[10px] md:text-sm uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded md:bg-transparent md:p-0">
                                    <span className="hidden xs:inline">MODO </span>AUDITORIA
                                </span>
                                <span className="text-amber-800 text-xs md:text-sm truncate">
                                    <span className="hidden sm:inline">— Visualizando ambiente de: </span>
                                    <span className="sm:hidden font-medium">|</span>
                                    <strong className="ml-1">{targetCompany.name}</strong>
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleExitAuditorMode}
                            className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm font-bold rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ml-2"
                        >
                            <ArrowLeft size={14} className="md:w-4 md:h-4" />
                            <span className="hidden xs:inline">Sair<span className="hidden md:inline"> do Modo</span></span>
                        </button>
                    </div>
                )}

                <Header
                    activeSection={activeTitle as IsoSection}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                />

                <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${isAuditorMode ? 'mt-28' : 'mt-16'} scroll-smooth`}>
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* AI Assistant Widget */}
            <AiChatWidget />

            {/* Auditor Action Panel */}
            {isAuditorMode && (
                <AuditActionPanel />
            )}
        </div>
    );
};
