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
export const AUDITOR_COMMISSION_RATES = {
    bronze: 0.70, // Isotek fica com 30%
    silver: 0.75, // Isotek fica com 25%
    gold: 0.80,   // Isotek fica com 20%
    diamond: 0.85 // Isotek fica com 15%
};

export const AUDIT_BASE_PRICE = 1200; // Preço base diária sugerida
