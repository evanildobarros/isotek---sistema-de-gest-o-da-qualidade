import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { companyName, cnpj, documentType } = await req.json()

        if (!companyName) {
            return new Response(JSON.stringify({
                error: 'Nome da empresa é obrigatório',
                code: 'MISSING_COMPANY_NAME'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (!GEMINI_API_KEY) {
            return new Response(JSON.stringify({
                error: 'API não configurada. Entre em contato com o suporte.',
                code: 'API_NOT_CONFIGURED'
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Diferentes prompts para diferentes tipos de documento
        const prompts: Record<string, string> = {
            'manual_qualidade': `
Atue como um Consultor Sênior da ISO 9001:2015.
Escreva um MANUAL DA QUALIDADE completo e profissional para a empresa "${companyName}"${cnpj ? ` (CNPJ: ${cnpj})` : ''}.

ESTRUTURA OBRIGATÓRIA (Use Markdown):

# MANUAL DA QUALIDADE
## ${companyName}

---

## 1. ESCOPO DO SISTEMA DE GESTÃO DA QUALIDADE
Descreva o escopo do SGQ, incluindo os produtos/serviços oferecidos e os processos cobertos.

## 2. REFERÊNCIAS NORMATIVAS
- ABNT NBR ISO 9001:2015 - Sistemas de gestão da qualidade - Requisitos
- ABNT NBR ISO 9000:2015 - Sistemas de gestão da qualidade - Fundamentos e vocabulário

## 3. TERMOS E DEFINIÇÕES
Defina os termos mais importantes utilizados neste manual.

## 4. CONTEXTO DA ORGANIZAÇÃO
### 4.1 Entendendo a Organização e seu Contexto
### 4.2 Partes Interessadas
### 4.3 Escopo do SGQ
### 4.4 Processos do SGQ

## 5. LIDERANÇA
### 5.1 Comprometimento da Alta Direção
### 5.2 Política da Qualidade
### 5.3 Papéis, Responsabilidades e Autoridades

## 6. PLANEJAMENTO
### 6.1 Riscos e Oportunidades
### 6.2 Objetivos da Qualidade
### 6.3 Planejamento de Mudanças

## 7. APOIO
### 7.1 Recursos
### 7.2 Competência
### 7.3 Conscientização
### 7.4 Comunicação
### 7.5 Informação Documentada

## 8. OPERAÇÃO
### 8.1 Planejamento e Controle Operacional
### 8.2 Requisitos para Produtos e Serviços
### 8.3 Projeto e Desenvolvimento
### 8.4 Controle de Processos, Produtos e Serviços Externos
### 8.5 Produção e Provisão de Serviço
### 8.6 Liberação de Produtos e Serviços
### 8.7 Controle de Saídas Não Conformes

## 9. AVALIAÇÃO DE DESEMPENHO
### 9.1 Monitoramento, Medição, Análise e Avaliação
### 9.2 Auditoria Interna
### 9.3 Análise Crítica pela Direção

## 10. MELHORIA
### 10.1 Generalidades
### 10.2 Não Conformidade e Ação Corretiva
### 10.3 Melhoria Contínua

---

**CONTROLE DE REVISÕES**
| Revisão | Data | Alterações | Aprovado por |
|---------|------|------------|--------------|
| 00 | ${new Date().toLocaleDateString('pt-BR')} | Emissão original | Representante da Direção |

Escreva um texto formal, corporativo e pronto para auditoria. Preencha todos os itens com conteúdo profissional e genérico.
`,
            'procedimento': `
Atue como um Consultor Sênior da ISO 9001:2015.
Escreva um PROCEDIMENTO OPERACIONAL PADRÃO completo e profissional para a empresa "${companyName}".

ESTRUTURA OBRIGATÓRIA (Use Markdown):

# PROCEDIMENTO OPERACIONAL PADRÃO
## ${companyName}

### 1. OBJETIVO
### 2. CAMPO DE APLICAÇÃO
### 3. RESPONSABILIDADES
### 4. DEFINIÇÕES
### 5. DESCRIÇÃO DO PROCEDIMENTO
#### 5.1 Fluxograma
#### 5.2 Detalhamento das Atividades
### 6. REGISTROS
### 7. DOCUMENTOS DE REFERÊNCIA
### 8. CONTROLE DE ALTERAÇÕES

Escreva um texto formal, corporativo e pronto para auditoria.
`,
            'politica_qualidade': `
Atue como um Consultor Sênior da ISO 9001:2015.
Escreva uma POLÍTICA DA QUALIDADE profissional para a empresa "${companyName}".

Requisitos:
- Deve ser apropriada ao propósito e contexto da organização
- Deve incluir compromisso com a satisfação do cliente
- Deve incluir compromisso com a melhoria contínua
- Deve incluir compromisso com o atendimento aos requisitos aplicáveis
- Deve ser concisa e memorável
- Use formato de tópicos/bullets

Use Markdown e um tom formal e inspirador.
`
        }

        const prompt = prompts[documentType || 'manual_qualidade'] || prompts['manual_qualidade']

        console.log(`📝 Gerando documento "${documentType}" para ${companyName}...`)

        // Chamada para Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.6,
                        maxOutputTokens: 8192, // Documento longo
                    }
                })
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini API Error:', response.status, errorText)

            return new Response(JSON.stringify({
                error: 'Erro ao gerar documento. Tente novamente.',
                code: 'API_ERROR'
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const data = await response.json()
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "# Erro na geração\n\nNão foi possível gerar o documento. Por favor, tente novamente."

        console.log(`✅ Documento gerado com sucesso! (${content.length} caracteres)`)

        return new Response(JSON.stringify({
            content,
            documentType: documentType || 'manual_qualidade',
            generatedAt: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        console.error('Erro na Edge Function:', errorMessage)

        return new Response(JSON.stringify({
            error: 'Erro inesperado ao gerar documento.',
            code: 'INTERNAL_ERROR'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
