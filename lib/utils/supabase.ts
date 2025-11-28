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
