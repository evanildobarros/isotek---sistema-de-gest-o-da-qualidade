import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Users, DollarSign, Activity, Plus, Search,
    MoreVertical, Lock, Unlock, ExternalLink, Building2, Mail, Key, AlertCircle,
    ClipboardCheck, UserPlus, Link2, Calendar, X, Loader2, Settings, Globe, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Company, AuditAssignment } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';
import { AUDIT_BASE_PRICE, AUDITOR_RATES } from '../../../lib/constants';
import { calculateAuditEarnings } from '../../../lib/utils/finance';

// Interface para Auditores
interface Auditor {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    // Status calculado
    status: 'livre' | 'em_auditoria';
    active_assignments?: number;
    estimated_payout?: number;
    commission_tier?: string;
    custom_commission_rate?: number;
}

// Função para formatar CNPJ: XX.XXX.XXX/XXXX-XX
const formatCNPJ = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 14);
    let formatted = limited;
    if (limited.length > 2) formatted = limited.slice(0, 2) + '.' + limited.slice(2);
    if (limited.length > 5) formatted = formatted.slice(0, 6) + '.' + formatted.slice(6);
    if (limited.length > 8) formatted = formatted.slice(0, 10) + '/' + formatted.slice(10);
    if (limited.length > 12) formatted = formatted.slice(0, 15) + '-' + formatted.slice(15);
    return formatted;
};

