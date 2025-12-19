import React, { useState, useEffect, useRef } from 'react';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Upload,
    Save,
    CheckCircle,
    ShieldCheck,
    CreditCard,
    Calendar,
    Crown,
    X,
    Check,
    Users,
    HardDrive,
    Zap,
    TrendingUp,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { PageHeader } from '../../common/PageHeader';
import { getAvailablePlans, upgradePlan, downgradePlan, checkPlanLimits } from '../../../lib/utils/supabase';
import type { Plan, PlanId, Invoice } from '../../../types';

// Função para formatar CNPJ: XX.XXX.XXX/XXXX-XX
const formatCNPJ = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Limita a 14 dígitos
    const limited = numbers.slice(0, 14);

    // Aplica a máscara
    let formatted = limited;
    if (limited.length > 2) {
        formatted = limited.slice(0, 2) + '.' + limited.slice(2);
    }
    if (limited.length > 5) {
        formatted = formatted.slice(0, 6) + '.' + formatted.slice(6);
    }
    if (limited.length > 8) {
        formatted = formatted.slice(0, 10) + '/' + formatted.slice(10);
    }
    if (limited.length > 12) {
        formatted = formatted.slice(0, 15) + '-' + formatted.slice(15);
    }

    return formatted;
};

export const CompanyProfilePage: React.FC = () => {
    const { company, refreshCompany } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Subscription state
    const [showPlansModal, setShowPlansModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [planLimits, setPlanLimits] = useState({
        currentUsers: 0,
        maxUsers: 5,
        currentStorage: 0,
        maxStorage: 5,
        withinLimits: true
    });
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        slogan: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        logo_url: ''
    });

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                slogan: company.slogan || '',
                cnpj: formatCNPJ(company.cnpj || ''),
                email: company.email || '',
                phone: company.phone || '',
                address: company.address || '',
                logo_url: company.logo_url || ''
            });

            // Load plan limits
            // Load plan limits
            loadPlanLimits();
            fetchInvoices();
        }
    }, [company]);

    const fetchInvoices = async () => {
        if (!company?.id) return;
        setLoadingInvoices(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('id, company_id, amount, status, created_at, invoice_pdf_url')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            console.error('Erro ao buscar faturas:', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const loadPlanLimits = async () => {
        if (!company?.id) return;
        const limits = await checkPlanLimits(company.id);
        setPlanLimits(limits);
    };

    const handlePlanSelection = (plan: Plan) => {
        setSelectedPlan(plan);
        setShowPlansModal(false);
        setShowConfirmModal(true);
    };

    const handlePlanChange = async () => {
        if (!selectedPlan || !company?.id) return;

        try {
            setSaving(true);
            const currentPlan = getAvailablePlans().find(p => p.id === (company.plan_id || 'start'));

            const planOrder: Record<PlanId, number> = { 'start': 0, 'pro': 1, 'enterprise': 2 };
            const isUpgrade = planOrder[selectedPlan.id] > planOrder[currentPlan?.id || 'start'];

            const result = isUpgrade
                ? await upgradePlan(company.id, selectedPlan.id)
                : await downgradePlan(company.id, selectedPlan.id);

            if (result.success) {
                await refreshCompany();
                await loadPlanLimits();
                toast.success(`Plano alterado para ${selectedPlan.label} com sucesso!`);
            } else {
                toast.error(`Erro ao alterar plano: ${result.error}`);
            }
        } catch (error: any) {
            console.error('Error changing plan:', error);
            toast.error('Erro ao processar mudança de plano');
        } finally {
            setSaving(false);
            setShowConfirmModal(false);
            setSelectedPlan(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Aplica formatação automática para campo CNPJ
        if (name === 'cnpj') {
            setFormData(prev => ({ ...prev, [name]: formatCNPJ(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${company?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            setLoading(true);

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            // 3. Update State
            setFormData(prev => ({ ...prev, logo_url: publicUrl }));

        } catch (error: any) {
            console.error('Error uploading logo:', error);
            toast.error('Erro ao fazer upload da logo: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!company) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from('company_info')
                .update({
                    name: formData.name,
                    slogan: formData.slogan,
                    cnpj: formData.cnpj.replace(/\D/g, ''), // Remove formatação antes de salvar
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    logo_url: formData.logo_url
                })
                .eq('id', company.id);

            if (error) throw error;

            await refreshCompany();
            toast.success('Perfil atualizado com sucesso!');

        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Building2}
                title="Perfil da Empresa"
                subtitle="Gerencie as informações cadastrais e identidade visual da sua organização."
                iconColor="purple"
            />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Card 1: Identidade Visual */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Identidade Visual
                        </h3>

                        <div className="flex flex-col items-center space-y-4 mb-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-gray-100 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {formData.logo_url ? (
                                        <img
                                            src={formData.logo_url}
                                            alt="Logo da Empresa"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="w-12 h-12 text-gray-300" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-[#025159] text-white rounded-full shadow-lg hover:bg-[#3F858C] transition-colors"
                                    title="Alterar Logo"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Recomendado: 200x200px<br />PNG ou JPG
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ex: Isotek Soluções"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                                <textarea
                                    name="slogan"
                                    value={formData.slogan}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Ex: Transformando qualidade em resultado."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Dados Cadastrais */}
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Dados Cadastrais e Contato
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                                <input
                                    type="text"
                                    name="name" // Using name for both for now, or add corporate_name if needed
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                <input
                                    type="text"
                                    name="cnpj"
                                    value={formData.cnpj}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="00.000.000/0001-91"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="contato@empresa.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Card 3: Assinatura Melhorada (Full Width) */}
                    <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm">
                                        <Crown className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Plano {getAvailablePlans().find(p => p.id === (company?.plan_id || 'start'))?.label || 'Start'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(company?.subscription_status || 'active') === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {(company?.subscription_status || 'active') === 'active' ? '✓ ATIVO' : '⚠ VENCIDO'}
                                            </span>
                                            {company?.current_period_end && (
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Renova em {new Date(company.current_period_end).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Usage Indicators */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Users */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span>Usuários</span>
                                            </div>
                                            <span className="text-sm font-medium">
                                                {planLimits.currentUsers}/{planLimits.maxUsers}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${planLimits.currentUsers >= planLimits.maxUsers
                                                    ? 'bg-red-500'
                                                    : planLimits.currentUsers > planLimits.maxUsers * 0.8
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min((planLimits.currentUsers / planLimits.maxUsers) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Storage */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <HardDrive className="w-4 h-4" />
                                                <span>Armazenamento</span>
                                            </div>
                                            <span className="text-sm font-medium">
                                                {planLimits.currentStorage.toFixed(1)}/{planLimits.maxStorage} GB
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${Math.min((planLimits.currentStorage / planLimits.maxStorage) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPlansModal(true)}
                                className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Gerenciar Plano
                            </button>
                        </div>
                    </div>

                </div>

                {/* Billing & Invoices Section */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Faturamento e Pagamento</h3>
                            <p className="text-sm text-gray-500">Gerencie seus métodos de pagamento e histórico de faturas</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Payment Method */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                                <h4 className="font-medium text-gray-900 mb-3">Método de Pagamento</h4>
                                {company?.payment_method_last4 ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                                            {/* Simple brand icon placeholder */}
                                            <span className="text-xs font-bold text-gray-600 uppercase">
                                                {company.payment_method_brand || 'CARD'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                •••• •••• •••• {company.payment_method_last4}
                                            </p>
                                            <p className="text-xs text-gray-500">Expira em 12/2028</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        Nenhum método de pagamento cadastrado.
                                    </div>
                                )}
                                <button
                                    className="mt-4 w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                    onClick={() => toast.info('Redirecionando para o Portal do Cliente...')}
                                >
                                    Atualizar Cartão
                                </button>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-xl bg-blue-50/50">
                                <h4 className="font-medium text-blue-900 mb-2">Portal do Cliente</h4>
                                <p className="text-xs text-blue-700 mb-3">
                                    Acesse o portal seguro para gerenciar sua assinatura, baixar notas fiscais e alterar dados de cobrança.
                                </p>
                                <button
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    onClick={() => toast.info('Abrindo Portal do Cliente Stripe...')}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Acessar Portal
                                </button>
                            </div>
                        </div>

                        {/* Invoices History */}
                        <div className="lg:col-span-2">
                            <h4 className="font-medium text-gray-900 mb-4">Histórico de Faturas</h4>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3">Data</th>
                                            <th className="px-4 py-3">Valor</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loadingInvoices ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                                    Carregando faturas...
                                                </td>
                                            </tr>
                                        ) : invoices.length > 0 ? (
                                            invoices.map((invoice) => (
                                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        R$ {invoice.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'paid'
                                                            ? 'bg-green-100 text-green-700'
                                                            : invoice.status === 'open'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {invoice.status === 'paid' ? 'Pago' :
                                                                invoice.status === 'open' ? 'Aberto' :
                                                                    invoice.status === 'void' ? 'Cancelado' : 'Falha'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            className="text-gray-400 hover:text-[#025159] transition-colors"
                                                            title="Baixar PDF"
                                                            onClick={() => invoice.invoice_pdf_url ? window.open(invoice.invoice_pdf_url, '_blank') : toast.error('PDF indisponível')}
                                                        >
                                                            <HardDrive className="w-4 h-4" /> {/* Using HardDrive as generic file icon since FileText wasn't imported */}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    Nenhuma fatura encontrada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-[#025159] text-white rounded-xl hover:bg-[#3F858C] transition-colors shadow-md font-medium disabled:opacity-70"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Plans Comparison Modal */}
            {showPlansModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Comparar Planos</h2>
                                <p className="text-sm text-gray-500">Escolha o plano ideal para sua organização</p>
                            </div>
                            <button onClick={() => setShowPlansModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {getAvailablePlans().map((plan) => {
                                    const isCurrentPlan = plan.id === (company?.plan_id || 'start');
                                    return (
                                        <div
                                            key={plan.id}
                                            className={`relative rounded-xl border-2 p-6 transition-all ${isCurrentPlan
                                                ? 'border-blue-500 bg-blue-50/50'
                                                : plan.isPopular
                                                    ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {plan.isPopular && !isCurrentPlan && (
                                                <div className="absolute -top-3 right-4 z-10">
                                                    <span className="bg-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                        ⭐ MAIS POPULAR
                                                    </span>
                                                </div>
                                            )}
                                            {isCurrentPlan && (
                                                <div className="absolute -top-3 right-4">
                                                    <span className="bg-[#025159] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> PLANO ATUAL
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-center mb-6">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.label}</h3>
                                                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                                                <div className="mb-4">
                                                    {plan.price === 0 && plan.id !== 'start' ? (
                                                        <div>
                                                            <div className="text-3xl font-bold text-gray-900">Sob Consulta</div>
                                                            <div className="text-sm text-gray-500">Contate nossa equipe</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="flex items-baseline justify-center">
                                                                <span className="text-4xl font-bold text-gray-900">
                                                                    R$ {plan.price}
                                                                </span>
                                                                <span className="text-gray-600 ml-2">/mês</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <ul className="space-y-3 mb-6">
                                                {plan.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <span className="text-gray-700">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="space-y-2 text-xs text-gray-600 mb-6">
                                                <div className="flex justify-between">
                                                    <span>Usuários:</span>
                                                    <span className="font-medium">{plan.limits.users === 999 ? 'Ilimitado' : plan.limits.users}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Armazenamento:</span>
                                                    <span className="font-medium">{plan.limits.storage_gb === 999999 ? 'Ilimitado' : `${plan.limits.storage_gb} GB`}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => !isCurrentPlan && handlePlanSelection(plan)}
                                                disabled={isCurrentPlan}
                                                style={
                                                    isCurrentPlan ? {} :
                                                        plan.isPopular ? { backgroundColor: '#9333ea' } :
                                                            plan.id === 'enterprise' ? { backgroundColor: '#6366f1' } :
                                                                { backgroundColor: '#3b82f6' }
                                                }
                                                className={
                                                    isCurrentPlan
                                                        ? 'w-full py-3 rounded-lg font-medium transition-all bg-gray-200 text-gray-500 cursor-not-allowed'
                                                        : 'w-full py-3 rounded-lg font-medium transition-all text-white hover:opacity-90 shadow-md hover:shadow-lg'
                                                }
                                            >
                                                {isCurrentPlan ? 'Plano Atual' : plan.id === 'enterprise' ? 'Contatar Vendas' : 'Selecionar Plano'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Mudança de Plano</h3>
                            <p className="text-gray-600">
                                Você está prestes a alterar para o plano <span className="font-bold text-blue-600">{selectedPlan.label}</span>
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Novo limite de usuários:</span>
                                    <span className="font-medium">{selectedPlan.limits.users === 999 ? 'Ilimitado' : selectedPlan.limits.users}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Novo armazenamento:</span>
                                    <span className="font-medium">{selectedPlan.limits.storage_gb === 999999 ? 'Ilimitado' : `${selectedPlan.limits.storage_gb} GB`}</span>
                                </div>
                                {selectedPlan.price > 0 && (
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="text-gray-600 font-medium">Valor mensal:</span>
                                        <span className="font-bold text-lg text-blue-600">R$ {selectedPlan.price}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSelectedPlan(null);
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePlanChange}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors font-medium disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
