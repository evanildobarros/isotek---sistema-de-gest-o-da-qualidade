import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cliente Admin com SERVICE_ROLE_KEY (pode convidar usuários e ler todas as tabelas)
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Cliente normal para verificar autenticação do chamador
const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

// Limites dos Planos (Sincronizado com lib/constants.ts)
const PLAN_LIMITS: Record<string, number> = {
    'price_start_brl': 2,
    'price_pro_brl': 5,
    'price_ent_brl': 999,
    'start': 2, // Fallback para slugs antigos ou simplificados
    'pro': 5,
    'enterprise': 999
};

interface InviteUserRequest {
    email: string
    fullName: string
    role: 'admin' | 'operator' | 'viewer' | 'auditor'
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verificar autenticação do chamador
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token)

        if (authError || !caller) {
            return new Response(JSON.stringify({ error: 'Sessão inválida' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 2. Pegar dados do Admin (chamador)
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, company_id, role, is_super_admin')
            .eq('id', caller.id)
            .single()

        if (profileError || !callerProfile) {
            console.error('[admin-create-user] Erro ao buscar perfil do admin:', profileError);
            return new Response(JSON.stringify({
                error: 'Erro ao verificar permissões do administrador.',
                details: profileError?.message
            }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Apenas Admin da empresa ou Super Admin pode convidar
        const isCompanyAdmin = callerProfile.role === 'admin' && callerProfile.company_id;
        const isSuperAdmin = callerProfile.is_super_admin === true;

        if (!isCompanyAdmin && !isSuperAdmin) {
            console.warn(`[admin-create-user] Acesso negado: role=${callerProfile.role}, isSuperAdmin=${callerProfile.is_super_admin}`);
            return new Response(JSON.stringify({
                error: 'Apenas administradores podem convidar novos usuários.',
                debug: { role: callerProfile.role, isSuperAdmin: callerProfile.is_super_admin }
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 3. Ler dados do corpo da requisição
        let body: any;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Corpo da requisição inválido (JSON esperado).' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { email, fullName, role }: InviteUserRequest = body;

        console.log(`[admin-create-user] Solicitação: email=${email}, role=${role}, caller=${caller.id}`);

        if (!email || !fullName || !role) {
            return new Response(JSON.stringify({ error: 'Campos obrigatórios: email, fullName, role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Definir Company ID
        const targetCompanyId = callerProfile.company_id;

        if (!targetCompanyId && !isSuperAdmin) {
            return new Response(JSON.stringify({ error: 'Administrador não vinculado a uma empresa.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Verificar Limites do Plano (Super Admin ignora limite)
        if (targetCompanyId && !isSuperAdmin) {
            // Buscar info da empresa separadamente para evitar complexidade no join
            const { data: companyInfo, error: companyError } = await supabaseAdmin
                .from('company_info')
                .select('plan_id, max_users')
                .eq('id', targetCompanyId)
                .single();

            if (companyError) {
                console.error('[admin-create-user] Erro ao buscar info da empresa:', companyError);
                // Prosseguimos com fallback se necessário
            }

            const planId = companyInfo?.plan_id || 'start';
            const hardcodedLimit = PLAN_LIMITS[planId] || 2;
            const dbLimit = companyInfo?.max_users;

            const limit = dbLimit || hardcodedLimit;

            console.log(`[admin-create-user] Verificando limites: planId=${planId}, limit=${limit}`);

            const { count, error: countError } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', targetCompanyId);

            if (countError) {
                console.error('[admin-create-user] Erro ao contar usuários:', countError);
                return new Response(JSON.stringify({ error: 'Erro ao verificar contagem de usuários.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            console.log(`[admin-create-user] Contagem: ${count || 0} / ${limit}`);

            if ((count || 0) >= limit) {
                console.warn(`[admin-create-user] Limite atingido: ${count} >= ${limit}`);
                return new Response(JSON.stringify({
                    error: `Limite de usuários atingido para o plano atual (${limit} usuários).`,
                    details: {
                        count: count || 0,
                        limit: limit,
                        planId: planId
                    }
                }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        // 5. Convidar Usuário via Auth Admin
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: fullName,
                company_id: targetCompanyId,
                role: role
            }
        });

        if (inviteError) {
            console.error('[admin-create-user] Erro no inviteUserByEmail:', inviteError);
            return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 6. Garantir Perfil (Upsert para evitar conflito com trigger on_auth_user_created)
        // Nota: Removido campo 'email' pois ele não existe na tabela 'profiles'
        const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
            id: inviteData.user.id,
            full_name: fullName,
            company_id: targetCompanyId,
            role: role,
            is_active: true,
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (upsertError) {
            console.error('[admin-create-user] Erro ao criar perfil (upsert):', upsertError);
            // Mesmo se o perfil falhar, o convite foi enviado.
        }

        return new Response(JSON.stringify({
            message: "Convite enviado com sucesso!",
            userId: inviteData.user.id
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('[admin-create-user] Erro fatal:', err)
        return new Response(JSON.stringify({
            error: 'Erro interno do servidor.',
            message: err.message,
            stack: err.stack
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})

