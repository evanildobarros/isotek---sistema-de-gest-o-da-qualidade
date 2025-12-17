import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AiChatWidget } from '../common/AiChatWidget';
import { IsoSection } from '../../types';
import { useAuditor } from '../../contexts/AuditorContext';
import { Eye, ArrowLeft } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auditor Context
    const { isAuditorMode, targetCompany, exitAuditorMode } = useAuditor();

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
                    <div className="fixed top-0 right-0 left-0 lg:left-72 h-10 md:h-12 bg-amber-400 text-amber-900 px-4 flex items-center justify-between z-50 shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-3">
                            <Eye size={18} className="animate-pulse" />
                            <span className="font-semibold text-sm">
                                MODO AUDITORIA
                            </span>
                            <span className="text-amber-800 text-sm">
                                — Visualizando ambiente de: <strong>{targetCompany.name}</strong>
                            </span>
                        </div>
                        <button
                            onClick={handleExitAuditorMode}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Sair do Modo
                        </button>
                    </div>
                )}

                <Header
                    activeSection={activeTitle as IsoSection}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                />

                <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${isAuditorMode ? 'mt-[6.5rem] md:mt-28' : 'mt-16'} scroll-smooth`}>
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* AI Assistant Widget */}
            <AiChatWidget />
        </div>
    );
};
