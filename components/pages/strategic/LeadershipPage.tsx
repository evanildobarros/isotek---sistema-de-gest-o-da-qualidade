import React, { useState, useEffect } from 'react';
import { Shield, Users, Save, Plus, Trash2, Edit2, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

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
                    .select('*')
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
            const { error } = await supabase
                .from('company_info')
                .update({
                    quality_policy: policyData.content,
                    quality_policy_date: policyData.date,
                    quality_policy_version: policyData.version
                })
                .eq('id', companyId);

            if (error) throw error;
            alert('Política da Qualidade salva com sucesso!');
        } catch (error: any) {
            console.error('Error saving policy:', error);
            alert('Erro ao salvar política: ' + error.message);
        } finally {
            setSaving(false);
        }
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
            alert('Erro ao salvar cargo: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cargo?')) return;
        try {
            const { error } = await supabase
                .from('job_roles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRoles(roles.filter(r => r.id !== id));
        } catch (error: any) {
            console.error('Error deleting role:', error);
            alert('Erro ao excluir cargo: ' + error.message);
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
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-7 h-7 text-[#025159] dark:text-[#03A6A6]" />
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
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Visualização</h2>
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
        </div>
    );
};
