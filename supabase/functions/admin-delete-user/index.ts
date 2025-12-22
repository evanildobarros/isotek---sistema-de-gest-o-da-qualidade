import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cliente Admin com SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Cliente normal para verificar autenticação do chamador
const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

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
            return new Response(JSON.stringify({ error: 'Erro ao verificar permissões do administrador.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const isCompanyAdmin = callerProfile.role === 'admin' && callerProfile.company_id;
        const isSuperAdmin = callerProfile.is_super_admin;

        if (!isCompanyAdmin && !isSuperAdmin) {
            return new Response(JSON.stringify({ error: 'Apenas administradores podem remover usuários.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 3. Ler dados do corpo da requisição
        const { userId } = await req.json()

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Campo obrigatório: userId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 4. Verificar se o usuário alvo pertence à mesma empresa (se não for super admin)
        if (!isSuperAdmin) {
            const { data: targetProfile, error: targetError } = await supabaseAdmin
                .from('profiles')
                .select('company_id')
                .eq('id', userId)
                .single()

            if (targetError || !targetProfile) {
                return new Response(JSON.stringify({ error: 'Usuário não encontrado.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            if (targetProfile.company_id !== callerProfile.company_id) {
                return new Response(JSON.stringify({ error: 'Você não tem permissão para remover este usuário.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        // 5. Deletar do Auth Admin
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Nota: O perfil será deletado via trigger `on_auth_user_deleted` se houver, 
        // ou deletamos manualmente aqui para garantir.
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        return new Response(JSON.stringify({
            message: "Usuário removido com sucesso!"
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Erro interno:', err)
        return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
