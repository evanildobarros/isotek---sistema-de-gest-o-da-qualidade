import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, X, Calendar, Building2, User, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { PageHeader } from '../../common/PageHeader';
import { AuditAssignment } from '../../../types';

interface UserOption {
    id: string;
    full_name: string;
    email: string;
}

interface CompanyOption {
    id: string;
    name: string;
}

export const AuditAssignmentsPage: React.FC = () => {
    const { user, company, isSuperAdmin } = useAuthContext();
    const [assignments, setAssignments] = useState<AuditAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Opções para selects
    const [users, setUsers] = useState<UserOption[]>([]);
    const [companies, setCompanies] = useState<CompanyOption[]>([]);

    // Formulário
    const [formData, setFormData] = useState({
        auditor_id: '',
        company_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
    });

    useEffect(() => {
        fetchAssignments();
        if (isSuperAdmin) {
            fetchUsers();
            fetchCompanies();
        }
    }, [isSuperAdmin]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('audit_assignments')
                .select(`
          *,
          company:company_info(id, name)
        `)
                .order('created_at', { ascending: false });

            // Se não for Super Admin, mostrar apenas vínculos da própria empresa
            if (!isSuperAdmin && company?.id) {
                query = query.eq('company_id', company.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Erro ao buscar vínculos:', error);
                toast.error('Erro ao carregar vínculos de auditoria');
                return;
            }

            // Buscar nomes dos auditores
            const auditorIds = [...new Set((data || []).map(d => d.auditor_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', auditorIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

            const mapped: AuditAssignment[] = (data || []).map(item => ({
                id: item.id,
                auditor_id: item.auditor_id,
                company_id: item.company_id,
                start_date: item.start_date,
                end_date: item.end_date,
                status: item.status,
                notes: item.notes,
                created_by: item.created_by,
                created_at: item.created_at,
                updated_at: item.updated_at,
                auditor_name: profileMap.get(item.auditor_id) || 'Auditor',
                company_name: item.company?.name || 'Empresa'
            }));

            setAssignments(mapped);
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.rpc('get_users_with_emails');
            if (!error && data) {
                setUsers(data.map((u: any) => ({
                    id: u.id,
                    full_name: u.full_name || 'Sem nome',
                    email: u.email
                })));
            }
        } catch (e) {
            console.error('Erro ao buscar usuários:', e);
        }
    };

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('company_info')
                .select('id, name')
                .order('name');

            if (!error && data) {
                setCompanies(data);
            }
        } catch (e) {
            console.error('Erro ao buscar empresas:', e);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('audit_assignments')
                .insert([{
                    auditor_id: formData.auditor_id,
                    company_id: formData.company_id,
                    start_date: formData.start_date,
                    end_date: formData.end_date || null,
                    notes: formData.notes || null,
                    status: 'agendada',
                    created_by: user?.id
                }]);

            if (error) {
                console.error('Erro ao criar vínculo:', error);
                toast.error('Erro ao criar vínculo: ' + error.message);
                return;
            }

            toast.success('Vínculo criado com sucesso!');
            setShowModal(false);
            setFormData({
                auditor_id: '',
                company_id: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                notes: ''
            });
            fetchAssignments();
        } catch (error: any) {
            toast.error('Erro ao criar vínculo');
        } finally {
            setSaving(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm('Deseja revogar este vínculo de auditoria?')) return;

        try {
            const { error } = await supabase
                .from('audit_assignments')
                .update({ status: 'cancelada' })
                .eq('id', id);

            if (error) {
                toast.error('Erro ao revogar vínculo');
                return;
            }

            toast.success('Vínculo revogado com sucesso');
            fetchAssignments();
        } catch (e) {
            toast.error('Erro ao revogar vínculo');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            agendada: 'bg-blue-100 text-blue-800',
            em_andamento: 'bg-yellow-100 text-yellow-800',
            concluida: 'bg-green-100 text-green-800',
            cancelada: 'bg-red-100 text-red-800'
        };
        const labels: Record<string, string> = {
            agendada: 'Agendada',
            em_andamento: 'Em Andamento',
            concluida: 'Concluída',
            cancelada: 'Cancelada'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredAssignments = assignments.filter(a =>
        a.auditor_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.company_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (!isSuperAdmin && !company?.id) {
        return (
            <div className="space-y-6">
                <PageHeader
                    icon={ClipboardCheck}
                    title="Auditores Externos"
                    subtitle="Gerencie vínculos de auditores externos com empresas clientes."
                    iconColor="amber"
                />
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-amber-800">Acesso restrito a Super Admins ou administradores de empresa.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                icon={ClipboardCheck}
                title="Auditores Externos"
                subtitle="Gerencie vínculos de auditores externos com empresas clientes."
                iconColor="amber"
            />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por auditor ou empresa..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Vínculo
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando vínculos...</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Auditor</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa Cliente</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAssignments.length > 0 ? (
                                        filteredAssignments.map((assignment) => (
                                            <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                                                            {assignment.auditor_name?.charAt(0).toUpperCase() || 'A'}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{assignment.auditor_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-700">{assignment.company_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                                                        {assignment.end_date && (
                                                            <span> - {new Date(assignment.end_date).toLocaleDateString('pt-BR')}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(assignment.status)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {(assignment.status === 'agendada' || assignment.status === 'em_andamento') && isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleRevoke(assignment.id)}
                                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Revogar vínculo"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                Nenhum vínculo de auditoria encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredAssignments.length > 0 ? (
                            filteredAssignments.map((assignment) => (
                                <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
                                                {assignment.auditor_name?.charAt(0).toUpperCase() || 'A'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{assignment.auditor_name}</p>
                                                <p className="text-sm text-gray-500">{assignment.company_name}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(assignment.status)}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Período:</span>
                                            <span className="text-gray-900">
                                                {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                                                {assignment.end_date && ` - ${new Date(assignment.end_date).toLocaleDateString('pt-BR')}`}
                                            </span>
                                        </div>
                                        {assignment.notes && (
                                            <div className="text-gray-600 bg-gray-50 p-2 rounded">{assignment.notes}</div>
                                        )}
                                    </div>
                                    {(assignment.status === 'agendada' || assignment.status === 'em_andamento') && isSuperAdmin && (
                                        <button
                                            onClick={() => handleRevoke(assignment.id)}
                                            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Revogar Vínculo
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                                Nenhum vínculo de auditoria encontrado.
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal: Novo Vínculo */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-amber-50">
                            <h3 className="font-bold text-gray-900">Novo Vínculo de Auditoria</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auditor</label>
                                <select
                                    required
                                    value={formData.auditor_id}
                                    onChange={e => setFormData({ ...formData, auditor_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="">Selecione o auditor...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Cliente</label>
                                <select
                                    required
                                    value={formData.company_id}
                                    onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="">Selecione a empresa...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim (opcional)</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    rows={2}
                                    placeholder="Ex: Auditoria ISO 9001:2015"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Salvando...' : 'Criar Vínculo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
