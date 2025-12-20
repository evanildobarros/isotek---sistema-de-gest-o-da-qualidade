import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AuditContextInfo } from '../types';
import { AUDIT_ROUTE_MAP } from '../lib/constants';
import { useAuthContext } from './AuthContext';

interface TargetCompany {
    id: string;
    name: string;
}

interface AuditorContextType {
    isAuditorMode: boolean;
    targetCompany: TargetCompany | null;
    currentContext: AuditContextInfo | null;
    enterAuditorMode: (company: TargetCompany) => void;
    exitAuditorMode: () => void;
}

const AuditorContext = createContext<AuditorContextType | undefined>(undefined);

export const AuditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setViewingAsCompany } = useAuthContext();
    const [isAuditorMode, setIsAuditorMode] = useState(false);
    const [targetCompany, setTargetCompany] = useState<TargetCompany | null>(null);
    const [currentContext, setCurrentContext] = useState<AuditContextInfo | null>(null);
    const location = useLocation();

    // Context detecting effect
    useEffect(() => {
        if (!isAuditorMode) {
            setCurrentContext(null);
            return;
        }

        const path = location.pathname;
        const context = AUDIT_ROUTE_MAP[path] || null;
        setCurrentContext(context);
    }, [location.pathname, isAuditorMode]);

    // Initial load from storage
    useEffect(() => {
        const storedMode = localStorage.getItem('isotek_auditor_mode');
        const storedCompany = localStorage.getItem('isotek_target_company');

        if (storedMode === 'true' && storedCompany) {
            try {
                const company = JSON.parse(storedCompany);
                setIsAuditorMode(true);
                setTargetCompany(company);
                setViewingAsCompany(company.id, company.name);
            } catch (e) {
                console.error('Error parsing stored auditor context', e);
                localStorage.removeItem('isotek_auditor_mode');
                localStorage.removeItem('isotek_target_company');
            }
        }
    }, [setViewingAsCompany]);

    const enterAuditorMode = (company: TargetCompany) => {
        setIsAuditorMode(true);
        setTargetCompany(company);
        localStorage.setItem('isotek_auditor_mode', 'true');
        localStorage.setItem('isotek_target_company', JSON.stringify(company));
        setViewingAsCompany(company.id, company.name);
        toast.success(`Modo auditor ativado: Visualizando ${company.name}`);
    };

    const exitAuditorMode = () => {
        setIsAuditorMode(false);
        setTargetCompany(null);
        localStorage.removeItem('isotek_auditor_mode');
        localStorage.removeItem('isotek_target_company');
        setViewingAsCompany(null);
        toast.info('Modo auditor encerrado');
    };

    const value = React.useMemo(() => ({
        isAuditorMode,
        targetCompany,
        currentContext,
        enterAuditorMode,
        exitAuditorMode
    }), [isAuditorMode, targetCompany, currentContext]);

    return (
        <AuditorContext.Provider value={value}>
            {children}
        </AuditorContext.Provider>
    );
};

export const useAuditor = () => {
    const context = useContext(AuditorContext);
    if (!context) {
        throw new Error('useAuditor must be used within an AuditorProvider');
    }
    return context;
};
