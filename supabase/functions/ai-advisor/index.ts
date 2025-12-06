import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Force redeploy check

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { query, context } = await req.json()

        let systemContext = "Você é o Isotek AI, um consultor sênior em ISO 9001:2015. Responda de forma curta, profissional e prática."

        // Contextos específicos
        if (context?.includes('contexto-analise')) systemContext += " O usuário está na SWOT. Ajude com fatores estratégicos."
        if (context?.includes('saidas-nao-conformes')) systemContext += " O usuário está na RNC. Ajude a descrever a falha tecnicamente."
        if (context?.includes('matriz-riscos')) systemContext += " O usuário está nos Riscos. Ajude a classificar probabilidade/impacto."

        const finalPrompt = `${systemContext}\n\nContexto da Tela: ${context}\nPergunta do Usuário: "${query}"`

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
            }
        )

        const data = await response.json()
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar. Tente novamente."

        return new Response(JSON.stringify({ answer }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})