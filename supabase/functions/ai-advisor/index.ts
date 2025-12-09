import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting simples em memória (por IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 20 // máximo de requisições
const RATE_WINDOW = 60000 // janela de 1 minuto

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const record = rateLimitMap.get(ip)

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
        return { allowed: true, remaining: RATE_LIMIT - 1 }
    }

    if (record.count >= RATE_LIMIT) {
        return { allowed: false, remaining: 0 }
    }

    record.count++
    return { allowed: true, remaining: RATE_LIMIT - record.count }
}

// Mapa de conhecimento expandido do App
const getAppKnowledge = (path: string) => {
    if (path?.includes('contexto-analise') || path?.includes('definicao-estrategica')) {
        return `
      TELA: ANÁLISE SWOT E DEFINIÇÃO ESTRATÉGICA (ISO 9001 - 4.1/4.2)
      CAMPOS: Força, Fraqueza, Oportunidade, Ameaça, Política da Qualidade, Objetivos.
      MISSÃO: Ajude a preencher fatores estratégicos internos/externos e definir diretrizes.
    `
    }
    if (path?.includes('saidas-nao-conformes')) {
        return `
      TELA: RNC - REGISTRO DE NÃO CONFORMIDADE (ISO 9001 - 8.7)
      CAMPOS: Origem (Produção/Fornecedor/Cliente), Descrição, Severidade, Disposição.
      MISSÃO: Ajude a descrever a falha tecnicamente e sugerir a disposição correta (segregar, retrabalhar, aceitar com concessão, sucatar).
      ANÁLISE DE IMAGEM: Se o usuário enviar uma foto, analise o defeito visualmente e descreva tecnicamente o problema observado.
    `
    }
    if (path?.includes('acoes-corretivas')) {
        return `
      TELA: AÇÕES CORRETIVAS (ISO 9001 - 10.2)
      CAMPOS: Causa raiz, Ação corretiva, Responsável, Prazo, Verificação de eficácia.
      MISSÃO: Ajude a usar ferramentas como 5 Porquês, Ishikawa, e definir ações efetivas.
    `
    }
    if (path?.includes('matriz-riscos')) {
        return `
      TELA: GESTÃO DE RISCOS E OPORTUNIDADES (ISO 9001 - 6.1)
      CAMPOS: Tipo (Risco/Oportunidade), Probabilidade (1-5), Impacto (1-5), Ação.
      MISSÃO: Ajude a classificar o nível do risco e sugerir planos de ação proporcionais.
    `
    }
    if (path?.includes('auditorias')) {
        return `
      TELA: AUDITORIAS INTERNAS (ISO 9001 - 9.2)
      CAMPOS: Escopo, Critérios, Auditor, Data, Constatações, Não conformidades.
      MISSÃO: Ajude a elaborar checklists, avaliar conformidade e redigir constatações.
      ANÁLISE DE IMAGEM: Se o usuário enviar uma foto, analise evidências de conformidade/não conformidade visíveis.
    `
    }
    if (path?.includes('indicadores')) {
        return `
      TELA: INDICADORES DE DESEMPENHO (ISO 9001 - 9.1.3)
      CAMPOS: Nome do KPI, Meta, Fórmula, Frequência, Responsável.
      MISSÃO: Ajude a definir KPIs SMART e métodos de monitoramento eficazes.
    `
    }
    if (path?.includes('documentos')) {
        return `
      TELA: CONTROLE DE DOCUMENTOS (ISO 9001 - 7.5)
      CAMPOS: Código, Título, Versão, Status (Rascunho/Vigente/Obsoleto), Responsável.
      MISSÃO: Ajude a estruturar documentos, definir códigos e controlar versões.
      ANÁLISE DE IMAGEM: Se o usuário enviar uma foto de documento, ajude a identificar informações e sugerir melhorias.
    `
    }
    if (path?.includes('fornecedores')) {
        return `
      TELA: AVALIAÇÃO DE FORNECEDORES (ISO 9001 - 8.4)
      CAMPOS: Fornecedor, Critérios de avaliação, Pontuação, Status (Aprovado/Condicional/Reprovado).
      MISSÃO: Ajude a definir critérios de qualificação e avaliar desempenho de fornecedores.
    `
    }
    if (path?.includes('analise-critica')) {
        return `
      TELA: ANÁLISE CRÍTICA PELA DIREÇÃO (ISO 9001 - 9.3)
      CAMPOS: Entradas (resultados de auditorias, indicadores, feedback), Saídas (decisões, melhorias).
      MISSÃO: Ajude a estruturar a pauta e documentar as decisões da reunião de análise crítica.
    `
    }
    if (path?.includes('usuarios') || path?.includes('perfil')) {
        return `
      TELA: GESTÃO DE USUÁRIOS E PERFIL
      CAMPOS: Nome, Email, Cargo, Permissões.
      MISSÃO: Ajude com questões sobre competência de pessoal (ISO 9001 - 7.2).
    `
    }
    return `
      TELA GERAL: O usuário está navegando no sistema SGQ ISO 9001.
      MISSÃO: Forneça orientações gerais sobre gestão da qualidade e norma ISO 9001:2015.
      ANÁLISE DE IMAGEM: Se o usuário enviar uma imagem, analise-a no contexto de gestão da qualidade.
    `
}

