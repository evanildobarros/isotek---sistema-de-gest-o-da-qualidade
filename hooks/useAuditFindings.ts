import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuditor } from '../contexts/AuditorContext';

/**
 * Finding - Constatação de auditoria
 */
export interface Finding {
    id: string;
    entity_id: string;
    entity_type: 'document' | 'risk' | 'rnc' | 'supplier' | 'process' | 'objective' | 'training' | 'audit' | 'general';
    severity: 'conforme' | 'oportunidade' | 'nao_conformidade_menor' | 'nao_conformidade_maior';
    auditor_notes: string;
    status: 'open' | 'waiting_validation' | 'closed';
    company_response?: string;
}

/**
 * Mapa de findings indexado por entity_id para acesso rápido O(1)
 */
export type FindingsMap = Record<string, Finding>;

/**
 * Log de erro apenas em ambiente de desenvolvimento
 */
const logError = (context: string, error: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
        console.error(`[useAuditFindings] ${context}:`, error);
    }
};

/**
 * Hook para buscar constatações de auditoria em aberto da empresa atual
 * Retorna um mapa para acesso rápido por entity_id
 */
export function useAuditFindings(entityType?: Finding['entity_type']) {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [findingsMap, setFindingsMap] = useState<FindingsMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Consumir effectiveCompanyId do AuditorContext (suporta modo auditor e modo padrão)
    const { effectiveCompanyId } = useAuditor();

    const fetchFindings = useCallback(async () => {
        if (!effectiveCompanyId) {
            setFindings([]);
            setFindingsMap({});
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Buscar os IDs dos vínculos da empresa para filtrar constatações
            const { data: assignments, error: assignmentsError } = await supabase
                .from('audit_assignments')
                .select('id')
                .eq('company_id', effectiveCompanyId);

            if (assignmentsError) {
                throw new Error(`Erro ao buscar assignments: ${assignmentsError.message}`);
            }

            if (!assignments || assignments.length === 0) {
                setFindings([]);
                setFindingsMap({});
                setLoading(false);
                return;
            }

            const assignmentIds = assignments.map(a => a.id);

            // 2. Buscar constatações em aberto (não fechadas) filtrando pelos IDs obtidos
            let query = supabase
                .from('audit_findings')
                .select(`
                    id,
                    entity_id,
                    entity_type,
                    severity,
                    auditor_notes,
                    status,
                    company_response
                `)
                .in('audit_assignment_id', assignmentIds)
                .neq('status', 'closed');

            // Filtrar por tipo de entidade se especificado
            if (entityType) {
                query = query.eq('entity_type', entityType);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw new Error(`Erro ao buscar findings: ${fetchError.message}`);
            }

            // Criar mapa para acesso rápido por entity_id
            const map: FindingsMap = {};
            (data || []).forEach((finding) => {
                if (finding.entity_id) {
                    map[finding.entity_id] = finding as Finding;
                }
            });

            setFindings((data as Finding[]) || []);
            setFindingsMap(map);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar constatações';
            logError('Erro inesperado', err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [effectiveCompanyId, entityType]);

    useEffect(() => {
        fetchFindings();
    }, [fetchFindings]);

    /**
     * Verifica se uma entidade tem constatação pendente
     */
    const hasFinding = useCallback((entityId: string): boolean => {
        return entityId in findingsMap;
    }, [findingsMap]);

    /**
     * Obtém a constatação de uma entidade específica
     */
    const getFinding = useCallback((entityId: string): Finding | undefined => {
        return findingsMap[entityId];
    }, [findingsMap]);

    /**
     * Conta constatações por severidade
     */
    const countBySeverity = useCallback(() => {
        return {
            conforme: findings.filter(f => f.severity === 'conforme').length,
            oportunidade: findings.filter(f => f.severity === 'oportunidade').length,
            menor: findings.filter(f => f.severity === 'nao_conformidade_menor').length,
            maior: findings.filter(f => f.severity === 'nao_conformidade_maior').length,
        };
    }, [findings]);

    /**
     * Força recarregamento dos findings
     */
    const refetch = useCallback(() => {
        return fetchFindings();
    }, [fetchFindings]);

    return {
        findings,
        findingsMap,
        loading,
        error,
        hasFinding,
        getFinding,
        countBySeverity,
        refetch,
    };
}

