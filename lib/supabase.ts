import { createClient } from '@supabase/supabase-js';

// Obtém as credenciais do ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação de segurança - Alerta se credenciais não estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '⚠️ ERRO DE CONFIGURAÇÃO SUPABASE:\n' +
        'As variáveis de ambiente não foram encontradas.\n' +
        'Verifique se existe um arquivo .env na raiz com:\n' +
        '  - VITE_SUPABASE_URL\n' +
        '  - VITE_SUPABASE_ANON_KEY\n' +
        'Encontre estas chaves em: Supabase Dashboard → Settings → API'
    );
}

// Verifica se as credenciais são válidas (não são placeholders)
export const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key' &&
    supabaseUrl.includes('.supabase.co');

// Cria o cliente Supabase
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    }
);

// Log de status (apenas em desenvolvimento)
if (import.meta.env.DEV) {
    if (isSupabaseConfigured) {
        console.log('✅ Supabase configurado corretamente');
    } else {
        console.warn('⚠️ Supabase em modo offline (sem persistência de dados)');
    }
}
