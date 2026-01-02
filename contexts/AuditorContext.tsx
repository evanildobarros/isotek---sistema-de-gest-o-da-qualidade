import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { AuditAssignment, AuditContextInfo } from '../types';
import { AUDIT_ROUTE_MAP } from '../lib/constants';
import { useAuthContext } from './AuthContext';

interface TargetCompany {
    id: string;
    name: string;
    logo_url?: string | null;
}

interface DatabaseAssignment {
    id: string;
    auditor_id: string;
    company_id: string;
    start_date: string;
    end_date: string | null;
    status: AuditAssignment['status'];
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    progress: number | null;
    company: {
        id: string;
        name: string;
    } | null;
}

interface AuditorContextType {
    isAuditorMode: boolean;
    auditorAssignments: AuditAssignment[];
    viewingAsCompanyId: string | null;
    viewingAsCompanyName: string | null;
    effectiveCompanyId: string | null;
    currentContext: AuditContextInfo | null;
    targetCompany: TargetCompany | null;
    activeAssignment: AuditAssignment | null;
    activeAssignmentId: string | null;
    setViewingAsCompany: (companyId: string | null, companyName?: string | null) => void;
    enterAuditorMode: (company: TargetCompany) => void;
    exitAuditorMode: () => void;
    refreshAssignments: () => Promise<void>;
}

const AuditorContext = createContext<AuditorContextType | undefined>(undefined);

export const AuditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, company } = useAuthContext();
    const [auditorAssignments, setAuditorAssignments] = useState<AuditAssignment[]>([]);
    const [viewingAsCompanyId, setViewingAsCompanyId] = useState<string | null>(null);
    const [viewingAsCompanyName, setViewingAsCompanyName] = useState<string | null>(null);
    const [currentContext, setCurrentContext] = useState<AuditContextInfo | null>(null);
    const location = useLocation();

    // 1. Memoize counts and basic status
    const isAuditorMode = !!viewingAsCompanyId;
    const isActuallyAuditor = user?.role === 'auditor';
    const effectiveCompanyId = viewingAsCompanyId || (isActuallyAuditor ? null : company?.id) || null;

    // 2. Fetch Assignments logically separated from Auth
    const fetchAuditorAssignments = useCallback(async () => {
        if (!user) {
            setAuditorAssignments([]);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('audit_assignments')
                .select(`
                    id, auditor_id, company_id, start_date, end_date, status, notes, created_by, created_at, updated_at, progress,
                    company:company_info(id, name, logo_url)
                `)
                .eq('auditor_id', user.id)
                .in('status', ['agendada', 'em_andamento'])
                .lte('start_date', today)
                .or(`end_date.is.null,end_date.gte.${today}`);

            if (error) {
                console.error('[AuditorContext] Erro ao buscar vínculos:', error);
                setAuditorAssignments([]);
                return;
            }

            const mappedAssignments: AuditAssignment[] = (data as any[] || []).map((item) => ({
                id: item.id,
                auditor_id: item.auditor_id,
                company_id: item.company_id,
                start_date: item.start_date,
                end_date: item.end_date,
                status: item.status,
                progress: item.progress,
                notes: item.notes || undefined,
                created_by: item.created_by || undefined,
                created_at: item.created_at,
                updated_at: item.updated_at,
                company_name: item.company?.name || 'Empresa',
                company_logo: item.company?.logo_url
            }));

            setAuditorAssignments(mappedAssignments);
        } catch (error) {
            console.error('[AuditorContext] Erro inesperado:', error);
            setAuditorAssignments([]);
        }
    }, [user]);

    // Initial load and whenever user changes
    useEffect(() => {
        fetchAuditorAssignments();
    }, [fetchAuditorAssignments]);

    // RESTORE selection from storage
    useEffect(() => {
        const savedCompany = localStorage.getItem('isotek_target_company');
        const savedMode = localStorage.getItem('isotek_auditor_mode');

        if (savedCompany && savedMode === 'true') {
            try {
                const companyData = JSON.parse(savedCompany);
                setViewingAsCompanyId(companyData.id);
                setViewingAsCompanyName(companyData.name);
                // Also restore logo if possible
                setViewingAsCompanyLogo(companyData.logo_url || null);
            } catch (e) {
                console.error('[AuditorContext] Erro ao restaurar empresa:', e);
                localStorage.removeItem('isotek_target_company');
                localStorage.removeItem('isotek_auditor_mode');
            }
        }
    }, []);

    // 3. Route detection context
    useEffect(() => {
        if (!isAuditorMode) {
            setCurrentContext(null);
            return;
        }
        const context = AUDIT_ROUTE_MAP[location.pathname] || null;
        setCurrentContext(context);
    }, [location.pathname, isAuditorMode]);

    const [viewingAsCompanyLogo, setViewingAsCompanyLogo] = useState<string | null>(null);

    const setViewingAsCompany = useCallback((companyId: string | null, companyName?: string | null, companyLogo?: string | null) => {
        setViewingAsCompanyId(companyId);
        setViewingAsCompanyName(companyName || null);
        setViewingAsCompanyLogo(companyLogo || null);

        if (companyId) {
            localStorage.setItem('isotek_target_company', JSON.stringify({ id: companyId, name: companyName, logo_url: companyLogo }));
            localStorage.setItem('isotek_auditor_mode', 'true');
        } else {
            localStorage.removeItem('isotek_target_company');
            localStorage.removeItem('isotek_auditor_mode');
        }
    }, []);

    const enterAuditorMode = (company: TargetCompany) => {
        setViewingAsCompany(company.id, company.name, company.logo_url);
        toast.success(`Modo auditor ativado: Visualizando ${company.name}`);
    };

    const exitAuditorMode = () => {
        setViewingAsCompany(null);
        toast.info('Modo auditor encerrado');
    };

    const targetCompany = useMemo(() =>
        viewingAsCompanyId ? {
            id: viewingAsCompanyId,
            name: viewingAsCompanyName || 'Empresa',
            logo_url: viewingAsCompanyLogo
        } : null
        , [viewingAsCompanyId, viewingAsCompanyName, viewingAsCompanyLogo]);

    const activeAssignment = useMemo(() => {
        if (!viewingAsCompanyId || auditorAssignments.length === 0) return null;
        return auditorAssignments.find(a => a.company_id === viewingAsCompanyId) || null;
    }, [viewingAsCompanyId, auditorAssignments]);

    const activeAssignmentId = activeAssignment?.id || null;

    const value = useMemo(() => ({
        isAuditorMode,
        targetCompany,
        auditorAssignments,
        viewingAsCompanyId,
        viewingAsCompanyName,
        effectiveCompanyId,
        currentContext,
        activeAssignment,
        activeAssignmentId,
        setViewingAsCompany,
        enterAuditorMode,
        exitAuditorMode,
        refreshAssignments: fetchAuditorAssignments
    }), [
        isAuditorMode,
        targetCompany,
        auditorAssignments,
        viewingAsCompanyId,
        viewingAsCompanyName,
        effectiveCompanyId,
        currentContext,
        activeAssignment,
        activeAssignmentId,
        setViewingAsCompany,
        fetchAuditorAssignments
    ]);

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
