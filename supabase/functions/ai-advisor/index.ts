import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapa de conhecimento do App
const getAppKnowledge = (path: string) => {
    if (path?.includes('contexto-analise')) {
        return `
      TELA: ANÁLISE SWOT (Contexto da Organização)
      CAMPOS: Força, Fraqueza, Oportunidade, Ameaça.
      MISSÃO: Ajude a preencher fatores estratégicos internos e externos.
    `
    }
    if (path?.includes('saidas-nao-conformes')) {
        return `
      TELA: RNC (Não Conformidade)
      CAMPOS: Origem (Produção/Fornecedor), Severidade, Disposição.
      MISSÃO: Ajude a descrever a falha tecnicamente e sugerir a disposição correta.
    `
    }
    if (path?.includes('matriz-riscos')) {
        return `
      TELA: GESTÃO DE RISCOS
      CAMPOS: Tipo (Risco/Oportunidade), Probabilidade (1-5), Impacto (1-5).
      MISSÃO: Ajude a classificar o nível do risco e sugerir planos de ação.
    `
    }
    return "TELA GERAL: O usuário está navegando no sistema SGQ ISO 9001."
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { query, context } = await req.json()

        const specificKnowledge = getAppKnowledge(context || '')

        const systemPrompt = `
      Você é o Isotek AI, um consultor especialista em ISO 9001:2015.
      
      CONTEXTO DO USUÁRIO:
      ${specificKnowledge}
      
      DIRETRIZES:
      - Seja direto e profissional.
      - Use formatação Markdown (negrito, listas).
      - Responda em português do Brasil.
      - Foco total em ajudar a preencher o formulário atual.
      
      PERGUNTA: ${query}
    `

        // Chamada à API do Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                })
            }
        )

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Gemini API Error: ${err}`)
        }

        const data = await response.json()
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a resposta."

        return new Response(JSON.stringify({ answer }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Erro na Edge Function:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})