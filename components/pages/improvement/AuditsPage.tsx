import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, PlayCircle, Calendar, User, CheckCircle, Clock, AlertTriangle, Plus, ClipboardCheck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Audit } from '../../../types';
import { PlanGuard } from '../../auth/PlanGuard';

const AuditsPageContent: React.FC = () => {
    const { user, company } = useAuthContext();
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (company) {
            fetchAudits();
        }
    }, [company]);

    const fetchAudits = async () => {
        if (!company) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audits')
                .select('*')
                .eq('company_id', company.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setAudits(data || []);
        } catch (error) {
            console.error('Erro ao carregar auditorias:', error);
            alert('Erro ao carregar auditorias');
        } finally {
            setLoading(false);
        }
    };

    // Função de cores para Status
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Concluída':
                return 'bg-green-100 text-green-700 border border-green-200';
            case 'Em Andamento':
                return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
            case 'Agendada':
                return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'Atrasada':
                return 'bg-red-100 text-red-700 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Concluída':
                return <CheckCircle size={16} className="text-green-600" />;
            case 'Em Andamento':
                return <Clock size={16} className="text-yellow-600" />;
            case 'Agendada':
                return <Calendar size={16} className="text-blue-600" />;
            case 'Atrasada':
                return <AlertTriangle size={16} className="text-red-600" />;
            default:
                return null;
        }
    };

    // CRUD Operations
    const handleDelete = async (id: string) => {
        const audit = audits.find(a => a.id === id);
        if (!window.confirm(`Tem certeza que deseja excluir a auditoria "${audit?.scope}"?`)) return;

        try {
            const { error } = await supabase
                .from('audits')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setAudits(audits.filter(a => a.id !== id));
            alert('Auditoria excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir auditoria:', error);
            alert('Erro ao excluir auditoria');
        }
    };

    const handleEdit = (audit: Audit) => {
        setSelectedAudit(audit);
        setIsCreating(false);
        setIsModalOpen(true);
    };

    const handlePlay = (audit: Audit) => {
        if (audit.status === 'Agendada') {
            alert(`Iniciando auditoria: ${audit.scope}`);
        } else if (audit.status === 'Em Andamento') {
            alert(`Continuando auditoria: ${audit.scope}`);
        }
    };

    const handleCreate = () => {
        setSelectedAudit({
            id: '',
            company_id: company?.id || '',
            scope: '',
            type: 'Auditoria Interna',
            auditor: '',
            date: new Date().toISOString().split('T')[0],
            status: 'Agendada',
            progress: 0,
            notes: ''
        });
        setIsCreating(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAudit(null);
        setIsCreating(false);
    };

    const saveEdit = async () => {
        if (!selectedAudit || !company) {
            console.error('Missing data:', { selectedAudit, company });
            alert('Erro: Dados incompletos. Empresa: ' + (company ? 'OK' : 'FALTA'));
            return;
        }

        // Validação de campos obrigatórios
        if (!selectedAudit.scope || !selectedAudit.auditor || !selectedAudit.date) {
            alert('Por favor, preencha todos os campos obrigatórios (Escopo, Auditor e Data)');
            return;
        }

        try {
            console.log('Tentando salvar auditoria:', {
                isCreating,
                company_id: company.id,
                data: selectedAudit
            });

            if (isCreating) {
                // Insert new audit
                const { data, error } = await supabase
                    .from('audits')
                    .insert([{
                        company_id: company.id,
                        created_by: user?.id || null, // Add user id
                        scope: selectedAudit.scope,
                        type: selectedAudit.type,
                        auditor: selectedAudit.auditor,
                        date: selectedAudit.date,
                        status: selectedAudit.status,
                        progress: selectedAudit.progress,
                        notes: selectedAudit.notes || null
                    }])
                    .select(); // Add select to get inserted data

                if (error) {
                    console.error('Erro do Supabase (INSERT):', error);
                    throw error;
                }

                console.log('Auditoria criada com sucesso:', data);
                alert('Auditoria criada com sucesso!');
            } else {
                // Update existing audit
                const { data, error } = await supabase
                    .from('audits')
                    .update({
                        scope: selectedAudit.scope,
                        type: selectedAudit.type,
                        auditor: selectedAudit.auditor,
                        date: selectedAudit.date,
                        status: selectedAudit.status,
                        progress: selectedAudit.progress,
                        notes: selectedAudit.notes || null
                    })
                    .eq('id', selectedAudit.id)
                    .select(); // Add select to get updated data

                if (error) {
                    console.error('Erro do Supabase (UPDATE):', error);
                    throw error;
                }

                console.log('Auditoria atualizada com sucesso:', data);
                alert('Auditoria atualizada com sucesso!');
            }

            closeModal();
            fetchAudits();
        } catch (error: any) {
            console.error('ERRO COMPLETO:', error);

            let errorMessage = 'Erro ao salvar auditoria';

            if (error.message) {
                errorMessage += ': ' + error.message;
            }

            if (error.code) {
                errorMessage += ' (Código: ' + error.code + ')';
            }

            if (error.hint) {
                errorMessage += '\nDica: ' + error.hint;
            }

            if (error.details) {
                errorMessage += '\nDetalhes: ' + error.details;
            }

            // Mensagens específicas para erros comuns
            if (error.message?.includes('relation "audits" does not exist')) {
                errorMessage = 'ERRO: A tabela "audits" não existe no banco de dados.\n\nExecute a migration SQL primeiro!';
            } else if (error.message?.includes('row-level security')) {
                errorMessage = 'ERRO: Sem permissão para salvar (RLS).\n\nVerifique se o usuário tem company_id configurado.';
            } else if (error.code === '23505') {
                errorMessage = 'ERRO: Registro duplicado.';
            }

            console.error('Mensagem de erro para usuário:', errorMessage);
            alert(errorMessage);
        }
    };


    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                            <ClipboardCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#025159]">Gestão de Auditorias</h1>
                    </div>
                    <p className="text-gray-600 text-sm">Planeje, execute e gerencie auditorias internas e externas (ISO 9001: 9.2).</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-[#025159] text-white font-semibold rounded-lg hover:bg-[#025159]/90 transition-colors shadow-md hover:shadow-lg"
                >
                    <Plus size={20} />
                    Nova Auditoria
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Agendadas</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {audits.filter(a => a.status === 'Agendada').length}
                            </p>
                        </div>
                        <Calendar className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Em Andamento</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {audits.filter(a => a.status === 'Em Andamento').length}
                            </p>
                        </div>
                        <Clock className="text-yellow-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Concluídas</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {audits.filter(a => a.status === 'Concluída').length}
                            </p>
                        </div>
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-800">{audits.length}</p>
                        </div>
                        <ClipboardCheck className="text-gray-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Carregando auditorias...</p>
                        </div>
                    ) : audits.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma auditoria cadastrada</h3>
                            <p className="text-gray-500">Clique em "Nova Auditoria" para começar.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escopo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progresso</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {audits.map((audit) => (
                                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {audit.scope}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {audit.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                {audit.auditor}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(audit.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(audit.status)}`}>
                                                {getStatusIcon(audit.status)}
                                                {audit.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${audit.progress === 100
                                                            ? 'bg-green-500'
                                                            : audit.progress > 0
                                                                ? 'bg-yellow-500'
                                                                : 'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${audit.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600">{audit.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                {(audit.status === 'Agendada' || audit.status === 'Em Andamento') && (
                                                    <button
                                                        onClick={() => handlePlay(audit)}
                                                        className="p-2 text-[#BF7B54] hover:text-[#8C512E] hover:bg-orange-50 rounded-lg transition-colors"
                                                        title={audit.status === 'Agendada' ? 'Iniciar' : 'Continuar'}
                                                    >
                                                        <PlayCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(audit)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(audit.id)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Edição */}
            {isModalOpen && selectedAudit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-2xl font-bold text-[#8C512E] mb-6">
                            {isCreating ? 'Nova Auditoria' : 'Editar Auditoria'}
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Escopo</label>
                                <input
                                    type="text"
                                    value={selectedAudit.scope}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, scope: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                    placeholder="Ex: Vendas e Marketing"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={selectedAudit.type}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                >
                                    <option value="Auditoria Interna">Auditoria Interna</option>
                                    <option value="Auditoria de Processo">Auditoria de Processo</option>
                                    <option value="Auditoria Externa">Auditoria Externa</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auditor</label>
                                <input
                                    type="text"
                                    value={selectedAudit.auditor}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, auditor: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                    placeholder="Nome do auditor"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    value={selectedAudit.date}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={selectedAudit.status}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, status: e.target.value as Audit['status'] })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                >
                                    <option value="Agendada">Agendada</option>
                                    <option value="Em Andamento">Em Andamento</option>
                                    <option value="Concluída">Concluída</option>
                                    <option value="Atrasada">Atrasada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Progresso (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={selectedAudit.progress}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, progress: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea
                                    value={selectedAudit.notes || ''}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent resize-none"
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveEdit}
                                className="flex-1 px-4 py-2 bg-[#BF7B54] text-white rounded-lg hover:bg-[#8C512E] transition-colors font-semibold"
                            >
                                {isCreating ? 'Criar Auditoria' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AuditsPage: React.FC = () => {
    return (
        <PlanGuard
            requiredFeature="audits"
            featureName="Auditorias Internas"
            requiredPlan="pro"
            description="Gerencie auditorias internas, externas e de processo com rastreamento completo de status e progresso."
        >
            <AuditsPageContent />
        </PlanGuard>
    );
};
