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
            .select(`
                id, 
                company_id, 
                role, 
                is_super_admin,
                company_info (
                    id,
                    plan_id,
                    max_users
                )
            `)
            .eq('id', caller.id)
            .single()

        if (profileError || !callerProfile) {
            return new Response(JSON.stringify({ error: 'Erro ao verificar permissões do administrador.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Apenas Admin da empresa ou Super Admin pode convidar
        const isCompanyAdmin = callerProfile.role === 'admin' && callerProfile.company_id;
        const isSuperAdmin = callerProfile.is_super_admin;

        if (!isCompanyAdmin && !isSuperAdmin) {
            return new Response(JSON.stringify({ error: 'Apenas administradores podem convidar novos usuários.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 3. Ler dados do corpo da requisição
        const { email, fullName, role }: InviteUserRequest = await req.json()

        if (!email || !fullName || !role) {
            return new Response(JSON.stringify({ error: 'Campos obrigatórios: email, fullName, role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Definir Company ID (se for super admin e não passou, pode ser um problema, mas aqui focamos no fluxo de empresa)
        const targetCompanyId = isSuperAdmin ? callerProfile.company_id : callerProfile.company_id; // Simplicidade: convida para a mesma empresa

        if (!targetCompanyId && !isSuperAdmin) {
            return new Response(JSON.stringify({ error: 'Administrador não vinculado a uma empresa.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Verificar Limites do Plano
        if (targetCompanyId) {
            const planId = (callerProfile.company_info as any)?.plan_id || 'start';
            const hardcodedLimit = PLAN_LIMITS[planId] || 2;
            const dbLimit = (callerProfile.company_info as any)?.max_users;

            const limit = dbLimit || hardcodedLimit;

            const { count, error: countError } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', targetCompanyId);

            if (countError) {
                return new Response(JSON.stringify({ error: 'Erro ao verificar contagem de usuários.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            if ((count || 0) >= limit) {
                return new Response(JSON.stringify({
                    error: `Limite de usuários atingido para o plano atual (${limit} usuários).`
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
            return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 6. Garantir Perfil (Upsert para evitar conflito com trigger on_auth_user_created)
        const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
            id: inviteData.user.id,
            email: email,
            full_name: fullName,
            company_id: targetCompanyId,
            role: role,
            is_active: true,
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (upsertError) {
            console.error('Erro ao criar perfil:', upsertError);
            // Mesmo se o perfil falhar, o convite foi enviado. Podemos registrar o erro ou tentar novamente.
        }

        return new Response(JSON.stringify({
            message: "Convite enviado com sucesso!",
            userId: inviteData.user.id
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Erro interno:', err)
        return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})

