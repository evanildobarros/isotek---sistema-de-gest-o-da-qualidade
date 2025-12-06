import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Users, DollarSign, Activity, Plus, Search,
    MoreVertical, Lock, Unlock, ExternalLink, Building2, Mail, Key, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Company } from '../../../types';

export const SuperAdminPage: React.FC = () => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [stats, setStats] = useState({ total: 0, revenue: 0, active: 0 });
    const [error, setError] = useState<string | null>(null);

    // Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [wizardLoading, setWizardLoading] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [editForm, setEditForm] = useState({ name: '', cnpj: '', email: '', plan: '', status: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Menu State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Form Data (Wizard)
    const [companyForm, setCompanyForm] = useState({
        name: '',
        cnpj: '',
        plan: 'start'
    });
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '' // Will be generated or manual
    });

    // 1. Security Check
    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                navigate('/login');
                return;
            }

            // Check specific email OR profile flag
            const isEvanildo = user.email === 'evanildobarros@gmail.com';

            if (isEvanildo) {
                setLoading(false);
                fetchCompanies();
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_super_admin')
                .eq('id', user.id)
                .single();

            if (profile?.is_super_admin) {
                setLoading(false);
                fetchCompanies();
            } else {
                navigate('/app/dashboard');
            }
        };

        checkAccess();
    }, [user, navigate]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Helper function to get avatar color based on company name
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-cyan-500',
            'bg-teal-500',
            'bg-emerald-500',
            'bg-amber-500',
            'bg-orange-500',
            'bg-rose-500'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const fetchCompanies = async () => {
        try {
            setError(null);

            // Fetch companies with JOIN to profiles for owner data
            const { data: companiesData, error: companiesError } = await supabase
                .from('company_info')
                .select('*, owner:profiles!owner_id(full_name)')
                .order('created_at', { ascending: false });

            if (companiesError) throw companiesError;


            if (companiesData) {
                // Map the data to include owner information
                const mappedData = companiesData.map((company: any) => {
                    const ownerName = company.owner?.full_name || 'Sem dono vinculado';

                    return {
                        ...company,
                        owner_name: ownerName,
                        owner_email: company.email || '-',
                        avatar_color: getAvatarColor(company.name)
                    };
                });

                setCompanies(mappedData);
                updateStats(mappedData);
            }
        } catch (error: any) {
            console.error('Error fetching companies:', error);
            setError(error.message);
        }
    };

    const updateStats = (data: Company[]) => {
        const total = data.length;
        const revenue = data.reduce((acc: number, curr: Company) => acc + (Number(curr.monthly_revenue) || 0), 0);
        const active = data.filter((c: Company) => c.status === 'active').length;
        setStats({ total, revenue, active });
    };

    const getPlanBadgeStyle = (plan: string | undefined) => {
        const p = (plan || 'start').toLowerCase();
        switch (p) {
            case 'pro':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'enterprise':
                return 'bg-slate-800 text-white border-slate-700';
            default: // start
                return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const getSubscriptionBadge = (status: string | undefined) => {
        const s = (status || 'unknown').toLowerCase();
        switch (s) {
            case 'active':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Em dia
                    </span>
                );
            case 'past_due':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Atrasado
                    </span>
                );
            case 'unpaid':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Pagamento Pendente
                    </span>
                );
            case 'canceled':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        Cancelado
                    </span>
                );
            case 'trialing':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Em Teste
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Indefinido
                    </span>
                );
        }
    };

    // --- Actions ---

    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        setEditForm({
            name: company.name,
            cnpj: company.cnpj || '',
            email: company.email || '',
            plan: company.plan || 'start',
            status: company.status || 'active'
        });
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleSaveEdit = async () => {
        if (!editingCompany) return;
        setEditLoading(true);
        try {
            const { error } = await supabase
                .from('company_info')
                .update({
                    name: editForm.name,
                    cnpj: editForm.cnpj,
                    email: editForm.email,
                    plan: editForm.plan,
                    status: editForm.status,
                    monthly_revenue: editForm.plan === 'enterprise' ? 999 : (editForm.plan === 'pro' ? 299 : 99)
                })
                .eq('id', editingCompany.id);

            if (error) throw error;

            toast.success('Empresa atualizada com sucesso!');
            setIsEditModalOpen(false);
            fetchCompanies();
        } catch (error: any) {
            console.error('Error updating company:', error);
            toast.error(`Erro ao atualizar: ${error.message}`);
        } finally {
            setEditLoading(false);
        }
    };

    const handleToggleStatus = async (company: Company) => {
        const newStatus = company.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'ativar' : 'bloquear';

        if (!confirm(`Deseja realmente ${action} a empresa ${company.name}?`)) return;

        try {
            const { error } = await supabase
                .from('company_info')
                .update({ status: newStatus })
                .eq('id', company.id);

            if (error) throw error;
            fetchCompanies();
        } catch (error: any) {
            console.error('Error toggling status:', error);
            toast.error(`Erro ao alterar status: ${error.message}`);
        }
    };

    const handleDelete = async (company: Company) => {
        if (!confirm(`PERIGO: Tem certeza que deseja EXCLUIR a empresa ${company.name}?\n\nIsso apagará TODOS os dados e usuários desta empresa.\n\nEsta ação não pode ser desfeita.`)) return;
        if (!confirm(`Confirmação Dupla: Realmente deseja excluir ${company.name}?`)) return;

        try {
            // Use RPC to bypass RLS and handle cleanup
            const { error } = await supabase.rpc('delete_company', { p_company_id: company.id });

            if (error) throw error;

            toast.success('Empresa excluída com sucesso.');
            fetchCompanies();
        } catch (error: any) {
            console.error('Error deleting company:', error);
            toast.error(`Erro ao excluir: ${error.message}`);
        }
    };

    // --- Wizard Logic ---

    const handleOpenWizard = () => {
        setStep(1);
        setCompanyForm({ name: '', cnpj: '', plan: 'start' });
        setUserForm({ name: '', email: '', password: Math.random().toString(36).slice(-8) });
        setIsWizardOpen(true);
    };

    const handleCreateClient = async () => {
        setWizardLoading(true);
        try {
            // 1. Create User (SignUp) - BYPASS EMAIL VERIFICATION
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userForm.email,
                password: userForm.password,
                options: {
                    emailRedirectTo: undefined, // Don't send confirmation email
                    data: {
                        full_name: userForm.name,
                        avatar_url: ''
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Falha ao criar usuário');

            const userId = authData.user.id;

            // 2. Call RPC to create Company and Link User (Bypassing RLS)
            const { error: rpcError } = await supabase.rpc('create_client_company', {
                p_name: companyForm.name,
                p_cnpj: companyForm.cnpj,
                p_plan: companyForm.plan,
                p_owner_id: userId,
                p_monthly_revenue: companyForm.plan === 'enterprise' ? 999 : (companyForm.plan === 'pro' ? 299 : 99)
            });

            if (rpcError) throw rpcError;

            // Success!
            toast.success(`Cliente criado!\nLogin: ${userForm.email}\nSenha: ${userForm.password}`);
            setIsWizardOpen(false);
            fetchCompanies();

        } catch (error: any) {
            console.error('Erro ao criar cliente:', error);
            toast.error(`Erro ao criar cliente: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setWizardLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Verificando acesso...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-slate-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-emerald-400" />
                        <h1 className="text-xl font-bold tracking-tight">Isotek Master Control</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-400">
                            Logado como <span className="text-white font-medium">{user?.email}</span>
                        </div>
                        <button
                            onClick={() => navigate('/app/dashboard')}
                            className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
                        >
                            Voltar ao App
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total de Empresas</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Empresas Ativas</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.active}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Receita Estimada (Mensal)</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar empresa..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleOpenWizard}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Cadastrar Novo Cliente
                    </button>
                </div>

                {/* Clients Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plano</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pagamento</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {companies.map((company) => (
                                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {company.logo_url ? (
                                                <img
                                                    src={company.logo_url}
                                                    alt={company.name}
                                                    className="w-10 h-10 rounded-full object-contain bg-white border border-gray-100 shadow-sm"
                                                />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full ${getAvatarColor(company.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                                    {company.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{company.name}</p>
                                                <p className="text-xs text-gray-500">{company.cnpj || 'Sem CNPJ'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{company.owner_name || 'N/A'}</span>
                                            <span className="text-xs text-gray-500">{company.owner_email || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.status === 'active'
                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                            : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}>
                                            {company.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`capitalize text-sm px-2 py-1 rounded border ${getPlanBadgeStyle(company.plan)}`}>
                                            {company.plan || 'Start'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getSubscriptionBadge(company.subscription_status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {(Number(company.monthly_revenue) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {company.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === company.id ? null : company.id);
                                            }}
                                            className="text-gray-400 hover:text-slate-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openMenuId === company.id && (
                                            <div className="absolute right-8 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    onClick={() => handleEdit(company)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <span>✏️</span> Editar
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(company)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <span>{company.status === 'active' ? '🚫' : '✅'}</span>
                                                    {company.status === 'active' ? 'Bloqueiar' : 'Ativar'}
                                                </button>
                                                <div className="h-px bg-gray-100 my-1" />
                                                <button
                                                    onClick={() => handleDelete(company)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <span>🗑️</span> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Wizard Modal */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">
                                {step === 1 ? 'Passo 1: Dados da Empresa' : 'Passo 2: Primeiro Acesso'}
                            </h2>
                            <div className="flex gap-1">
                                <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {step === 1 ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                value={companyForm.name}
                                                onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder="Ex: Tech Solutions Ltda"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ (Opcional)</label>
                                        <input
                                            type="text"
                                            value={companyForm.cnpj}
                                            onChange={e => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Plano Contratado</label>
                                        <select
                                            value={companyForm.plan}
                                            onChange={e => setCompanyForm({ ...companyForm, plan: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        >
                                            <option value="start">Start (R$ 99/mês)</option>
                                            <option value="pro">Pro (R$ 299/mês)</option>
                                            <option value="enterprise">Enterprise (R$ 999/mês)</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
                                        Criaremos um usuário Admin para esta empresa.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                value={userForm.name}
                                                onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder="Ex: João Silva"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="email"
                                                value={userForm.email}
                                                onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder="admin@empresa.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha Temporária</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                value={userForm.password}
                                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Copie esta senha para enviar ao cliente.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                            {step === 2 ? (
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Voltar
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsWizardOpen(false)}
                                    className="text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Cancelar
                                </button>
                            )}

                            {step === 1 ? (
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!companyForm.name}
                                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Próximo
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreateClient}
                                    disabled={wizardLoading || !userForm.email || !userForm.password}
                                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {wizardLoading ? 'Criando...' : 'Finalizar Cadastro'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">Editar Empresa</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="sr-only">Fechar</span>
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                <input
                                    type="text"
                                    value={editForm.cnpj}
                                    onChange={e => setEditForm({ ...editForm, cnpj: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail da Empresa</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="contato@empresa.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                                <select
                                    value={editForm.plan}
                                    onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="start">Start (R$ 99/mês)</option>
                                    <option value="pro">Pro (R$ 299/mês)</option>
                                    <option value="enterprise">Enterprise (R$ 999/mês)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Bloqueado</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={editLoading}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
