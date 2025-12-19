import React, { useState, useEffect } from 'react';
import { Shield, Users, Save, Plus, Trash2, Edit2, CheckCircle, FileText, Loader2, History, Eye, Clock, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { PolicyVersion } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

interface JobRole {
    id: string;
    title: string;
    department: string;
    responsibilities: string;
    authorities: string;
}

export const LeadershipPage: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'policy' | 'roles'>('policy');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);

    useEffect(() => {
        if (location.pathname.includes('responsabilidades')) {
            setActiveTab('roles');
        } else {
            setActiveTab('policy');
        }
    }, [location.pathname]);

    // Policy State
    const [policyData, setPolicyData] = useState({
        content: '',
        date: '',
        version: ''
    });

    // Roles State
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<JobRole | null>(null);
    const [roleForm, setRoleForm] = useState({
        title: '',
        department: '',
        responsibilities: '',
        authorities: ''
    });

    // Version Control State
    const [versions, setVersions] = useState<PolicyVersion[]>([]);
    const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
    const [viewingVersion, setViewingVersion] = useState<PolicyVersion | null>(null);

    // Confirmation modal states
    const [deleteRoleModal, setDeleteRoleModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });
    const [restoreVersionModal, setRestoreVersionModal] = useState<{ isOpen: boolean; version: PolicyVersion | null }>({
        isOpen: false,
        version: null
    });

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load Company Info & Policy
            const { data: company, error: companyError } = await supabase
                .from('company_info')
                .select('id, quality_policy, quality_policy_date, quality_policy_version')
                .eq('owner_id', user?.id)
                .single();

            if (companyError && companyError.code !== 'PGRST116') throw companyError;

            if (company) {
                setCompanyId(company.id);
                setPolicyData({
                    content: company.quality_policy || '',
                    date: company.quality_policy_date || '',
                    version: company.quality_policy_version || ''
                });

                // Load Roles
                const { data: rolesData, error: rolesError } = await supabase
                    .from('job_roles')
                    .select('id, title, department, responsibilities, authorities, company_id, created_at')
                    .eq('company_id', company.id)
                    .order('created_at', { ascending: false });

                if (rolesError) throw rolesError;
                setRoles(rolesData || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePolicy = async () => {
        if (!companyId) return;
        setSaving(true);
        try {
            // Save to company_info
            const { error } = await supabase
                .from('company_info')
                .update({
                    quality_policy: policyData.content,
                    quality_policy_date: policyData.date,
                    quality_policy_version: policyData.version
                })
                .eq('id', companyId);

            if (error) throw error;

            // Save version to history
            await saveVersion();

            toast.success('Política da Qualidade salva com sucesso!');
        } catch (error: any) {
            console.error('Error saving policy:', error);
            toast.error('Erro ao salvar política: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const saveVersion = async () => {
        if (!companyId || !policyData.content.trim()) return;

        try {
            const { error } = await supabase
                .from('policy_versions')
                .insert([{
                    company_id: companyId,
                    content: policyData.content,
                    version: policyData.version || '1.0',
                    approval_date: policyData.date || null,
                    created_by: user?.id
                }]);

            if (error) throw error;
        } catch (error: any) {
            console.error('Error saving version:', error);
        }
    };

    const loadVersionHistory = async () => {
        if (!companyId) return;

        try {
            const { data, error } = await supabase
                .from('policy_versions_with_creator')
                .select('id, company_id, content, version, approval_date, created_by, created_at, created_by_name')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVersions(data || []);
        } catch (error: any) {
            console.error('Error loading versions:', error);
        }
    };

    const viewVersion = (version: PolicyVersion) => {
        setViewingVersion(version);
    };

    const restoreVersion = async (version: PolicyVersion) => {
        setRestoreVersionModal({ isOpen: true, version });
    };

    const confirmRestoreVersion = async () => {
        if (!restoreVersionModal.version) return;

        setPolicyData({
            content: restoreVersionModal.version.content,
            date: restoreVersionModal.version.approval_date || '',
            version: restoreVersionModal.version.version
        });
        setViewingVersion(null);
        toast.info('Versão restaurada! Clique em "Salvar Política" para confirmar.');
    };

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;
        setSaving(true);

        try {
            if (editingRole) {
                const { error } = await supabase
                    .from('job_roles')
                    .update({
                        title: roleForm.title,
                        department: roleForm.department,
                        responsibilities: roleForm.responsibilities,
                        authorities: roleForm.authorities
                    })
                    .eq('id', editingRole.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('job_roles')
                    .insert([{
                        company_id: companyId,
                        title: roleForm.title,
                        department: roleForm.department,
                        responsibilities: roleForm.responsibilities,
                        authorities: roleForm.authorities
                    }]);

                if (error) throw error;
            }

            setIsRoleModalOpen(false);
            setEditingRole(null);
            setRoleForm({ title: '', department: '', responsibilities: '', authorities: '' });
            loadData(); // Reload to get fresh data
        } catch (error: any) {
            console.error('Error saving role:', error);
            toast.error('Erro ao salvar cargo: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (id: string) => {
        setDeleteRoleModal({ isOpen: true, id });
    };

    const confirmDeleteRole = async () => {
        if (!deleteRoleModal.id) return;
        try {
            const { error } = await supabase
                .from('job_roles')
                .delete()
                .eq('id', deleteRoleModal.id);

            if (error) throw error;
            setRoles(roles.filter(r => r.id !== deleteRoleModal.id));
            toast.success('Cargo excluído com sucesso!');
        } catch (error: any) {
            console.error('Error deleting role:', error);
            toast.error('Erro ao excluir cargo: ' + error.message);
        }
    };

    const openRoleModal = (role?: JobRole) => {
        if (role) {
            setEditingRole(role);
            setRoleForm({
                title: role.title,
                department: role.department,
                responsibilities: role.responsibilities,
                authorities: role.authorities || ''
            });
        } else {
            setEditingRole(null);
            setRoleForm({ title: '', department: '', responsibilities: '', authorities: '' });
        }
        setIsRoleModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#025159]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
            {/* Delete Role Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteRoleModal.isOpen}
                onClose={() => setDeleteRoleModal({ isOpen: false, id: null })}
                onConfirm={confirmDeleteRole}
                title="Excluir Cargo"
                message="Tem certeza que deseja excluir este cargo?"
                confirmLabel="Excluir"
                variant="danger"
            />

            {/* Restore Version Confirmation Modal */}
            <ConfirmModal
                isOpen={restoreVersionModal.isOpen}
                onClose={() => setRestoreVersionModal({ isOpen: false, version: null })}
                onConfirm={confirmRestoreVersion}
                title="Restaurar Versão"
                message="Deseja restaurar esta versão da política?"
                confirmLabel="Restaurar"
                variant="primary"
            />

            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#025159] dark:text-[#03A6A6]">Liderança e Compromisso</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Gestão da Política da Qualidade e Papéis Organizacionais (ISO 9001: Seção 5)
                </p>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <button
                    onClick={() => setActiveTab('policy')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'policy'
                        ? 'text-[#025159] border-b-2 border-[#025159] dark:text-[#03A6A6] dark:border-[#03A6A6]'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText size={18} />
                        Política da Qualidade (5.2)
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'roles'
                        ? 'text-[#025159] border-b-2 border-[#025159] dark:text-[#03A6A6] dark:border-[#03A6A6]'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users size={18} />
                        Papéis e Responsabilidades (5.3)
                    </div>
                </button>
            </div>

            {/* Content */}
            {activeTab === 'policy' ? (
                <div className="space-y-6">
                    {/* 1. Preview (Visualização) - Top Full Width */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Visualização</h2>
                            <button
                                onClick={() => {
                                    loadVersionHistory();
                                    setIsVersionHistoryOpen(true);
                                }}
                                className="flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                            >
                                <History size={16} />
                                Histórico de Versões
                            </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border-l-4 border-[#025159] italic text-gray-700 dark:text-gray-300">
                            {policyData.content || "A política aparecerá aqui..."}
                        </div>
                        <div className="mt-4 text-xs text-gray-500 text-right">
                            Versão: {policyData.version || "N/A"} | Data: {policyData.date || "N/A"}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 2. Editor - Left Side */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Edit2 size={20} className="text-[#025159] dark:text-[#03A6A6]" />
                                Editor da Política
                            </h2>

                            <div className="space-y-4">
                                <textarea
                                    value={policyData.content}
                                    onChange={(e) => setPolicyData({ ...policyData, content: e.target.value })}
                                    placeholder="Escreva aqui a Política da Qualidade da sua empresa..."
                                    className="w-full h-64 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] resize-none placeholder-gray-400 dark:placeholder-gray-500"
                                />

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Aprovação</label>
                                        <input
                                            type="date"
                                            value={policyData.date}
                                            onChange={(e) => setPolicyData({ ...policyData, date: e.target.value })}
                                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Versão</label>
                                        <input
                                            type="text"
                                            value={policyData.version}
                                            onChange={(e) => setPolicyData({ ...policyData, version: e.target.value })}
                                            placeholder="1.0"
                                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSavePolicy}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-[#025159] text-white px-6 py-2.5 rounded-lg hover:bg-[#3F858C] transition-colors shadow-lg disabled:opacity-70"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Salvar Política
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Checklist - Right Side */}
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    Requisitos ISO 9001
                                </h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200 cursor-pointer">
                                        <input type="checkbox" className="rounded text-[#025159] focus:ring-[#025159]" defaultChecked />
                                        Comunicada e entendida na organização
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200 cursor-pointer">
                                        <input type="checkbox" className="rounded text-[#025159] focus:ring-[#025159]" defaultChecked />
                                        Disponível para partes interessadas
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => openRoleModal()}
                            className="flex items-center gap-2 bg-[#025159] text-white px-4 py-2 rounded-lg hover:bg-[#3F858C] transition-colors shadow-md"
                        >
                            <Plus size={20} />
                            Adicionar Cargo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {roles.map(role => (
                            <div key={role.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{role.title}</h3>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                            {role.department}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openRoleModal(role)}
                                            className="p-2 text-gray-400 hover:text-[#025159] hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRole(role.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Responsabilidades</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">{role.responsibilities}</p>
                                    </div>
                                    {role.authorities && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Autoridades</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 whitespace-pre-wrap">{role.authorities}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {roles.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Nenhum cargo definido ainda.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Role Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
                        </h3>

                        <form onSubmit={handleSaveRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título do Cargo *</label>
                                <input
                                    type="text"
                                    required
                                    value={roleForm.title}
                                    onChange={e => setRoleForm({ ...roleForm, title: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    placeholder="Ex: Gerente da Qualidade"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                                <input
                                    type="text"
                                    value={roleForm.department}
                                    onChange={e => setRoleForm({ ...roleForm, department: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    placeholder="Ex: Qualidade"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsabilidades *</label>
                                <textarea
                                    required
                                    value={roleForm.responsibilities}
                                    onChange={e => setRoleForm({ ...roleForm, responsibilities: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] h-32 resize-none"
                                    placeholder="Liste as principais responsabilidades..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Autoridades</label>
                                <textarea
                                    value={roleForm.authorities}
                                    onChange={e => setRoleForm({ ...roleForm, authorities: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] h-24 resize-none"
                                    placeholder="Ex: Autoridade para parar a produção..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsRoleModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors disabled:opacity-70"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Version History Modal */}
            {isVersionHistoryOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <History size={24} />
                                Histórico de Versões da Política
                            </h3>
                            <button
                                onClick={() => setIsVersionHistoryOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {versions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                <p>Nenhuma versão salva ainda.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {versions.map((version, index) => (
                                    <div
                                        key={version.id}
                                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded">
                                                        Versão {version.version}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                                                            Atual
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                                                    {version.content.substring(0, 120)}...
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        {version.created_by_name || 'Sistema'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(version.created_at).toLocaleString('pt-BR')}
                                                    </span>
                                                    {version.approval_date && (
                                                        <span>Aprovada em: {new Date(version.approval_date).toLocaleDateString('pt-BR')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => viewVersion(version)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {index !== 0 && (
                                                    <button
                                                        onClick={() => restoreVersion(version)}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Restaurar"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Version View Modal */}
            {viewingVersion && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Versão {viewingVersion.version}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Salva em {new Date(viewingVersion.created_at).toLocaleString('pt-BR')} por {viewingVersion.created_by_name || 'Sistema'}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingVersion(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <Edit2 size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border-l-4 border-[#025159] mb-4">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {viewingVersion.content}
                            </p>
                        </div>

                        {viewingVersion.approval_date && (
                            <div className="text-sm text-gray-500 mb-4">
                                Data de aprovação: {new Date(viewingVersion.approval_date).toLocaleDateString('pt-BR')}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setViewingVersion(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => restoreVersion(viewingVersion)}
                                className="flex-1 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Restaurar Esta Versão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
