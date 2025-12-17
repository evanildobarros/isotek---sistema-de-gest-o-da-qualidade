import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cliente Admin com SERVICE_ROLE_KEY (pode criar usuários)
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Cliente normal para verificar autenticação do chamador
const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

interface CreateUserRequest {
    email: string
    password: string
    fullName: string
    role: 'auditor' | 'admin' | 'operator' | 'viewer'
    companyId?: string // Opcional - se auditor, não precisa de empresa fixa
    phone?: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verificar autenticação do chamador
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({
                error: 'Token de autenticação não fornecido.',
                code: 'NO_AUTH_TOKEN'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Extrair token Bearer
        const token = authHeader.replace('Bearer ', '')

        // Verificar se o usuário é Super Admin
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token)

        if (authError || !caller) {
            return new Response(JSON.stringify({
                error: 'Token inválido ou expirado.',
                code: 'INVALID_TOKEN'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Verificar se o chamador é Super Admin
        console.log('Buscando perfil do chamador:', caller.id)
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('is_super_admin')
            .eq('id', caller.id)
            .single()

        console.log('Perfil encontrado:', callerProfile, 'Erro:', profileError)

        if (profileError) {
            console.error('Erro ao buscar perfil:', profileError)
            return new Response(JSON.stringify({
                error: 'Erro ao verificar permissões: ' + profileError.message,
                code: 'PROFILE_ERROR'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (!callerProfile?.is_super_admin) {
            return new Response(JSON.stringify({
                error: 'Acesso negado. Apenas Super Admins podem criar usuários.',
                code: 'FORBIDDEN'
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Parse do body
        const body: CreateUserRequest = await req.json()
        const { email, password, fullName, role, companyId, phone } = body

        // Validações
        if (!email || !password || !fullName || !role) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios: email, password, fullName, role',
                code: 'MISSING_FIELDS'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({
                error: 'Email inválido.',
                code: 'INVALID_EMAIL'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Validar senha
        if (password.length < 6) {
            return new Response(JSON.stringify({
                error: 'Senha deve ter no mínimo 6 caracteres.',
                code: 'WEAK_PASSWORD'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Validar role
        const validRoles = ['auditor', 'admin', 'operator', 'viewer']
        if (!validRoles.includes(role)) {
            return new Response(JSON.stringify({
                error: 'Role inválido. Use: auditor, admin, operator, viewer',
                code: 'INVALID_ROLE'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Verificar se email já existe
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const emailExists = existingUsers?.users?.some(u => u.email === email)

        if (emailExists) {
            return new Response(JSON.stringify({
                error: 'Este email já está cadastrado no sistema.',
                code: 'EMAIL_EXISTS'
            }), {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ===========================================
        // CRIAR USUÁRIO NO AUTH
        // ===========================================
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Já confirmar email automaticamente
            user_metadata: {
                full_name: fullName,
                role: role
            }
        })

        if (createError) {
            console.error('Erro ao criar usuário no Auth:', createError)
            return new Response(JSON.stringify({
                error: 'Erro ao criar usuário: ' + createError.message,
                code: 'CREATE_USER_ERROR'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ===========================================
        // CRIAR PERFIL NA TABELA profiles
        // ===========================================
        console.log('Criando perfil para:', newUser.user.id)
        const profileData: Record<string, any> = {
            id: newUser.user.id,
            full_name: fullName,
            role: role,
            is_super_admin: false,
            is_active: true
        }

        // Se não for auditor, vincular a uma empresa
        if (role !== 'auditor' && companyId) {
            profileData.company_id = companyId
        }

        console.log('profileData:', profileData)

        // Usar UPSERT em vez de INSERT para evitar erro 23505 se um Trigger já criou o perfil
        const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })

        if (profileInsertError) {
            console.error('Erro ao criar/atualizar perfil:', profileInsertError)

            // Tentar deletar o usuário criado para manter consistência
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)

            return new Response(JSON.stringify({
                error: 'Erro ao criar perfil do usuário: ' + profileInsertError.message,
                code: 'CREATE_PROFILE_ERROR'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // ===========================================
        // RESPOSTA DE SUCESSO
        // ===========================================
        return new Response(JSON.stringify({
            success: true,
            user: {
                id: newUser.user.id,
                email: newUser.user.email,
                fullName: fullName,
                role: role
            },
            message: `Usuário ${role} criado com sucesso!`
        }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err) {
        console.error('Erro interno:', err)
        return new Response(JSON.stringify({
            error: 'Erro interno do servidor.',
            code: 'INTERNAL_ERROR'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