export const SuperAdminPage: React.FC = () => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [stats, setStats] = useState({ total: 0, revenue: 0, active: 0 });
    const [error, setError] = useState<string | null>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<'empresas' | 'auditores'>('empresas');

    // Auditors State
    const [auditors, setAuditors] = useState<Auditor[]>([]);
    const [loadingAuditors, setLoadingAuditors] = useState(false);
    const [auditorSearch, setAuditorSearch] = useState('');

    // Modal: Novo Auditor
    const [isNewAuditorModalOpen, setIsNewAuditorModalOpen] = useState(false);
    const [newAuditorForm, setNewAuditorForm] = useState({ name: '', email: '', password: '' });
    const [savingAuditor, setSavingAuditor] = useState(false);

    // Modal: Designar Auditor
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedAuditor, setSelectedAuditor] = useState<Auditor | null>(null);
    const [assignForm, setAssignForm] = useState({ companyId: '', startDate: '', endDate: '', notes: '' });
    const [savingAssign, setSavingAssign] = useState(false);

    // Modal: Configuração de Comissão
    const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
    const [commissionForm, setCommissionForm] = useState({ tier: 'bronze', customRate: '' as string | number });
    const [savingCommission, setSavingCommission] = useState(false);

    // Global Settings
    const [isGlobalSettingsModalOpen, setIsGlobalSettingsModalOpen] = useState(false);
    const [globalRates, setGlobalRates] = useState<Record<string, number>>({});
    const [savingGlobalSettings, setSavingGlobalSettings] = useState(false);
    const [loadingGlobalSettings, setLoadingGlobalSettings] = useState(false);

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

    // Confirmation modal states
    const [toggleStatusModal, setToggleStatusModal] = useState<{ isOpen: boolean; company: Company | null }>({
        isOpen: false,
        company: null
    });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; company: Company | null; step: number }>({
        isOpen: false,
        company: null,
        step: 1
    });

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
                fetchGlobalSettings();
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
                fetchGlobalSettings();
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

    // Fetch auditors when tab changes
    useEffect(() => {
        if (activeTab === 'auditores' && auditors.length === 0) {
            fetchAuditors();
        }
    }, [activeTab]);

    // Fetch Auditors
    const fetchAuditors = async () => {
        setLoadingAuditors(true);
        try {
            // Buscar usuários com role = auditor
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, role, created_at, commission_tier, custom_commission_rate')
                .eq('role', 'auditor')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // Buscar emails via RPC
            const { data: usersWithEmails } = await supabase.rpc('get_users_with_emails');
            const emailMap = new Map<string, string>(usersWithEmails?.map((u: any) => [u.id, u.email as string]) || []);

            // Buscar assignments ativos para cada auditor (exclui apenas concluídas e canceladas)
            const { data: activeAssignments, error: assignmentsError } = await supabase
                .from('audit_assignments')
                .select('auditor_id, status');

            console.log('Active Assignments:', activeAssignments, 'Error:', assignmentsError);

            // Contar auditorias ativas (não concluídas/canceladas)
            const assignmentCount = new Map<string, number>();
            // Contar auditorias concluídas para cálculo de ganhos
            const completedCount = new Map<string, number>();

            activeAssignments?.forEach((a: any) => {
                if (a.status === 'concluida') {
                    completedCount.set(a.auditor_id, (completedCount.get(a.auditor_id) || 0) + 1);
                } else if (a.status !== 'cancelada') {
                    assignmentCount.set(a.auditor_id, (assignmentCount.get(a.auditor_id) || 0) + 1);
                }
            });

            const mappedAuditors: Auditor[] = (profiles || []).map((p: any) => {
                const tier = p.commission_tier || 'bronze';
                const customRate = p.custom_commission_rate;
                const completedAudits = completedCount.get(p.id) || 0;
                const activeAudits = assignmentCount.get(p.id) || 0;

                // Calcular ganhos de auditorias CONCLUÍDAS
                const earnings = calculateAuditEarnings(
                    completedAudits * AUDIT_BASE_PRICE,
                    tier,
                    customRate
                );

                return {
                    id: p.id,
                    full_name: p.full_name || 'Sem nome',
                    email: emailMap.get(p.id) || 'N/A',
                    role: p.role,
                    created_at: p.created_at,
                    commission_tier: tier,
                    custom_commission_rate: customRate,
                    status: activeAudits > 0 ? 'em_auditoria' : 'livre',
                    active_assignments: activeAudits + completedAudits, // Total de auditorias
                    estimated_payout: earnings.auditorShare // Valor de auditorias concluídas
                };
            });

            setAuditors(mappedAuditors);
        } catch (error: any) {
            console.error('Erro ao buscar auditores:', error);
            toast.error('Erro ao carregar auditores');
        } finally {
            setLoadingAuditors(false);
        }
    };

    // Create new auditor
    const handleCreateAuditor = async () => {
        if (!newAuditorForm.name || !newAuditorForm.email || !newAuditorForm.password) {
            toast.error('Preencha todos os campos');
            return;
        }

        setSavingAuditor(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-create-user', {
                body: {
                    email: newAuditorForm.email,
                    password: newAuditorForm.password,
                    fullName: newAuditorForm.name,
                    role: 'auditor'
                }
            });

            console.log('Resposta da Edge Function:', { data, error });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success(`Auditor ${newAuditorForm.name} criado com sucesso!\nSenha: ${newAuditorForm.password}`);
            setIsNewAuditorModalOpen(false);
            setNewAuditorForm({ name: '', email: '', password: '' });
            fetchAuditors();
        } catch (error: any) {
            console.error('Erro completo:', error);
            toast.error('Erro ao criar auditor: ' + (error.message || JSON.stringify(error)));
        } finally {
            setSavingAuditor(false);
        }
    };

    // Assign auditor to company
    const handleAssignAuditor = async () => {
        if (!selectedAuditor || !assignForm.companyId || !assignForm.startDate) {
            toast.error('Preencha empresa e data de início');
            return;
        }

        setSavingAssign(true);
        try {
            const { error } = await supabase
                .from('audit_assignments')
                .insert([{
                    auditor_id: selectedAuditor.id,
                    company_id: assignForm.companyId,
                    start_date: assignForm.startDate,
                    end_date: assignForm.endDate || null,
                    notes: assignForm.notes || null,
                    status: 'agendada',
                    created_by: user?.id
                }]);

            if (error) throw error;

            toast.success('Auditor designado com sucesso!');
            setIsAssignModalOpen(false);
            setSelectedAuditor(null);
            setAssignForm({ companyId: '', startDate: '', endDate: '', notes: '' });
            fetchAuditors();
        } catch (error: any) {
            console.error('Erro ao designar auditor:', error);
            toast.error('Erro ao designar: ' + error.message);
        } finally {
            setSavingAssign(false);
        }
    };

    // Global Settings Functions
    const fetchGlobalSettings = async () => {
        setLoadingGlobalSettings(true);
        const { data, error } = await supabase
            .from('global_settings')
            .select('value')
            .eq('key', 'auditor_rates')
            .single();

        if (error) {
            console.error('Error fetching global settings:', error);
            // Fallback para constantes se falhar
            setGlobalRates({
                bronze: 0.70,
                silver: 0.75,
                gold: 0.80,
                platinum: 0.85,
                diamond: 0.90
            });
        } else if (data) {
            // Se as chaves platinum/diamond estiverem faltando no dado legado, garante que existam
            const rates = {
                bronze: 0.70,
                silver: 0.75,
                gold: 0.80,
                platinum: 0.85,
                diamond: 0.90,
                ...data.value
            };
            setGlobalRates(rates);
        }
        setLoadingGlobalSettings(false);
    };

    const handleUpdateGlobalSettings = async () => {
        setSavingGlobalSettings(true);
        const { error } = await supabase
            .from('global_settings')
            .upsert({
                key: 'auditor_rates',
                value: globalRates,
                updated_at: new Date().toISOString(),
                updated_by: user?.id
            });

        if (error) {
            toast.error('Erro ao salvar configurações globais');
            console.error('Error updating global settings:', error);
        } else {
            toast.success('Configurações globais atualizadas com sucesso!');
            setIsGlobalSettingsModalOpen(false);
            fetchAuditors(); // Recarregar para atualizar os cálculos
        }
        setSavingGlobalSettings(false);
    };

    // Open assign modal
    const openAssignModal = (auditor: Auditor) => {
        setSelectedAuditor(auditor);
        setAssignForm({
            companyId: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            notes: ''
        });
        setIsAssignModalOpen(true);
    };

    // Open commission modal
    const openCommissionModal = (auditor: Auditor) => {
        setSelectedAuditor(auditor);
        setCommissionForm({
            tier: auditor.commission_tier || 'bronze',
            customRate: auditor.custom_commission_rate || ''
        });
        setIsCommissionModalOpen(true);
    };

    // Update commission settings
    const handleUpdateCommission = async () => {
        if (!selectedAuditor) return;

        setSavingCommission(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    commission_tier: commissionForm.tier,
                    custom_commission_rate: commissionForm.customRate === '' ? null : Number(commissionForm.customRate)
                })
                .eq('id', selectedAuditor.id);

            if (error) throw error;

            toast.success(`Configurações de ${selectedAuditor.full_name} atualizadas!`);
            setIsCommissionModalOpen(false);
            fetchAuditors();
        } catch (error: any) {
            console.error('Erro ao atualizar comissão:', error);
            toast.error('Erro ao atualizar: ' + error.message);
        } finally {
            setSavingCommission(false);
        }
    };

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
            cnpj: formatCNPJ(company.cnpj || ''),
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
                    cnpj: editForm.cnpj.replace(/\D/g, ''), // Remove formatação antes de salvar
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
        setToggleStatusModal({ isOpen: true, company });
        setOpenMenuId(null);
    };

    const confirmToggleStatus = async () => {
        if (!toggleStatusModal.company) return;
        const company = toggleStatusModal.company;
        const newStatus = company.status === 'active' ? 'inactive' : 'active';

        try {
            const { error } = await supabase
                .from('company_info')
                .update({ status: newStatus })
                .eq('id', company.id);

            if (error) throw error;
            setToggleStatusModal({ isOpen: false, company: null });
            fetchCompanies();
            toast.success(`Empresa ${newStatus === 'active' ? 'ativada' : 'bloqueada'} com sucesso!`);
        } catch (error: any) {
            console.error('Error toggling status:', error);
            toast.error(`Erro ao alterar status: ${error.message}`);
            setToggleStatusModal({ isOpen: false, company: null });
        }
    };

    const handleDelete = async (company: Company) => {
        setDeleteModal({ isOpen: true, company, step: 1 });
        setOpenMenuId(null);
    };

    const confirmDelete = async () => {
        if (!deleteModal.company) return;

        // First confirmation - move to step 2
        if (deleteModal.step === 1) {
            setDeleteModal({ ...deleteModal, step: 2 });
            return;
        }

        // Second confirmation - actually delete
        try {
            const { error } = await supabase.rpc('delete_company', { p_company_id: deleteModal.company.id });

            if (error) throw error;

            toast.success('Empresa excluída com sucesso.');
            setDeleteModal({ isOpen: false, company: null, step: 1 });
            fetchCompanies();
        } catch (error: any) {
            console.error('Error deleting company:', error);
            toast.error(`Erro ao excluir: ${error.message}`);
            setDeleteModal({ isOpen: false, company: null, step: 1 });
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
                p_cnpj: companyForm.cnpj.replace(/\D/g, ''), // Remove formatação antes de salvar
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
            {/* Toggle Status Confirmation Modal */}
            <ConfirmModal
                isOpen={toggleStatusModal.isOpen}
                onClose={() => setToggleStatusModal({ isOpen: false, company: null })}
                onConfirm={confirmToggleStatus}
                title={toggleStatusModal.company?.status === 'active' ? 'Bloquear Empresa' : 'Ativar Empresa'}
                message={`Deseja realmente ${toggleStatusModal.company?.status === 'active' ? 'bloquear' : 'ativar'} a empresa ${toggleStatusModal.company?.name}?`}
                confirmLabel={toggleStatusModal.company?.status === 'active' ? 'Bloquear' : 'Ativar'}
                variant={toggleStatusModal.company?.status === 'active' ? 'warning' : 'primary'}
            />

            {/* Delete Company Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, company: null, step: 1 })}
                onConfirm={confirmDelete}
                title={deleteModal.step === 1 ? 'Excluir Empresa' : 'Confirmação Final'}
                message={deleteModal.step === 1
                    ? `PERIGO: Tem certeza que deseja EXCLUIR a empresa ${deleteModal.company?.name}?\n\nIsso apagará TODOS os dados e usuários desta empresa.\n\nEsta ação não pode ser desfeita.`
                    : `Confirmação Dupla: Realmente deseja excluir ${deleteModal.company?.name}?`
                }
                confirmLabel={deleteModal.step === 1 ? 'Continuar' : 'Excluir Permanentemente'}
                variant="danger"
            />

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

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('empresas')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'empresas'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Empresas
                    </button>
                    <button
                        onClick={() => setActiveTab('auditores')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'auditores'
                            ? 'border-amber-600 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <ClipboardCheck className="w-4 h-4" />
                        Auditores
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* ========== ABA: EMPRESAS ========== */}
                {activeTab === 'empresas' && (
                    <>

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
                                                        <p className="text-xs text-gray-500">{company.cnpj ? formatCNPJ(company.cnpj) : 'Sem CNPJ'}</p>
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
                    </>
                )}

                {/* ========== ABA: AUDITORES ========== */}
                {activeTab === 'auditores' && (
                    <>
                        {/* Actions Bar Auditores */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar auditor..."
                                    value={auditorSearch}
                                    onChange={(e) => setAuditorSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setIsGlobalSettingsModalOpen(true)}
                                    className="flex-1 sm:flex-none border border-amber-200 text-amber-700 hover:bg-amber-50 px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Globe className="w-5 h-5" />
                                    Taxas Globais
                                </button>
                                <button
                                    onClick={() => {
                                        setNewAuditorForm({ name: '', email: '', password: Math.random().toString(36).slice(-8) });
                                        setIsNewAuditorModalOpen(true);
                                    }}
                                    className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Novo Auditor
                                </button>
                            </div>
                        </div>

                        {/* Auditors Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                            {loadingAuditors ? (
                                <div className="flex items-center justify-center h-96">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-amber-50 border-b border-amber-200">
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider">Auditor</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider">E-mail</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider text-center">Auditorias</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider">Nível / Taxa</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider">Valor Previsto</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider">Cadastrado em</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-amber-700 uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {auditors
                                            .filter(a =>
                                                a.full_name.toLowerCase().includes(auditorSearch.toLowerCase()) ||
                                                a.email.toLowerCase().includes(auditorSearch.toLowerCase())
                                            )
                                            .map((auditor) => (
                                                <tr key={auditor.id} className="hover:bg-amber-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                                                                {auditor.full_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium text-gray-900">{auditor.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{auditor.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${auditor.status === 'livre'
                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                                                            }`}>
                                                            {auditor.status === 'livre' ? '✅ Livre' : '🔶 Em Auditoria'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 text-center">
                                                        {auditor.active_assignments || 0}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${auditor.commission_tier === 'gold' ? 'bg-amber-100 text-amber-700' :
                                                                auditor.commission_tier === 'silver' ? 'bg-slate-100 text-slate-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {auditor.commission_tier || 'bronze'}
                                                            </span>
                                                            {auditor.custom_commission_rate && (
                                                                <span className="text-[10px] font-semibold text-blue-600">
                                                                    Taxa: {auditor.custom_commission_rate}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                                                        {(auditor.estimated_payout || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(auditor.created_at).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openCommissionModal(auditor)}
                                                                className="p-2 text-gray-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="Configurações de Taxa"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openAssignModal(auditor)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                                                            >
                                                                <Link2 className="w-4 h-4" />
                                                                Designar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        {auditors.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                    Nenhum auditor cadastrado. Clique em "Novo Auditor" para começar.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

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
                                            onChange={e => setCompanyForm({ ...companyForm, cnpj: formatCNPJ(e.target.value) })}
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
                                    onChange={e => setEditForm({ ...editForm, cnpj: formatCNPJ(e.target.value) })}
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

            {/* Modal: Novo Auditor */}
            {isNewAuditorModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                <UserPlus className="w-5 h-5" />
                                Cadastrar Novo Auditor
                            </h2>
                            <button onClick={() => setIsNewAuditorModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={newAuditorForm.name}
                                        onChange={e => setNewAuditorForm({ ...newAuditorForm, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Ex: Maria Auditora"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={newAuditorForm.email}
                                        onChange={e => setNewAuditorForm({ ...newAuditorForm, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="auditor@email.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={newAuditorForm.password}
                                        onChange={e => setNewAuditorForm({ ...newAuditorForm, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Copie esta senha para enviar ao auditor.</p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsNewAuditorModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateAuditor}
                                disabled={savingAuditor || !newAuditorForm.name || !newAuditorForm.email}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingAuditor ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                {savingAuditor ? 'Criando...' : 'Criar Auditor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Configuração de Comissão */}
            {isCommissionModalOpen && selectedAuditor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-slate-500" />
                                Taxas do Auditor
                            </h2>
                            <button onClick={() => setIsCommissionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-800">{selectedAuditor.full_name}</p>
                                <p className="text-xs text-slate-500">{selectedAuditor.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nível do Auditor</label>
                                <select
                                    value={commissionForm.tier}
                                    onChange={e => setCommissionForm({ ...commissionForm, tier: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="bronze">Bronze ({Math.round((globalRates.bronze || 0.70) * 100)}%)</option>
                                    <option value="silver">Prata ({Math.round((globalRates.silver || 0.75) * 100)}%)</option>
                                    <option value="gold">Ouro ({Math.round((globalRates.gold || 0.80) * 100)}%)</option>
                                    <option value="platinum">Platina ({Math.round((globalRates.platinum || 0.85) * 100)}%)</option>
                                    <option value="diamond">Diamante ({Math.round((globalRates.diamond || 0.90) * 100)}%)</option>
                                </select>
                                <p className="text-[10px] text-gray-500 mt-1.5 px-1">
                                    Níveis padrão conforme política de gamificação.
                                </p>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Taxa Personalizada (%)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        %
                                    </div>
                                    <input
                                        type="number"
                                        value={commissionForm.customRate}
                                        onChange={e => setCommissionForm({ ...commissionForm, customRate: e.target.value })}
                                        placeholder="Ex: 72.5"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                                    />
                                </div>
                                <p className="text-[10px] text-amber-600 mt-2 flex items-start gap-1 px-1 leading-relaxed">
                                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>Preencher apenas se desejar sobrescrever a regra do nível. Deixe vazio para usar a taxa padrão do nível selecionado.</span>
                                </p>
                            </div>
                        </div>

                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            onClick={() => setIsCommissionModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-bold text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateCommission}
                            disabled={savingCommission}
                            className="px-6 py-2 bg-[#025159] text-white rounded-xl font-bold text-sm hover:bg-[#013d42] disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
                        >
                            {savingCommission ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* Modal: Configurações Globais de Taxas */}
            {isGlobalSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-amber-600" />
                                Taxas Globais de Comissão
                            </h2>
                            <button onClick={() => setIsGlobalSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <p className="text-sm text-gray-600">
                                Estas são as taxas padrão para cada nível de auditor. Alterações aqui afetarão todos os auditores que não possuem uma taxa personalizada definida.
                            </p>

                            <div className="space-y-4">
                                {Object.keys(globalRates).map((tier) => (
                                    <div key={tier} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">{tier}</span>
                                            <span className="text-xs text-gray-500">Taxa padrão do nível</span>
                                        </div>
                                        <div className="relative w-32">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={Math.round(globalRates[tier] * 100)}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) / 100;
                                                    setGlobalRates({ ...globalRates, [tier]: val });
                                                }}
                                                className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none font-medium text-right"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsGlobalSettingsModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateGlobalSettings}
                                disabled={savingGlobalSettings}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingGlobalSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {savingGlobalSettings ? 'Salvando...' : 'Salvar Taxas Globais'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPage;
