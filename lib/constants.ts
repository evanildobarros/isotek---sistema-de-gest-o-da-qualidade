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

// Regras de Comissionamento do Marketplace (Auditor recebe X%)
export const AUDITOR_RATES = {
    bronze: { label: 'Bronze', rate: 0.70, next: 'silver' }, // 70%
    silver: { label: 'Prata', rate: 0.75, next: 'gold' },
    gold: { label: 'Ouro', rate: 0.80, next: 'diamond' },
    diamond: { label: 'Diamante', rate: 0.85, next: null }
};


export const AUDIT_BASE_PRICE = 1200; // Preço base diária sugerida

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
