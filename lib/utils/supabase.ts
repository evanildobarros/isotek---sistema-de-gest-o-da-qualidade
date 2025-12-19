import { supabase } from '../supabase';

/**
 * Obtém o company_id do usuário logado
 */
export async function getCompanyId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

    return profile?.company_id || null;
}

/**
 * Obtém o user_id do usuário logado
 */
export async function getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

/**
 * Upload de arquivo para o Supabase Storage
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true });

        if (error) {
            return { url: null, error };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return { url: publicUrl, error: null };
    } catch (error) {
        return { url: null, error: error as Error };
    }
}

/**
 * Obtém URL pública de um arquivo no Storage
 */
export function getPublicUrl(bucket: string, path: string): string {
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return publicUrl;
}

/**
 * Tratamento padronizado de erros do Supabase
 */
export function handleSupabaseError(error: any): string {
    if (error?.message) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Erro desconhecido ao processar requisição';
}

/**
 * Verifica se o usuário atual é super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
    const userId = await getUserId();
    if (!userId) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', userId)
        .single();

    return profile?.is_super_admin || false;
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

import { PLANS } from '../../types';

/**
 * Definições dos planos disponíveis
 */
export function getAvailablePlans(): Plan[] {
    return [
        {
            id: 'start',
            ...PLANS.start,
            billingPeriod: 'monthly',
            description: 'Perfeito para começar',
            features: [
                ...PLANS.start.features,
                'Acesso a Auditores Nível Bronze',
                'Taxa de serviço: 30%'
            ],
            limits: PLANS.start.limits
        },
        {
            id: 'pro',
            ...PLANS.pro,
            billingPeriod: 'monthly',
            description: 'Para empresas em crescimento',
            popular: true,
            features: [
                ...PLANS.pro.features,
                'Auditores Nível Ouro (ISO 9001)',
                'Taxa reduzida: 20%'
            ],
            limits: PLANS.pro.limits
        },
        {
            id: 'enterprise',
            ...PLANS.enterprise,
            billingPeriod: 'monthly',
            description: 'Para grandes organizações',
            features: [
                ...PLANS.enterprise.features,
                'Auditores Senior (Diamante)',
                'Taxa de serviço: 10%'
            ],
            limits: PLANS.enterprise.limits
        }
    ] as Plan[];
}

/**
 * Upgrade de plano
 */
export async function upgradePlan(companyId: string, newPlanId: PlanId): Promise<{ success: boolean; error?: string }> {
    try {
        const plans = getAvailablePlans();
        const newPlan = plans.find(p => p.id === newPlanId);

        if (!newPlan) {
            return { success: false, error: 'Plano não encontrado' };
        }

        // Calcular nova data de renovação (30 dias)
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        const { error } = await supabase
            .from('company_info')
            .update({
                plan_id: newPlanId,
                subscription_status: 'active',
                max_users: newPlan.limits.maxUsers,
                max_storage_gb: newPlan.limits.maxStorageGb,
                current_period_end: currentPeriodEnd.toISOString()
            })
            .eq('id', companyId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao fazer upgrade' };
    }
}

/**
 * Downgrade de plano
 */
export async function downgradePlan(companyId: string, newPlanId: PlanId): Promise<{ success: boolean; error?: string }> {
    try {
        const plans = getAvailablePlans();
        const newPlan = plans.find(p => p.id === newPlanId);

        if (!newPlan) {
            return { success: false, error: 'Plano não encontrado' };
        }

        const { error } = await supabase
            .from('company_info')
            .update({
                plan_id: newPlanId,
                max_users: newPlan.limits.maxUsers,
                max_storage_gb: newPlan.limits.maxStorageGb
            })
            .eq('id', companyId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao fazer downgrade' };
    }
}

/**
 * Verifica limites do plano
 */
export async function checkPlanLimits(companyId: string): Promise<{
    currentUsers: number;
    maxUsers: number;
    currentStorage: number;
    maxStorage: number;
    withinLimits: boolean;
}> {
    try {
        // Buscar informações da empresa
        const { data: company } = await supabase
            .from('company_info')
            .select('max_users, max_storage_gb')
            .eq('id', companyId)
            .single();

        // Contar usuários ativos
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);

        const currentUsers = userCount || 0;
        const maxUsers = company?.max_users || 5;
        const maxStorage = company?.max_storage_gb || 5;

        // Para storage, seria necessário calcular o tamanho real dos arquivos
        // Por enquanto, retornamos um valor estimado
        const currentStorage = 0; // Implementar lógica de cálculo real

        return {
            currentUsers,
            maxUsers,
            currentStorage,
            maxStorage,
            withinLimits: currentUsers <= maxUsers && currentStorage <= maxStorage
        };
    } catch (error) {
        console.error('Error checking plan limits:', error);
        return {
            currentUsers: 0,
            maxUsers: 5,
            currentStorage: 0,
            maxStorage: 5,
            withinLimits: true
        };
    }
}
