import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

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
 * Hook para buscar constatações de auditoria em aberto da empresa atual
 * Retorna um mapa para acesso rápido por entity_id
 */
export function useAuditFindings(entityType?: Finding['entity_type']) {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [findingsMap, setFindingsMap] = useState<FindingsMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { company } = useAuthContext();

    useEffect(() => {
        const fetchFindings = async () => {
            if (!company?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Buscar constatações em aberto (não fechadas)
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
                    .neq('status', 'closed');

                // Filtrar por tipo de entidade se especificado
                if (entityType) {
                    query = query.eq('entity_type', entityType);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) {
                    console.error('Erro ao buscar constatações:', fetchError);
                    setError(fetchError.message);
                    return;
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
                console.error('Erro inesperado ao buscar constatações:', err);
                setError('Erro ao carregar constatações');
            } finally {
                setLoading(false);
            }
        };

        fetchFindings();
    }, [company?.id, entityType]);

    /**
     * Verifica se uma entidade tem constatação pendente
     */
    const hasFinding = (entityId: string): boolean => {
        return entityId in findingsMap;
    };

    /**
     * Obtém a constatação de uma entidade específica
     */
    const getFinding = (entityId: string): Finding | undefined => {
        return findingsMap[entityId];
    };

    /**
     * Conta constatações por severidade
     */
    const countBySeverity = () => {
        return {
            conforme: findings.filter(f => f.severity === 'conforme').length,
            oportunidade: findings.filter(f => f.severity === 'oportunidade').length,
            menor: findings.filter(f => f.severity === 'nao_conformidade_menor').length,
            maior: findings.filter(f => f.severity === 'nao_conformidade_maior').length,
        };
    };

    return {
        findings,
        findingsMap,
        loading,
        error,
        hasFinding,
        getFinding,
        countBySeverity,
    };
}
