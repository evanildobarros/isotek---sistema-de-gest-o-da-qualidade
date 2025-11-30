import React from 'react';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import { UpgradeRequiredState } from '../common/UpgradeRequiredState';

interface PlanGuardProps {
    requiredFeature: string;
    featureName: string;
    requiredPlan?: 'pro' | 'enterprise';
    description?: string;
    children: React.ReactNode;
}

/**
 * Component that restricts access to features based on subscription plan
 */
export const PlanGuard: React.FC<PlanGuardProps> = ({
    requiredFeature,
    featureName,
    requiredPlan = 'pro',
    description,
    children
}) => {
    const { canAccessModule } = usePlanLimits();

    // Check if user has access to this feature
    const hasAccess = canAccessModule(requiredFeature);

    if (!hasAccess) {
        return (
            <UpgradeRequiredState
                featureName={featureName}
                requiredPlan={requiredPlan}
                description={description}
            />
        );
    }

    return <>{children}</>;
};
