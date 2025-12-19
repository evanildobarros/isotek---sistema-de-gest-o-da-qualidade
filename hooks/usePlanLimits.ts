import { useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { PLANS, type PlanId } from '../types';

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
}

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
        'external-audits' // Marketplace/Auditores Externos
    ],
    enterprise: ['*'] // All modules
};

/**
 * Hook to check plan limits and feature access
 */
export function usePlanLimits(): PlanLimits {
    const { company } = useAuthContext();

    return useMemo(() => {
        const planId = (company?.plan_id || 'start') as PlanId;
        const planData = PLANS[planId] || PLANS.start;

        const maxUsers = company?.max_users || planData.limits.maxUsers;
        const maxStorage = company?.max_storage_gb || planData.limits.maxStorageGb;

        // TODO: Get actual current usage from database
        const currentUsers = 0;
        const currentStorage = 0;

        const planNames: Record<PlanId, string> = {
            start: 'Start',
            pro: 'Pro',
            enterprise: 'Enterprise'
        };

        const canAddUser = currentUsers < maxUsers;

        const canAccessModule = (moduleName: string): boolean => {
            const allowedModules = PLAN_ACCESS_RULES[planId];
            if (allowedModules.includes('*')) return true;
            return allowedModules.includes(moduleName.toLowerCase());
        };

        return {
            planId,
            planName: planNames[planId],
            canAddUser,
            canAccessModule,
            hasAuditMarketplace: planData.limits.audit_marketplace,
            aiPromptsLimit: planData.limits.ai_prompts,
            usage: {
                usersUsed: currentUsers,
                usersLimit: maxUsers,
                storageUsed: currentStorage,
                storageLimit: maxStorage
            }
        };
    }, [company]);
}
