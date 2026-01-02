import { AuditContextInfo } from '../types';

export const PLANS = {
    start: {
        id: 'price_start_brl',
        label: 'Start',
        price: 297,
        period: 'mês',
        description: 'Para pequenas empresas (Dono + Analista)',
        features: [
            'Gestão de Documentos (GED)',
            'Gestão de RNCs Básica',
            'IA Consultora (50 prompts/mês)',
            'Até 2 Usuários (Dono + Analista)',
            'Suporte por Email'
        ],
        limits: {
            users: 2,
            storage_gb: 5,
            ai_prompts: 50,
            has_marketplace: false,
            has_risk_matrix: false
        }
    },
    pro: {
        id: 'price_pro_brl',
        label: 'Pro',
        price: 697,
        period: 'mês',
        isPopular: true,
        description: 'Gestão completa com IA ilimitada',
        features: [
            'Tudo do plano Start',
            'IA Consultora Ilimitada',
            'Matriz de Riscos & SWOT',
            'Acesso ao Marketplace de Auditores',
            'Até 5 Usuários',
            'Suporte Prioritário'
        ],
        limits: {
            users: 5,
            storage_gb: 20,
            ai_prompts: 9999,
            has_marketplace: true,
            has_risk_matrix: true
        }
    },
    enterprise: {
        id: 'price_ent_brl',
        label: 'Enterprise',
        price: 1497,
        period: 'mês',
        description: 'Para grandes operações com múltiplas unidades.',
        features: [
            'Tudo do plano Pro',
            'Usuários Ilimitados',
            'API de Integração',
            'Gestor de Conta Dedicado',
            'Múltiplas Unidades (Filiais)'
        ],
        limits: {
            users: 999,
            storage_gb: 100,
            ai_prompts: 9999,
            has_marketplace: true,
            has_risk_matrix: true
        }
    }
};

// Taxas do Sistema Financeiro (Stripe/Pagar.me)
export const FINANCIAL_FEES = {
    GATEWAY_PERCENT: 0.0399, // 3.99% (Cartão de Crédito)
    FIXED_TRANSACTION: 1.00, // R$ 1,00 por transação
    TAX_INVOICE_PERCENT: 0.06 // 6% (Imposto estimado sobre a nota da Isotek)
};

// Níveis e Comissões
export const AUDITOR_RATES = {
    bronze: { label: 'Bronze', rate: 0.70 },
    silver: { label: 'Prata', rate: 0.75 },
    gold: { label: 'Ouro', rate: 0.80 },
    platinum: { label: 'Platina', rate: 0.85 },
    diamond: { label: 'Diamante', rate: 0.90 }
};

export const AUDIT_BASE_PRICE = 1200; // Preço base diária sugerida

// ============================================================================
// ISO 9001:2015 - Matriz de Riscos e Oportunidades
// ============================================================================

/**
 * Thresholds de severidade para a Matriz de Riscos (P x I)
 * Baseado na norma ISO 9001:2015 - Cláusula 6.1
 */
export const ISO_RISK_THRESHOLDS = {
    CRITICAL: 17,  // Score >= 17: Crítico/Excelente
    HIGH: 10,      // Score >= 10: Alto/Estratégico
    MODERATE: 5,   // Score >= 5: Moderado/Promissor
    LOW: 1         // Score >= 1: Baixo
} as const;

/**
 * Cores padronizadas para níveis de risco (Tailwind CSS)
 */
export const ISO_RISK_COLORS = {
    // Estilos para RISCOS (Ameaças)
    risk: {
        CRITICAL: 'bg-red-50 border-red-200 text-red-700',
        HIGH: 'bg-orange-50 border-orange-200 text-orange-700',
        MODERATE: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        LOW: 'bg-emerald-50 border-emerald-200 text-emerald-700'
    },
    // Estilos para OPORTUNIDADES
    opportunity: {
        CRITICAL: 'bg-blue-100 border-blue-300 text-blue-800',
        HIGH: 'bg-blue-50 border-blue-200 text-blue-700',
        MODERATE: 'bg-cyan-50 border-cyan-200 text-cyan-700',
        LOW: 'bg-slate-50 border-slate-200 text-slate-700'
    }
} as const;

/**
 * Labels para níveis de risco/oportunidade
 */
export const ISO_RISK_LABELS = {
    risk: {
        CRITICAL: 'Crítico',
        HIGH: 'Alto',
        MODERATE: 'Moderado',
        LOW: 'Baixo'
    },
    opportunity: {
        CRITICAL: 'Excelente',
        HIGH: 'Estratégica',
        MODERATE: 'Promissora',
        LOW: 'Baixa'
    }
} as const;

/**
 * Retorna o nível de severidade baseado no score (P x I)
 */
export const getRiskLevel = (score: number): keyof typeof ISO_RISK_THRESHOLDS => {
    if (score >= ISO_RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (score >= ISO_RISK_THRESHOLDS.HIGH) return 'HIGH';
    if (score >= ISO_RISK_THRESHOLDS.MODERATE) return 'MODERATE';
    return 'LOW';
};

// Mapeamento de Contexto ISO 9001:2015 por Rota (Dicas de Auditoria)
export const AUDIT_ROUTE_MAP: Record<string, AuditContextInfo> = {
    '/app/documentos': {
        clause: '7.5',
        title: 'Informação Documentada',
        description: 'Verifique aprovação, revisão e disponibilidade dos documentos.'
    },
    '/app/matriz-riscos': {
        clause: '6.1',
        title: 'Riscos e Oportunidades',
        description: 'Confira se os riscos altos possuem planos de ação.'
    },
    '/app/fornecedores': {
        clause: '8.4',
        title: 'Provisão Externa',
        description: 'Verifique os critérios de seleção e avaliação.'
    },
    '/app/politica-qualidade': {
        clause: '5.1',
        title: 'Liderança',
        description: 'Busque evidências do comprometimento da alta direção.'
    },
    '/app/acoes-corretivas': {
        clause: '10.2',
        title: 'Não Conformidade e Ação Corretiva',
        description: 'Verifique se as causas raízes foram investigadas.'
    },
    '/app/auditorias': {
        clause: '9.2',
        title: 'Auditoria Interna',
        description: 'Cheque o cumprimento do programa de auditoria.'
    }
};
