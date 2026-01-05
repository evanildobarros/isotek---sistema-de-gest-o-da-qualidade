import React, { useEffect, useState } from 'react';
import {
    Wallet,
    DollarSign,
    TrendingUp,
    Calendar,
    CheckCircle,
    Building2,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    CreditCard
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { AUDIT_BASE_PRICE } from '../../../lib/constants';
import { calculateAuditEarnings, formatCurrency, EarningsSimulation } from '../../../lib/utils/finance';
import { AuditAssignment } from '../../../types';

interface AuditTransaction extends AuditAssignment {
    company_name?: string;
    financials: EarningsSimulation;
}

export const AuditorWalletPage: React.FC = () => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<AuditTransaction[]>([]);
    const [stats, setStats] = useState({
        grossTotal: 0,
        netIncome: 0,
        pending: 0
    });
    const [auditorLevel, setAuditorLevel] = useState('bronze');
    const [commissionSettings, setCommissionSettings] = useState<{ tier: string; customRate: number | null }>({
        tier: 'bronze',
        customRate: null
    });

    useEffect(() => {
        if (user) {
            fetchWalletData();
        }
    }, [user]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);

            // 1. Buscar Perfil e Configurações Globais
            const [profileRes, settingsRes, settingsRes2] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('gamification_level, commission_tier, custom_commission_rate')
                    .eq('id', user?.id)
                    .single(),
                supabase
                    .from('global_settings')
                    .select('value')
                    .eq('key', 'auditor_rates')
                    .single(),
                supabase
                    .from('global_settings')
                    .select('value')
                    .eq('key', 'audit_base_price')
                    .single()
            ]);

            const profile = profileRes.data;
            const globalRates = settingsRes.data?.value || {};
            const globalBasePrice = settingsRes2.data?.value ? Number(settingsRes2.data.value) : AUDIT_BASE_PRICE;

            const currentLevel = profile?.gamification_level || 'bronze';
            const tier = profile?.commission_tier || currentLevel;
            const customRate = profile?.custom_commission_rate || null;

            // Se for usar a taxa do nível e ela existir no banco, passamos como customRate para o cálculo
            const effectiveRate = customRate || (globalRates[tier] ? globalRates[tier] * 100 : null);

            setAuditorLevel(currentLevel);
            setCommissionSettings({
                tier,
                customRate: effectiveRate
            });

            // 2. Buscar Auditorias (Assignments)
            // Assumimos que auditorias concluídas geraram receita
            const { data: assignments, error } = await supabase
                .from('audit_assignments')
                .select('*, company_info(name)')
                .eq('auditor_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 3. Processar Dados Financeiros
            let totalGross = 0;
            let totalNet = 0;
            let totalPending = 0;

            const processedTransactions = (assignments || []).map((audit: any) => {
                // Se tiver valor customizado no banco (agreed_amount), usa ele. Caso contrário, usa o preço base dinâmico.
                const auditValue = audit.agreed_amount || globalBasePrice;

                // Calcular breakdown para ESTA transação
                const financials = calculateAuditEarnings(
                    auditValue,
                    tier,
                    effectiveRate || undefined
                );

                // Computar Totais
                if (audit.status === 'concluida') {
                    totalGross += financials.grossTotal;
                    totalNet += financials.auditorShare;
                } else if (['agendada', 'em_andamento'].includes(audit.status)) {
                    totalPending += financials.auditorShare;
                }

                return {
                    ...audit,
                    company_name: audit.company_info?.name,
                    financials
                };
            });

            setTransactions(processedTransactions);
            setStats({
                grossTotal: totalGross,
                netIncome: totalNet,
                pending: totalPending
            });

        } catch (error) {
            console.error('Erro ao carregar carteira:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-emerald-600" />
                        Minha Carteira
                    </h1>
                    <p className="text-gray-500">Transparência total em seus ganhos e comissões.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 font-medium text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Conta Verificada
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Ganhos Totais (Líquido)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.netIncome)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">A Receber (Pendente)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pending)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Volume Bruto Transacionado</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.grossTotal)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Transações com Detalhamento */}
            <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-800">Extrato de Auditorias</h2>

                {transactions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma transação encontrada</h3>
                        <p className="text-gray-500">Realize sua primeira auditoria para começar a ganhar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {transactions.map((t) => (
                            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6 flex flex-col md:flex-row gap-6">

                                    {/* Info da Auditoria */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                    {t.company_name || 'Empresa Desconhecida'}
                                                </h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(t.start_date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${t.status === 'concluida' ? 'bg-green-100 text-green-700' :
                                                t.status === 'cancelada' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {t.status.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Detalhes Financeiros (O Card Solicitado) */}
                                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <ArrowDownRight className="w-4 h-4" />
                                                Memória de Cálculo (Transparência)
                                            </h4>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-medium">Valor Cobrado do Cliente</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(t.financials.grossTotal)}</span>
                                                </div>

                                                <div className="flex justify-between items-center text-sm text-red-500">
                                                    <span className="flex items-center gap-1">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        (-) Taxas de Processamento (Gateway)
                                                    </span>
                                                    <span>- {formatCurrency(t.financials.gatewayCost)}</span>
                                                </div>

                                                <div className="border-t border-dashed border-gray-300 my-1"></div>

                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-medium">Base de Cálculo (Receita Líquida)</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(t.financials.netBasis)}</span>
                                                </div>

                                                <div className="mt-4 bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex justify-between items-center">
                                                    <div>
                                                        <span className="block text-sm font-bold text-emerald-800">
                                                            Sua Comissão ({Number(t.financials.auditorRate * 100).toFixed(0)}%)
                                                        </span>
                                                        <span className="text-xs text-emerald-600 uppercase font-semibold tracking-wide">
                                                            Nível {t.financials.auditorLevel}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xl font-bold text-emerald-700">
                                                            {formatCurrency(t.financials.auditorShare)}
                                                        </span>
                                                        <span className="text-xs text-emerald-600">Líquido a Receber</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Adicional / Plataforma Share (Opcional, mas aumenta transparência) */}
                                    <div className="hidden md:block w-72 border-l border-gray-100 pl-6 space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h5 className="text-xs font-semibold text-gray-500 mb-2">Taxa da Plataforma</h5>
                                            <div className="flex justify-between items-center font-medium text-gray-700">
                                                <span>Isotek Share</span>
                                                <span>{formatCurrency(t.financials.platformShare)}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                Investimos este valor em marketing para trazer mais clientes para você.
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
