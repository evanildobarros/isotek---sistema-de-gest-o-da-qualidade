import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Users, DollarSign, Activity, Plus, Search,
    MoreVertical, Lock, Unlock, ExternalLink, Building2, Mail, Key
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Company } from '../types';

export const SuperAdminPage: React.FC = () => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [stats, setStats] = useState({ total: 0, revenue: 0, active: 0 });

    // Wizard State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [wizardLoading, setWizardLoading] = useState(false);

    // Form Data
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
            if (!user) return;

            // Check specific email OR profile flag
            const isEvanildo = user.email === 'evanildobarros@gmail.com'; // Replace with your actual email if different

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

    const fetchCompanies = async () => {
        try {
            // Use RPC to bypass RLS
            const { data, error } = await supabase.rpc('get_all_companies');

            if (error) throw error;

            if (data) {
                setCompanies(data);
                // Calculate stats
                const total = data.length;
                const revenue = data.reduce((acc: number, curr: Company) => acc + (curr.monthly_revenue || 0), 0);
                const active = data.filter((c: Company) => c.status === 'active').length;
                setStats({ total, revenue, active });
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    // --- Wizard Logic ---

    const handleOpenWizard = () => {
        setStep(1);
        setCompanyForm({ name: '', cnpj: '', plan: 'start' });
        setUserForm({ name: '', email: '', password: Math.random().toString(36).slice(-8) });
        setIsModalOpen(true);
    };

    const handleCreateClient = async () => {
        setWizardLoading(true);
        try {
            // 1. Create User (SignUp)
            // Note: This signs up a user. If email confirmation is on, they won't be able to login immediately unless confirmed.
            // For a SaaS backoffice, usually we want to auto-confirm or use an Admin API.
            // Since we are using client-side SDK, we are limited. 
            // We will use standard signUp. 

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userForm.email,
                password: userForm.password,
                options: {
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
            alert(`Cliente criado com sucesso!\n\nEnvie para o cliente:\nLogin: ${userForm.email}\nSenha: ${userForm.password}`);
            setIsModalOpen(false);
            fetchCompanies();

        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            alert(`Erro ao criar cliente: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
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
                            <h3 className="text-2xl font-bold text-gray-900">R$ {stats.revenue.toLocaleString('pt-BR')}</h3>
                        </div>
                    </div>
                </div>

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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plano</th>
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
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                {company.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{company.name}</p>
                                                <p className="text-xs text-gray-500">{company.cnpj || 'Sem CNPJ'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {company.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                            {company.plan || 'Start'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        R$ {(company.monthly_revenue || 0).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(company.created_at || '').toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-slate-600 p-2">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Wizard Modal */}
            {isModalOpen && (
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
                                    onClick={() => setIsModalOpen(false)}
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
        </div>
    );
};
