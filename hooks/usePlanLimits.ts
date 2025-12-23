import { useMemo, useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { PLANS, type PlanId } from '../types';
import { supabase } from '../lib/supabase';

export interface PlanLimits {
    planId: PlanId;
    planName: string;
    canAddUser: boolean;
    canAccessModule: (moduleName: string) => boolean;
    hasAuditMarketplace: boolean;
    aiPromptsLimit: number;
    usage: {
        usersUsed: number;
        usersLimit: number;
        storageUsed: number;
        storageLimit: number;
    };
    refresh: () => void;
}

// Module access rules by plan
// Module access rules by plan
const PLAN_ACCESS_RULES: Record<PlanId, string[]> = {
    start: [
        'dashboard',
        'documents',
        'non-conformities',
        'corrective-actions',
        'company-profile',
        'user-profile'
    ],
    pro: [
        'dashboard',
        'documents',
        'non-conformities',
        'corrective-actions',
        'audits',
        'suppliers',
        'production',
        'sales',
        'kpis',
        'swot',
        'risks',
        'company-profile',
        'user-profile',
        'units',
        'external-audits'
    ],
    enterprise: ['*']
};

/**
 * Hook to check plan limits and feature access
 */
export function usePlanLimits(): PlanLimits {
    const { company, isSuperAdmin } = useAuthContext();
    const [usersCount, setUsersCount] = useState(0);
    const [storageCount, setStorageCount] = useState(0);

    const fetchUsage = async () => {
        if (!company?.id) return;

        try {
            // Count users in profiles
            const { count, error: userError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id);

            if (!userError) setUsersCount(count || 0);

            // TODO: Calculate storage usage from documents
            setStorageCount(0);
        } catch (error) {
            console.error('Error fetching plan usage:', error);
        }
    };

    useEffect(() => {
        fetchUsage();
    }, [company?.id]);

    return useMemo(() => {
        const planId = (company?.plan_id || 'start') as PlanId;
        const planData = PLANS[planId] || PLANS.start;

        const maxUsers = Math.max(company?.max_users || 0, planData.limits.users);
        const maxStorage = Math.max(company?.max_storage_gb || 0, planData.limits.storage_gb);

        const planNames: Record<PlanId, string> = {
            start: 'Start',
            pro: 'Pro',
            enterprise: 'Enterprise'
        };

        const canAddUser = isSuperAdmin || usersCount < maxUsers;

        const canAccessModule = (moduleName: string): boolean => {
            const normalizedModule = moduleName.toLowerCase();

            // Explicit checks for key features based on plan flags
            if (normalizedModule === 'audits' || normalizedModule === 'external-audits') {
                if (!planData.limits.has_marketplace) return false;
            }
            if (normalizedModule === 'risks' || normalizedModule === 'swot') {
                if (!planData.limits.has_risk_matrix) return false;
            }

            const allowedModules = PLAN_ACCESS_RULES[planId] || PLAN_ACCESS_RULES.start;
            if (allowedModules.includes('*')) return true;
            return allowedModules.includes(normalizedModule);
        };

        return {
            planId,
            planName: planNames[planId],
            canAddUser,
            canAccessModule,
            hasAuditMarketplace: planData.limits.has_marketplace,
            aiPromptsLimit: planData.limits.ai_prompts,
            usage: {
                usersUsed: usersCount,
                usersLimit: maxUsers,
                storageUsed: storageCount,
                storageLimit: maxStorage
            },
            refresh: fetchUsage
        };
    }, [company, usersCount, storageCount]);
}

