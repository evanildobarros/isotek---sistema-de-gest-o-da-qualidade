import { useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import type { PlanId } from '../types';

export interface PlanLimits {
    planId: PlanId;
    planName: string;
    canAddUser: boolean;
    canAccessModule: (moduleName: string) => boolean;
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
        'units'
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
        const maxUsers = company?.max_users || 5;
        const maxStorage = company?.max_storage_gb || 5;

        // TODO: Get actual current usage from database
        // For now, using dummy values
        const currentUsers = 0; // This should be fetched from profiles count
        const currentStorage = 0; // This should be calculated from storage usage

        const planNames: Record<PlanId, string> = {
            start: 'Start',
            pro: 'Pro',
            enterprise: 'Enterprise'
        };

        const canAddUser = currentUsers < maxUsers;

        const canAccessModule = (moduleName: string): boolean => {
            const allowedModules = PLAN_ACCESS_RULES[planId];

            // Enterprise has access to everything
            if (allowedModules.includes('*')) {
                return true;
            }

            // Check if module is in allowed list
            return allowedModules.includes(moduleName.toLowerCase());
        };

        return {
            planId,
            planName: planNames[planId],
            canAddUser,
            canAccessModule,
            usage: {
                usersUsed: currentUsers,
                usersLimit: maxUsers,
                storageUsed: currentStorage,
                storageLimit: maxStorage
            }
        };
    }, [company]);
}
