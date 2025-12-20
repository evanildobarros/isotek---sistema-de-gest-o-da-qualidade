import { FINANCIAL_FEES, AUDITOR_RATES } from '../constants';

export interface EarningsSimulation {
    grossTotal: number;
    gatewayCost: number;
    netBasis: number; // Base de cálculo após taxas
    auditorShare: number;
    platformShare: number;
    auditorRate: number;
    auditorLevel: string;
}

export const calculateAuditEarnings = (grossTotal: number, auditorLevel: string = 'bronze'): EarningsSimulation => {
    // 1. Calcular custo financeiro (Dinheiro que vai para o Banco/Stripe)
    const gatewayCost = (grossTotal * FINANCIAL_FEES.GATEWAY_PERCENT) + FINANCIAL_FEES.FIXED_TRANSACTION;

    // 2. Base Líquida para divisão (O dinheiro real que sobrou na mesa)
    const netBasis = Math.max(0, grossTotal - gatewayCost);

    // 3. Identificar a taxa do auditor
    const levelKey = auditorLevel.toLowerCase() as keyof typeof AUDITOR_RATES;
    const rateConfig = (AUDITOR_RATES as any)[levelKey] || AUDITOR_RATES.bronze;
    const auditorRate = rateConfig.rate;

    // 4. Realizar o Split
    const auditorShare = netBasis * auditorRate;
    const platformShare = netBasis - auditorShare;

    return {
        grossTotal,
        gatewayCost,
        netBasis,
        auditorShare,
        platformShare,
        auditorRate,
        auditorLevel: rateConfig.label
    };
};

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};
