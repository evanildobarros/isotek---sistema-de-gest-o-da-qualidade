import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapa de conhecimento do App (Campos e Regras de cada tela)
const getAppKnowledge = (path: string) => {
    if (path.includes('contexto-analise')) {
        return `
      TELA: ANÁLISE SWOT (Contexto da Organização)
      CAMPOS DO FORMULÁRIO:
      1. Tipo: Força (Interno/Positivo), Fraqueza (Interno/Negativo), Oportunidade (Externo/Positivo), Ameaça (Externo/Negativo).
      2. Descrição: O texto detalhado do item.
      
      SUA MISSÃO: Ajude o usuário a preencher. Se ele perguntar "O que colocar em Forças?", dê exemplos reais como "Equipe treinada", "Patente própria". Explique a diferença entre fatores internos e externos.
    `
    }

    if (path.includes('saidas-nao-conformes')) {
        return `
      TELA: REGISTRO DE NÃO CONFORMIDADE (RNC - Produto/Serviço)
      CAMPOS DO FORMULÁRIO:
      1. Descrição: O defeito exato (O que aconteceu?).
      2. Origem: Opções [Produção, Fornecedor, Cliente/Reclamação].
      3. Severidade: Opções [Baixa, Média, Crítica].
      4. Disposição: O que fazer com a peça agora? (Retrabalho, Refugo, Concessão).
      
      SUA MISSÃO: Oriente o preenchimento técnico. Ajude a classificar a severidade. Se o usuário disser "O cliente reclamou", sugira selecionar Origem: "Cliente/Reclamação".
    `
    }

    if (path.includes('matriz-riscos')) {
        return `
      TELA: MATRIZ DE RISCOS E OPORTUNIDADES
      CAMPOS DO FORMULÁRIO:
      1. Tipo: Risco (Negativo) ou Oportunidade (Positivo).
      2. Probabilidade: Nota de 1 (Muito Raro) a 5 (Quase Certo).
      3. Impacto: Nota de 1 (Insignificante) a 5 (Catastrófico).
      4. Plano de Ação: O que fazer para mitigar ou aproveitar.
      
      SUA MISSÃO: Ajude a calibrar a nota de Probabilidade x Impacto. Sugira planos de ação (ex: "Para risco de falta de luz, sugira Gerador").
    `
    }

    if (path.includes('partes-interessadas')) {
        return `
      TELA: PARTES INTERESSADAS
      CAMPOS DO FORMULÁRIO:
      1. Nome: Quem é? (Ex: Clientes, Governo, Vizinhos).
      2. Tipo: Categoria (Cliente, Fornecedor, Regulador...).
      3. Necessidades: O que é obrigatório para eles?
      4. Expectativas: O que seria desejável?
      
      SUA MISSÃO: Ajude a diferenciar "Necessidade" (mandatório) de "Expectativa" (desejável).
    `
    }

    return "TELA GERAL: O usuário está navegando no sistema. Responda dúvidas gerais sobre ISO 9001:2015."
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { query, context } = await req.json()

        // 1. Obter o conhecimento específico da tela atual
        const specificKnowledge = getAppKnowledge(context || '')

        // 2. Montar o Prompt de Sistema Robusto
        const systemPrompt = `
      VOCÊ É: O Isotek AI, um consultor sênior de Qualidade (ISO 9001) e ESPECIALISTA neste software.
      
      OBJETIVO: Orientar o usuário a PREENCHER O FORMULÁRIO da tela atual corretamente.
      
      REGRA DE OURO: Seja prático. Use os nomes exatos dos campos do formulário listados abaixo.
      
      CONTEXTO ATUAL:
      ${specificKnowledge}
      
      PERGUNTA DO USUÁRIO: "${query}"
      
      RESPOSTA (Mantenha curto, use Markdown, máx 3 parágrafos):
    `

        // 3. Chamar o Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
            }
        )

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.statusText}`)
        }

        const data = await response.json()
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui processar a resposta."

        return new Response(JSON.stringify({ answer }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})