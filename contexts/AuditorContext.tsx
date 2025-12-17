import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface TargetCompany {
    id: string;
    name: string;
}

interface AuditorContextType {
    isAuditorMode: boolean;
    targetCompany: TargetCompany | null;
    enterAuditorMode: (company: TargetCompany) => void;
    exitAuditorMode: () => void;
}

import { useAuthContext } from './AuthContext';

const AuditorContext = createContext<AuditorContextType | undefined>(undefined);

export const AuditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setViewingAsCompany } = useAuthContext();
    const [isAuditorMode, setIsAuditorMode] = useState(false);
    const [targetCompany, setTargetCompany] = useState<TargetCompany | null>(null);

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

    return (
        <AuditorContext.Provider value={{ isAuditorMode, targetCompany, enterAuditorMode, exitAuditorMode }}>
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