// Sistema de prompt otimizado (com suporte a imagem)
const buildSystemPrompt = (knowledge: string, history: string, hasImage: boolean) => `
Você é o **Isotek AI**, um consultor sênior especialista em ISO 9001:2015 e Sistemas de Gestão da Qualidade (SGQ).

${knowledge}

DIRETRIZES OBRIGATÓRIAS:
1. Responda SEMPRE em português do Brasil
2. Seja CONCISO e DIRETO (máximo 3 parágrafos curtos)
3. Use formatação Markdown: **negrito**, listas com -, \`código\`
4. Quando aplicável, cite o requisito ISO específico (ex: "Conforme ISO 9001:2015 - 8.7...")
5. Se não souber algo, admita e sugira consultar um especialista
6. NÃO invente informações técnicas ou normativas
7. Foco total em ajudar o usuário com a tarefa atual
${hasImage ? `8. ANÁLISE DE IMAGEM: Analise a imagem enviada no contexto de gestão da qualidade ISO 9001. Descreva o que você vê e forneça insights relevantes.` : ''}

${history ? `HISTÓRICO DA CONVERSA:\n${history}\n` : ''}
`

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    const rateCheck = checkRateLimit(clientIP)

    if (!rateCheck.allowed) {
        return new Response(JSON.stringify({
            error: 'Limite de requisições atingido. Aguarde 1 minuto e tente novamente.',
            code: 'RATE_LIMIT_EXCEEDED'
        }), {
            status: 429,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': '0',
                'Retry-After': '60'
            }
        })
    }

    try {
        const { query, context, history, image } = await req.json()

        // Validação: precisa ter query OU imagem
        const hasQuery = query && typeof query === 'string' && query.trim().length > 0
        const hasImage = image && typeof image === 'string' && image.length > 0

        if (!hasQuery && !hasImage) {
            return new Response(JSON.stringify({
                error: 'Por favor, digite uma pergunta ou envie uma imagem.',
                code: 'EMPTY_QUERY'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY não configurada')
            return new Response(JSON.stringify({
                error: 'Assistente IA temporariamente indisponível. Entre em contato com o suporte.',
                code: 'API_NOT_CONFIGURED'
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const specificKnowledge = getAppKnowledge(context || '')

        // Formatar histórico se existir
        let historyText = ''
        if (history && Array.isArray(history) && history.length > 0) {
            historyText = history
                .slice(-6) // últimas 6 mensagens (3 trocas)
                .map((msg: { role: string; content: string }) =>
                    `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`
                )
                .join('\n')
        }

        const systemPrompt = buildSystemPrompt(specificKnowledge, historyText, hasImage)
        const userMessage = hasQuery ? query : 'Analise esta imagem no contexto de gestão da qualidade ISO 9001.'
        const fullPrompt = `${systemPrompt}\n\n**PERGUNTA ATUAL:** ${userMessage}`

        // Construir o conteúdo da requisição (texto + imagem se houver)
        const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = []

        // Adicionar texto
        parts.push({ text: fullPrompt })

        // Adicionar imagem se existir
        if (hasImage) {
            // Extrair dados da imagem base64
            // Formato esperado: "data:image/jpeg;base64,/9j/4AAQSkZ..."
            const matches = image.match(/^data:(.+);base64,(.+)$/)
            if (matches && matches.length === 3) {
                const mimeType = matches[1]
                const base64Data = matches[2]

                // Validar tipo de imagem
                const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                if (validMimeTypes.includes(mimeType)) {
                    parts.push({
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    })
                }
            }
        }

        // Chamada à API do Gemini - usando modelo 1.5-flash (suporta multimodal)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: hasImage ? 1024 : 512, // Mais tokens para análise de imagem
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ]
                })
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            // Log apenas no servidor, não enviar detalhes ao cliente
            console.error('Gemini API Error:', response.status)

            if (response.status === 429) {
                return new Response(JSON.stringify({
                    error: 'O serviço de IA está temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.',
                    code: 'API_RATE_LIMIT'
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            if (response.status === 401 || response.status === 403) {
                return new Response(JSON.stringify({
                    error: 'Erro de autenticação com o serviço de IA. Entre em contato com o suporte.',
                    code: 'API_AUTH_ERROR'
                }), {
                    status: 503,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Erro genérico - não expor detalhes técnicos
            return new Response(JSON.stringify({
                error: 'Serviço de IA temporariamente indisponível. Tente novamente em alguns segundos.',
                code: 'API_ERROR'
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const data = await response.json()
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Desculpe, não consegui processar sua solicitação. Tente reformular a pergunta."

        return new Response(JSON.stringify({
            answer,
            rateLimitRemaining: rateCheck.remaining
        }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': rateCheck.remaining.toString()
            },
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error("Erro na Edge Function:", errorMessage)
        return new Response(JSON.stringify({
            error: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
            code: 'INTERNAL_ERROR'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})