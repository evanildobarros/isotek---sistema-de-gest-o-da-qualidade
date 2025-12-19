import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Save, Loader2, TrendingUp, Calendar, CheckCircle2, AlertCircle, Rocket, Users2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { ConfirmModal } from '../../common/ConfirmModal';

interface Process {
    id: string;
    name: string;
}

interface QualityObjective {
    id: string;
    name: string;
    process_id: string | null;
    process?: Process;
    deadline: string;
    metric_name: string;
    target_value: number;
    current_value: number;
    action_plan: string;
}

export const QualityObjectivesPage: React.FC = () => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [objectives, setObjectives] = useState<QualityObjective[]>([]);
    const [processes, setProcesses] = useState<Process[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingObjective, setEditingObjective] = useState<QualityObjective | null>(null);

    // Forms
    const [formData, setFormData] = useState({
        name: '',
        process_id: '',
        deadline: '',
        metric_name: '',
        target_value: '',
        current_value: '0',
        action_plan: ''
    });

    const [updateValue, setUpdateValue] = useState('');

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);

            const { data: company } = await supabase
                .from('company_info')
                .select('id')
                .eq('owner_id', user?.id)
                .single();

            if (company) {
                setCompanyId(company.id);

                const { data: processesData } = await supabase
                    .from('processes')
                    .select('id, name')
                    .eq('company_id', company.id);
                setProcesses(processesData || []);

                const { data: objectivesData, error } = await supabase
                    .from('quality_objectives')
                    .select(`
                        *,
                        process:processes(name)
                    `)
                    .eq('company_id', company.id)
                    .order('deadline', { ascending: true });

                if (error) throw error;
                setObjectives(objectivesData || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;
        setSaving(true);

        try {
            const payload = {
                company_id: companyId,
                name: formData.name,
                process_id: formData.process_id || null,
                deadline: formData.deadline,
                metric_name: formData.metric_name,
                target_value: parseFloat(formData.target_value),
                current_value: parseFloat(formData.current_value),
                action_plan: formData.action_plan
            };

            if (editingObjective) {
                const { error } = await supabase
                    .from('quality_objectives')
                    .update(payload)
                    .eq('id', editingObjective.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('quality_objectives')
                    .insert([payload]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMeasurement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingObjective) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('quality_objectives')
                .update({ current_value: parseFloat(updateValue) })
                .eq('id', editingObjective.id);

            if (error) throw error;
            setIsUpdateModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error('Erro ao atualizar medição: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            const { error } = await supabase
                .from('quality_objectives')
                .delete()
                .eq('id', deleteModal.id);
            if (error) throw error;
            setObjectives(objectives.filter(o => o.id !== deleteModal.id));
            toast.success('Objetivo excluído com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message);
        }
    };

    const openModal = (objective?: QualityObjective) => {
        if (objective) {
            setEditingObjective(objective);
            setFormData({
                name: objective.name,
                process_id: objective.process_id || '',
                deadline: objective.deadline,
                metric_name: objective.metric_name,
                target_value: objective.target_value.toString(),
                current_value: objective.current_value.toString(),
                action_plan: objective.action_plan || ''
            });
        } else {
            setEditingObjective(null);
            setFormData({
                name: '',
                process_id: '',
                deadline: '',
                metric_name: '',
                target_value: '',
                current_value: '0',
                action_plan: ''
            });
        }
        setIsModalOpen(true);
    };

    const openUpdateModal = (objective: QualityObjective) => {
        setEditingObjective(objective);
        setUpdateValue(objective.current_value.toString());
        setIsUpdateModalOpen(true);
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
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Excluir Objetivo"
                message="Tem certeza que deseja excluir este objetivo da qualidade?"
                confirmLabel="Excluir"
                variant="danger"
            />

            <header className="mb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#025159] dark:text-[#03A6A6]">Objetivos da Qualidade</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Planejamento para alcançar resultados (ISO 9001: 6.2)
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-[#025159] text-white px-4 py-2 rounded-lg hover:bg-[#3F858C] transition-colors shadow-md"
                >
                    <Plus size={20} />
                    Novo Objetivo
                </button>
            </header>

            <div className="space-y-4">
                {objectives.map(obj => {
                    const progress = Math.min((obj.current_value / obj.target_value) * 100, 100);
                    const isExpanded = expandedId === obj.id;

                    return (
                        <div key={obj.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    {/* Colored Icon */}
                                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                                        <Rocket className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                                            {obj.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            {obj.process && (
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md">
                                                    Processo: {obj.process.name}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                Prazo: {new Date(obj.deadline).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => openUpdateModal(obj)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#025159] text-white rounded-lg text-sm font-medium hover:bg-[#3F858C] transition-colors"
                                        >
                                            <Edit2 size={14} />
                                            Atualizar Medição
                                        </button>
                                        <button
                                            onClick={() => handleDelete(obj.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Meta: {obj.target_value} | Atual: {obj.current_value}
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {Math.round(progress)}% Concluído
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500 rounded-full"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Action Plan Toggle */}
                                {obj.action_plan && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            <TrendingUp size={16} />
                                            Plano de Ação
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-2 pl-6 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-700">
                                                <ul className="space-y-1.5">
                                                    {obj.action_plan.split('\n').filter(line => line.trim()).map((line, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <input type="checkbox" className="mt-0.5 rounded" />
                                                            <span>{line.trim()}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {objectives.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Nenhum objetivo definido ainda.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-4 text-[#025159] hover:underline font-medium"
                        >
                            Criar primeiro objetivo
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingObjective ? 'Editar Objetivo' : 'Novo Objetivo'}
                        </h3>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Objetivo *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    placeholder="Ex: Aumentar Satisfação do Cliente"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Processo</label>
                                    <select
                                        value={formData.process_id}
                                        onChange={e => setFormData({ ...formData, process_id: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    >
                                        <option value="">Selecione...</option>
                                        {processes.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.deadline}
                                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Métrica *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.metric_name}
                                        onChange={e => setFormData({ ...formData, metric_name: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                        placeholder="Ex: %"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta *</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={formData.target_value}
                                        onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                        placeholder="90"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atual</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.current_value}
                                        onChange={e => setFormData({ ...formData, current_value: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano de Ação / Recursos</label>
                                <textarea
                                    value={formData.action_plan}
                                    onChange={e => setFormData({ ...formData, action_plan: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] h-24 resize-none"
                                    placeholder="Descreva como o objetivo será alcançado..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
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

            {/* Update Measurement Modal */}
            {isUpdateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Atualizar Medição
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {editingObjective?.name}
                        </p>

                        <form onSubmit={handleUpdateMeasurement}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Valor Atual ({editingObjective?.metric_name})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={updateValue}
                                    onChange={e => setUpdateValue(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUpdateModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors disabled:opacity-70"
                                >
                                    {saving ? 'Salvando...' : 'Atualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
