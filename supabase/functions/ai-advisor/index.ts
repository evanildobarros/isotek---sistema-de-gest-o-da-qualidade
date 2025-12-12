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

// Mapa de conhecimento expandido do App - VERSÃO DETALHADA
const getAppKnowledge = (path: string) => {
    if (path?.includes('contexto-analise') || path?.includes('definicao-estrategica')) {
        return `
TELA: ANÁLISE SWOT E DEFINIÇÃO ESTRATÉGICA (ISO 9001 - 4.1/4.2)

CAMPOS DO SWOT:
- Tipo: Força (interno +), Fraqueza (interno -), Oportunidade (externo +), Ameaça (externo -)
- Descrição: Texto livre detalhando o fator
- Impacto: Alto, Médio, Baixo

DEFINIÇÃO ESTRATÉGICA:
- Missão: Razão de existir da organização
- Visão: Onde a empresa quer chegar no futuro
- Valores: Princípios que guiam as decisões
- Política da Qualidade: Compromisso da alta direção com a qualidade

REGRAS DE NEGÓCIO:
- Cada fator SWOT deve ter pelo menos uma ação vinculada na Matriz de Riscos
- A Política deve ser revisada anualmente e aprovada pela direção
- Fatores de Alta severidade geram riscos/oportunidades automaticamente

MISSÃO: Ajude o usuário a identificar fatores internos e externos que impactam o SGQ, redigir declarações estratégicas claras e objetivas.
    `
    }
    if (path?.includes('partes-interessadas')) {
        return `
TELA: PARTES INTERESSADAS (ISO 9001 - 4.2)

CAMPOS:
- Nome: Identificação da parte interessada (ex: "Clientes diretos", "ANVISA")
- Tipo: Cliente, Fornecedor, Governo, Colaborador, Sociedade, Acionista
- Necessidades: O que essa parte precisa da organização
- Expectativas: O que essa parte espera além do básico
- Frequência de Monitoramento: Diária, Semanal, Mensal, Trimestral, Anual

REGRAS DE NEGÓCIO:
- Todas as partes interessadas relevantes devem ser identificadas
- Necessidades e expectativas devem ser atualizadas periodicamente
- Partes com alta influência devem ter monitoramento mais frequente

MISSÃO: Ajude a identificar stakeholders, definir suas necessidades/expectativas e estabelecer frequência adequada de monitoramento.
    `
    }
    if (path?.includes('processos-escopo')) {
        return `
TELA: PROCESSOS E ESCOPO DO SGQ (ISO 9001 - 4.3/4.4)

CAMPOS DE PROCESSO:
- Nome: Nome do processo (ex: "Vendas", "Produção", "RH")
- Responsável/Dono: Quem gerencia o processo
- Entradas: O que o processo recebe (informações, materiais)
- Saídas: O que o processo entrega (produtos, serviços, documentos)
- Recursos: O que é necessário para executar (pessoas, equipamentos, sistemas)

ESCOPO DO SGQ:
- Descrição do escopo: Produtos/serviços e unidades cobertas
- Exclusões: Requisitos não aplicáveis (com justificativa)
- Unidades: Matriz e filiais incluídas no SGQ

REGRAS DE NEGÓCIO:
- Todo processo deve ter um dono claramente definido
- Interações entre processos devem ser mapeadas
- Exclusões só podem ser dos requisitos do item 7 (Apoio) ou 8 (Operação)

MISSÃO: Ajude a mapear processos com entradas/saídas claras e definir o escopo do SGQ.
    `
    }
    if (path?.includes('politica-qualidade') || path?.includes('responsabilidades')) {
        return `
TELA: LIDERANÇA - POLÍTICA E RESPONSABILIDADES (ISO 9001 - 5.0)

ABA POLÍTICA DA QUALIDADE:
- Conteúdo: Texto da política (compromissos da alta direção)
- Versão: Número da versão (ex: 1.0, 2.0)
- Data de Aprovação: Quando foi aprovada pela direção
- Histórico: Todas as versões anteriores são mantidas

ABA RESPONSABILIDADES:
- Cargo: Nome da função (ex: "Gerente da Qualidade")
- Departamento: Área da empresa
- Responsabilidades: O que a pessoa deve fazer
- Autoridades: O que a pessoa pode decidir

FLUXO DE VERSIONAMENTO:
1. Editar política → Salvar como nova versão
2. Registrar data de aprovação
3. Versões antigas ficam no histórico (não podem ser deletadas)

REGRAS DE NEGÓCIO:
- Política deve ser apropriada ao contexto da organização
- Deve incluir compromisso com melhoria contínua e requisitos aplicáveis
- Deve estar disponível e comunicada a todos

MISSÃO: Ajude a redigir políticas claras e a definir responsabilidades/autoridades para cada função.
    `
    }
    if (path?.includes('saidas-nao-conformes')) {
        return `
TELA: RNC - REGISTRO DE NÃO CONFORMIDADE DE PRODUTO (ISO 9001 - 8.7)

CAMPOS:
- Descrição: Detalhe técnico do problema encontrado
- Data de Ocorrência: Quando foi detectado
- Origem: "Produção", "Fornecedor", "Cliente/Reclamação"
- Severidade: "Baixa", "Média", "Crítica"
- Status: "Aberto" → "Em análise" → "Resolvido"
- Quantidade Afetada: Número de peças/lotes
- Foto: Evidência visual do problema

DISPOSIÇÕES (quando resolvido):
- "Retrabalho": Corrigir e reinspecionar
- "Refugo": Descartar o material
- "Concessão/Aceite": Usar como está (com aprovação do cliente)
- "Devolução": Retornar ao fornecedor
- Justificativa: Porquê dessa disposição
- Autorizado por: Quem aprovou a decisão

FLUXO:
1. Detectar NC → Preencher formulário (status: Aberto)
2. Segregar produto → Analisar (status: Em análise)
3. Definir disposição → Executar → Registrar (status: Resolvido)

ANÁLISE DE IMAGEM: Se o usuário enviar uma foto, analise o defeito visualmente, descreva tecnicamente o problema e sugira a severidade e disposição adequada.

MISSÃO: Ajude a descrever falhas tecnicamente, sugerir disposições apropriadas e garantir rastreabilidade.
    `
    }
    if (path?.includes('acoes-corretivas')) {
        return `
TELA: AÇÕES CORRETIVAS - RNC (ISO 9001 - 10.2)

CAMPOS:
- Código: Sequencial automático (ex: RNC-2024-001)
- Origem: "Auditoria Interna", "Reclamação de Cliente", "Indicador não atingido", "Falha de processo"
- Descrição da NC: O que aconteceu de errado
- Causa Raiz: Análise usando 5 Porquês ou Ishikawa
- Ação Imediata: Contenção do problema
- Prazo: Data limite para conclusão
- Responsável: Quem vai resolver
- Status: "Aberta" → "Análise de Causa" → "Implementação" → "Verificação de Eficácia" → "Concluída"

TAREFAS (5W2H):
- O quê: Descrição da tarefa
- Quem: Responsável
- Quando: Data limite
- Concluída: Sim/Não

VERIFICAÇÃO DE EFICÁCIA:
- Problema voltou a ocorrer? Sim/Não
- Parecer do gestor: Análise da efetividade

FERRAMENTAS DE ANÁLISE:
- 5 Porquês: Perguntar "Por quê?" 5 vezes até chegar à causa raiz
- Ishikawa: Diagrama espinha de peixe (6M: Mão de obra, Método, Máquina, Material, Meio ambiente, Medição)

FLUXO COMPLETO:
1. Registrar NC e ação imediata
2. Analisar causa raiz (5 Porquês/Ishikawa)
3. Definir plano de ação (5W2H)
4. Implementar ações
5. Verificar eficácia após 30-90 dias
6. Encerrar se eficaz, ou reabrir com nova análise

MISSÃO: Ajude na análise de causa raiz, estruturação do plano de ação 5W2H e verificação de eficácia.
    `
    }
    if (path?.includes('matriz-riscos') || path?.includes('planos-de-acao')) {
        return `
TELA: GESTÃO DE RISCOS E OPORTUNIDADES (ISO 9001 - 6.1)

CAMPOS DE RISCO/OPORTUNIDADE:
- Tipo: "Risco" (ameaça) ou "Oportunidade"
- Descrição: O que pode acontecer
- Fonte: Fator SWOT que originou (vinculado)
- Processo/Área: Onde impacta
- Probabilidade: 1 (Raro) a 5 (Quase certo)
- Impacto/Severidade: 1 (Insignificante) a 5 (Catastrófico)
- Nível de Risco: Probabilidade × Impacto (automático)
- Ação Planejada: O que fazer para mitigar/explorar

MATRIZ DE CLASSIFICAÇÃO:
- Verde (1-4): Baixo - Monitorar
- Amarelo (5-9): Médio - Ação preventiva
- Laranja (10-15): Alto - Prioridade de tratamento  
- Vermelho (16-25): Crítico - Ação imediata

PLANO DE AÇÃO:
- Descrição: O que fazer
- Responsável: Quem vai fazer
- Prazo: Quando concluir
- Status: Pendente/Concluída

REGRAS DE NEGÓCIO:
- Riscos críticos devem ter ação imediata
- Oportunidades devem ser avaliadas para aproveitamento
- Reavaliar riscos após implementação de ações
- Riscos de processos core têm maior peso

MISSÃO: Ajude a avaliar probabilidade/impacto, classificar riscos e definir ações proporcionais.
    `
    }
    if (path?.includes('objetivos-qualidade')) {
        return `
TELA: OBJETIVOS DA QUALIDADE (ISO 9001 - 6.2)

CAMPOS:
- Nome do Objetivo: Claro e mensurável (ex: "Reduzir retrabalho em 20%")
- Processo Relacionado: Qual processo é impactado
- Indicador/Métrica: Como medir (ex: "% de peças retrabalhadas")
- Meta: Valor numérico a atingir
- Valor Atual: Última medição
- Frequência: Mensal, Trimestral, Semestral, Anual
- Prazo Final: Data limite
- Plano de Ação: O que fazer para atingir
- Status: "Pendente", "No Prazo", "Em Risco", "Atingido"

CRITÉRIOS SMART:
- S (Específico): O que exatamente será alcançado
- M (Mensurável): Pode ser medido quantitativamente
- A (Atingível): É realista e alcançável
- R (Relevante): Contribui para a política da qualidade
- T (Temporal): Tem prazo definido

REGRAS DE NEGÓCIO:
- Objetivos devem ser coerentes com a Política da Qualidade
- Devem ser monitorados na frequência definida
- Objetivos não atingidos geram análise de causa

MISSÃO: Ajude a definir objetivos SMART, métricas adequadas e planos de ação para atingimento.
    `
    }
    if (path?.includes('auditorias')) {
        return `
TELA: AUDITORIAS INTERNAS (ISO 9001 - 9.2)

CAMPOS:
- Escopo: Área/processo a ser auditado (ex: "Vendas e Marketing")
- Tipo: "Auditoria Interna", "Auditoria de Processo", "Auditoria Externa"
- Auditor: Nome do auditor responsável (deve ser independente da área)
- Data: Data planejada/realizada
- Status: "Agendada", "Em Andamento", "Concluída", "Atrasada"
- Progresso: 0-100%
- Notas/Observações: Anotações gerais

CHECKLIST DE AUDITORIA:
- Item/Requisito: O que verificar
- Conforme: Sim/Não
- Evidência: O que foi verificado
- Observação: Comentários

CONSTATAÇÕES:
- Tipo: Conformidade, Oportunidade de Melhoria, Não Conformidade Menor, NC Maior
- Descrição: O que foi encontrado
- Requisito: Qual item da norma se aplica
- Evidência Objetiva: Fatos observados

FLUXO:
1. Planejar (definir escopo, auditor, data)
2. Preparar checklist baseado nos requisitos
3. Executar auditoria (coletar evidências)
4. Relatar constatações
5. Abrir ações corretivas para NCs
6. Acompanhar fechamento

REGRAS DE NEGÓCIO:
- Auditor deve ser independente da área auditada
- NCs maiores requerem ação corretiva imediata
- Programa de auditoria deve cobrir todos os processos ao longo do ano

ANÁLISE DE IMAGEM: Se o usuário enviar uma foto, analise evidências de conformidade/não conformidade visíveis, sugira como documentar a constatação.

MISSÃO: Ajude a elaborar checklists, avaliar conformidade, redigir constatações e classificar achados.
    `
    }
    if (path?.includes('indicadores')) {
        return `
TELA: INDICADORES DE DESEMPENHO - KPIs (ISO 9001 - 9.1.3)

CAMPOS:
- Nome do Indicador: KPI claro (ex: "Satisfação do Cliente")
- Fórmula/Método: Como calcular
- Meta: Valor objetivo
- Valor Atual: Última medição
- Unidade: %, R$, Dias, Peças, etc.
- Frequência: Quando medir
- Responsável: Quem coleta e analisa
- Tendência: ↑ Subindo, ↓ Descendo, → Estável

CATEGORIAS DE KPIs:
- Satisfação do Cliente: NPS, Pesquisas, Reclamações
- Qualidade: Índice de refugo, Retrabalho, PPM
- Entrega: OTIF (On Time In Full), Lead time
- Fornecedores: IQF (Índice de Qualidade do Fornecedor)
- Produtividade: OEE, Eficiência
- Financeiro: Custo da não qualidade

REGRAS DE NEGÓCIO:
- Indicadores abaixo da meta por 3 períodos geram análise de causa
- Dashboard atualizado conforme frequência definida
- Tendências negativas devem gerar ações preventivas

MISSÃO: Ajude a definir KPIs relevantes, fórmulas de cálculo, metas realistas e análise de tendências.
    `
    }
    if (path?.includes('documentos')) {
        return `
TELA: GESTÃO DE DOCUMENTOS - GED (ISO 9001 - 7.5)

CAMPOS:
- Código: Identificador único (ex: "PQ-001", "IT-PROD-003")
- Título: Nome do documento
- Versão: Controle de versão (ex: "Rev. 01")
- Status: "Rascunho", "Em Aprovação", "Vigente", "Obsoleto"
- Arquivo: PDF, DOCX ou imagem (máx 10MB)
- Responsável: Quem elaborou/aprovou

TIPOS DE DOCUMENTOS:
- MQ: Manual da Qualidade
- PQ: Procedimento da Qualidade
- IT: Instrução de Trabalho
- FQ: Formulário da Qualidade
- RQ: Registro da Qualidade

FLUXO DE APROVAÇÃO:
1. Elaborar → Status: Rascunho
2. Revisar → Status: Em Aprovação
3. Aprovar → Status: Vigente (versão anterior vira Obsoleto)
4. Distribuir aos interessados

REGRAS DE NEGÓCIO:
- Apenas documentos "Vigente" podem ser usados na operação
- Documentos obsoletos são mantidos para histórico
- Novos uploads de documento existente incrementam a versão
- Formatos permitidos: PDF, DOCX, PNG, JPG

ANÁLISE DE IMAGEM: Se o usuário enviar uma foto de documento, ajude a identificar tipo de documento, sugerir código e estrutura adequada.

MISSÃO: Ajude a estruturar documentos, definir códigos padronizados e controlar versões adequadamente.
    `
    }
    if (path?.includes('treinamentos')) {
        return `
TELA: COMPETÊNCIAS E TREINAMENTOS (ISO 9001 - 7.2/7.3)

CADASTRO DE COLABORADORES:
- Nome: Nome completo
- Cargo: Função exercida
- Departamento: Área da empresa
- Data de Admissão: Quando entrou
- Status: Ativo/Inativo

MATRIZ DE TREINAMENTOS:
- Nome do Treinamento: O que foi treinado
- Data de Realização: Quando fez
- Data de Validade: Quando expira (se aplicável)
- Certificado: Upload do comprovante
- Status: "Concluído", "Pendente", "Expirado", "A vencer"

REGRAS DE NEGÓCIO:
- Treinamentos com validade devem ser renovados antes do vencimento
- Alerta automático 30 dias antes da expiração
- Colaboradores sem treinamentos obrigatórios não podem operar
- Matriz de competências deve estar alinhada aos cargos

FLUXO:
1. Identificar competências necessárias por cargo
2. Avaliar competências atuais vs necessárias
3. Prover treinamento para gaps
4. Registrar evidência (certificado)
5. Avaliar eficácia do treinamento

MISSÃO: Ajude a identificar gaps de competência, planejar treinamentos e garantir conformidade.
    `
    }
    if (path?.includes('fornecedores')) {
        return `
TELA: AVALIAÇÃO DE FORNECEDORES (ISO 9001 - 8.4)

CADASTRO DE FORNECEDOR:
- Nome: Razão social
- CNPJ: Documento fiscal
- Email/Telefone: Contato
- Categoria: "Matéria Prima", "Serviços", "Equipamentos", "Transporte"
- Status: "Em Análise", "Homologado", "Bloqueado"
- Motivo do Bloqueio: Se bloqueado, por quê

AVALIAÇÃO (IQF - Índice de Qualidade do Fornecedor):
- Critério Qualidade: 0-10 (produtos conformes)
- Critério Prazo: 0-10 (entregas no prazo)
- Critério Comunicação: 0-10 (atendimento, suporte)
- Nota Final: Média dos critérios (automático)
- Comentários: Observações da avaliação
- Data da Avaliação: Quando foi avaliado

REGRAS DE CLASSIFICAÇÃO:
- IQF ≥ 7.0: Homologado ✓
- IQF 5.0-6.9: Em Análise (requer desenvolvimento)
- IQF < 5.0: Bloqueado (não pode fornecer)

FLUXO:
1. Cadastrar fornecedor (status: Em Análise)
2. Realizar fornecimento piloto
3. Avaliar com critérios IQF
4. Classificar conforme nota
5. Reavaliar periodicamente (trimestral/anual)

REGRAS DE NEGÓCIO:
- Não comprar de fornecedor Bloqueado
- Fornecedor bloqueado pode solicitar reavaliação
- Manter histórico de todas as avaliações
- Fornecedor crítico exige auditoria in loco

MISSÃO: Ajude a definir critérios de avaliação, calcular IQF e tomar decisões de qualificação.
    `
    }
    if (path?.includes('comercial')) {
        return `
TELA: COMERCIAL E REQUISITOS DO CLIENTE (ISO 9001 - 8.2)

CAMPOS DO PEDIDO:
- Código: Número do pedido/contrato
- Cliente: Nome do cliente
- Descrição: Produto/serviço vendido
- Prazo de Entrega: Data prometida
- Status: "Pendente Análise", "Aprovado", "Rejeitado", "Entregue"
- Notas da Análise: Observações da análise crítica

CHECKLIST DE ANÁLISE CRÍTICA (obrigatório antes de aceitar):
☐ Requisitos do cliente estão claramente definidos?
☐ Temos capacidade de atender (prazo, volume, especificações)?
☐ Riscos foram considerados e são aceitáveis?

FLUXO:
1. Receber solicitação do cliente
2. Analisar criticamente (checklist)
3. Aprovar ou Rejeitar
4. Se aprovado, liberar para produção
5. Entregar e registrar

REGRAS DE NEGÓCIO:
- Não iniciar produção sem análise crítica aprovada
- Alterações de requisitos devem ser reanalisadas
- Registrar quem aprovou e quando
- Requisitos divergentes devem ser resolvidos antes da aceitação

MISSÃO: Ajude a estruturar análise crítica de pedidos e garantir que requisitos estão claros.
    `
    }
    if (path?.includes('producao')) {
        return `
TELA: CONTROLE DE PRODUÇÃO (ISO 9001 - 8.5)

CAMPOS DA ORDEM DE PRODUÇÃO:
- Código: Número da OP/OS
- Produto/Serviço: O que está sendo produzido
- Pedido de Origem: Vinculado ao comercial (se houver)
- Status: "Agendada", "Em Andamento", "Verificação de Qualidade", "Concluída"
- Data Início/Fim: Planejado e realizado
- Lote/Série: Rastreabilidade
- Instrução de Trabalho: Documento de referência
- Notas de Execução: Anotações do operador
- Etapa Atual: Em que fase está

FLUXO DE PRODUÇÃO:
1. Receber OP liberada pelo comercial
2. Preparar materiais e recursos
3. Executar conforme instrução de trabalho
4. Registrar lote/série para rastreabilidade
5. Enviar para verificação de qualidade
6. Liberar ou registrar NC

REGRAS DE NEGÓCIO:
- Toda OP deve ter rastreabilidade (lote ou série)
- Seguir instrução de trabalho documentada
- Registrar desvios e paradas
- Verificação de qualidade antes de liberar

MISSÃO: Ajude a planejar produção, garantir rastreabilidade e manter controle de processo.
    `
    }
    if (path?.includes('analise-critica')) {
        return `
TELA: ANÁLISE CRÍTICA PELA DIREÇÃO (ISO 9001 - 9.3)

CAMPOS:
- Data: Data da reunião
- Período Analisado: Ex: "Janeiro a Junho 2024"
- Participantes: Quem participou (direção obrigatória)
- Status: "Rascunho", "Concluída"

ENTRADAS (o que analisar - obrigatório ISO 9001):
1. Situação das ações de análises anteriores
2. Mudanças em questões internas/externas
3. Satisfação do cliente e feedback
4. Desempenho de fornecedores
5. Resultados de auditorias
6. Desempenho de processos e indicadores

SAÍDAS (decisões tomadas):
- Oportunidades de melhoria
- Necessidade de mudanças no SGQ
- Necessidade de recursos
- Ações a serem implementadas

FLUXO:
1. Preparar ATA com entradas (Rascunho)
2. Realizar reunião com a direção
3. Registrar decisões (Saídas)
4. Finalizar como Concluída
5. Acompanhar implementação das decisões

REGRAS DE NEGÓCIO:
- Frequência mínima: anual (recomendado semestral)
- Alta direção deve participar obrigatoriamente
- Saídas geram ações que devem ser rastreadas
- Manter registro documental como evidência

MISSÃO: Ajude a estruturar a pauta conforme requisitos ISO e documentar decisões da reunião.
    `
    }
    if (path?.includes('usuarios') || path?.includes('perfil')) {
        return `
TELA: GESTÃO DE USUÁRIOS E PERFIL (ISO 9001 - 7.2)

CAMPOS DE USUÁRIO:
- Nome Completo: Identificação
- Email: Login no sistema
- Cargo: Função exercida
- Permissões: Níveis de acesso
- Empresa: A qual empresa pertence
- Unidade: Filial se aplicável

NÍVEIS DE ACESSO:
- Visualizador: Apenas consultar dados
- Operador: Criar e editar registros
- Gestor: Aprovar e gerenciar equipe
- Admin: Configurações da empresa
- Super Admin: Acesso a todas as empresas (apenas Isotek)

PERFIL DA EMPRESA:
- Logo: Imagem da marca
- Nome: Razão social
- CNPJ: Documento
- Plano: Start, Pro, Enterprise
- Usuários: Limite conforme plano

MISSÃO: Ajude com questões sobre gestão de competências e estrutura organizacional.
    `
    }
    if (path?.includes('suporte')) {
        return `
TELA: CENTRAL DE SUPORTE

CANAIS DISPONÍVEIS:
- WhatsApp: Atendimento rápido para dúvidas do dia a dia
- Email: Para questões técnicas detalhadas
- Reportar Bug: Abrir ticket de falha técnica

DÚVIDAS FREQUENTES:
- Como adicionar usuários: Configurações > Usuários > Convidar
- Como mudar logo: Configurações > Perfil da Empresa
- Como ver faturas: Perfil da Empresa > Assinatura

MISSÃO: Ajude a direcionar o usuário para o canal correto de suporte e responda dúvidas comuns.
    `
    }
    return `
TELA GERAL: O usuário está navegando no sistema SGQ ISO 9001 Isotek.

MÓDULOS DISPONÍVEIS:
- Estratégia (Plan): SWOT, Partes Interessadas, Processos, Liderança, Riscos, Objetivos
- Execução (Do): Documentos, Treinamentos, Comercial, Fornecedores, Produção
- Checagem (Check): Indicadores, Auditorias, Análise Crítica
- Melhoria (Act): RNCs de Produto, Ações Corretivas

INFORMAÇÕES GERAIS ISO 9001:2015:
- 4.0: Contexto da Organização
- 5.0: Liderança
- 6.0: Planejamento
- 7.0: Apoio (Recursos, Competência, Documentação)
- 8.0: Operação
- 9.0: Avaliação de Desempenho
- 10.0: Melhoria

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

        // Chamada à API do Gemini - usando modelo 2.0-flash (suporta multimodal)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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