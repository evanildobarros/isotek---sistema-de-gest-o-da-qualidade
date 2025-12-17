import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuditAssignment } from '../types';

interface UseAuditorContextReturn {
    // Vínculos de auditoria do usuário atual
    assignments: AuditAssignment[];
    loadingAssignments: boolean;

    // Estado de visualização como auditor
    viewingAsCompanyId: string | null;
    viewingAsCompanyName: string | null;
    isAuditorMode: boolean;

    // Ações
    setViewingAsCompany: (companyId: string | null, companyName?: string | null) => void;
    refreshAssignments: () => Promise<void>;
}

export function useAuditorContext(userId: string | undefined): UseAuditorContextReturn {
    const [assignments, setAssignments] = useState<AuditAssignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [viewingAsCompanyId, setViewingAsCompanyId] = useState<string | null>(null);
    const [viewingAsCompanyName, setViewingAsCompanyName] = useState<string | null>(null);

    const isAuditorMode = viewingAsCompanyId !== null;

    const fetchAssignments = useCallback(async () => {
        if (!userId) {
            setAssignments([]);
            return;
        }

        try {
            setLoadingAssignments(true);

            // Buscar vínculos ativos do usuário como auditor
            const { data, error } = await supabase
                .from('audit_assignments')
                .select(`
          *,
          company:company_info(id, name)
        `)
                .eq('auditor_id', userId)
                .eq('status', 'active')
                .lte('start_date', new Date().toISOString().split('T')[0])
                .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`);

            if (error) {
                console.error('[useAuditorContext] Erro ao buscar vínculos:', error);
                setAssignments([]);
                return;
            }

            // Mapear dados com nome da empresa
            const mappedAssignments: AuditAssignment[] = (data || []).map((item: any) => ({
                id: item.id,
                auditor_id: item.auditor_id,
                company_id: item.company_id,
                start_date: item.start_date,
                end_date: item.end_date,
                status: item.status,
                notes: item.notes,
                created_by: item.created_by,
                created_at: item.created_at,
                updated_at: item.updated_at,
                company_name: item.company?.name || 'Empresa'
            }));

            setAssignments(mappedAssignments);
        } catch (error) {
            console.error('[useAuditorContext] Erro:', error);
            setAssignments([]);
        } finally {
            setLoadingAssignments(false);
        }
    }, [userId]);

    // Carregar vínculos quando userId mudar
    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    // Função para trocar empresa visualizada
    const setViewingAsCompany = useCallback((companyId: string | null, companyName?: string | null) => {
        setViewingAsCompanyId(companyId);
        setViewingAsCompanyName(companyName || null);

        // Persistir no sessionStorage para manter entre navegações
        if (companyId) {
            sessionStorage.setItem('auditor_viewing_company_id', companyId);
            if (companyName) {
                sessionStorage.setItem('auditor_viewing_company_name', companyName);
            }
        } else {
            sessionStorage.removeItem('auditor_viewing_company_id');
            sessionStorage.removeItem('auditor_viewing_company_name');
        }
    }, []);

    // Restaurar seleção do sessionStorage ao carregar
    useEffect(() => {
        const savedCompanyId = sessionStorage.getItem('auditor_viewing_company_id');
        const savedCompanyName = sessionStorage.getItem('auditor_viewing_company_name');
        if (savedCompanyId) {
            setViewingAsCompanyId(savedCompanyId);
            setViewingAsCompanyName(savedCompanyName);
        }
    }, []);

    return {
        assignments,
        loadingAssignments,
        viewingAsCompanyId,
        viewingAsCompanyName,
        isAuditorMode,
        setViewingAsCompany,
        refreshAssignments: fetchAssignments
    };
}
