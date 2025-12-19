import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Search,
    Filter,
    Plus,
    Edit2,
    Trash2,
    X,
    User,
    Calendar,
    Target,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { RiskTask } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const ActionPlansPage: React.FC = () => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<RiskTask[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [responsibleFilter, setResponsibleFilter] = useState('all');
    const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'overdue' | 'week' | 'month'>('all');

    // Modal states
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<RiskTask | null>(null);
    const [taskForm, setTaskForm] = useState({
        risk_id: '',
        description: '',
        responsible_id: '',
        deadline: ''
    });

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

            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user?.id)
                .single();

            if (!profile?.company_id) return;
            setCompanyId(profile.company_id);

            // Fetch all data
            const [tasksRes, risksRes, usersRes] = await Promise.all([
                supabase
                    .from('risk_tasks_with_responsible')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('risks_opportunities')
                    .select('id, description, type')
                    .eq('company_id', profile.company_id)
                    .eq('status', 'active'),
                supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('company_id', profile.company_id)
            ]);

            setTasks(tasksRes.data || []);
            setRisks(risksRes.data || []);
            setUsers(usersRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!taskForm.description.trim() || !taskForm.risk_id) {
            toast.warning('Preencha a descrição e selecione um risco');
            return;
        }

        try {
            const { error } = await supabase
                .from('risk_tasks')
                .insert([{
                    risk_id: taskForm.risk_id,
                    description: taskForm.description,
                    responsible_id: taskForm.responsible_id || null,
                    deadline: taskForm.deadline || null,
                    status: 'pending'
                }]);

            if (error) throw error;

            setIsTaskModalOpen(false);
            setTaskForm({ risk_id: '', description: '', responsible_id: '', deadline: '' });
            await loadData();
            toast.success('Tarefa criada com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao criar tarefa: ' + error.message);
        }
    };

    const handleUpdateTask = async () => {
        if (!selectedTask || !taskForm.description.trim()) {
            toast.warning('Preencha a descrição da tarefa');
            return;
        }

        try {
            const { error } = await supabase
                .from('risk_tasks')
                .update({
                    description: taskForm.description,
                    responsible_id: taskForm.responsible_id || null,
                    deadline: taskForm.deadline || null
                })
                .eq('id', selectedTask.id);

            if (error) throw error;

            setIsTaskModalOpen(false);
            setSelectedTask(null);
            setTaskForm({ risk_id: '', description: '', responsible_id: '', deadline: '' });
            await loadData();
            toast.success('Tarefa atualizada com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao atualizar tarefa: ' + error.message);
        }
    };

    const handleToggleStatus = async (task: RiskTask) => {
        try {
            const newStatus = task.status === 'pending' ? 'completed' : 'pending';
            const { error } = await supabase
                .from('risk_tasks')
                .update({ status: newStatus })
                .eq('id', task.id);

            if (error) throw error;
            await loadData();
        } catch (error: any) {
            toast.error('Erro ao atualizar tarefa: ' + error.message);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        setDeleteModal({ isOpen: true, id: taskId });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;

        try {
            const { error } = await supabase
                .from('risk_tasks')
                .delete()
                .eq('id', deleteModal.id);

            if (error) throw error;
            await loadData();
            toast.success('Tarefa excluída com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao excluir tarefa: ' + error.message);
        }
    };

    const openTaskModal = (task?: RiskTask) => {
        if (task) {
            setSelectedTask(task);
            setTaskForm({
                risk_id: task.risk_id,
                description: task.description,
                responsible_id: task.responsible_id || '',
                deadline: task.deadline || ''
            });
        } else {
            setSelectedTask(null);
            setTaskForm({ risk_id: '', description: '', responsible_id: '', deadline: '' });
        }
        setIsTaskModalOpen(true);
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        // Search
        const matchesSearch = task.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

        // Responsible filter
        const matchesResponsible = responsibleFilter === 'all' || task.responsible_id === responsibleFilter;

        // Deadline filter
        let matchesDeadline = true;
        if (deadlineFilter !== 'all' && task.deadline) {
            const deadline = new Date(task.deadline);
            const today = new Date();
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

            if (deadlineFilter === 'overdue') matchesDeadline = deadline < today;
            else if (deadlineFilter === 'week') matchesDeadline = deadline <= weekFromNow && deadline >= today;
            else if (deadlineFilter === 'month') matchesDeadline = deadline <= monthFromNow && deadline >= today;
        }

        return matchesSearch && matchesStatus && matchesResponsible && matchesDeadline;
    });

    // Calculate metrics
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t =>
        t.status === 'pending' && t.deadline && new Date(t.deadline) < new Date()
    ).length;

    const getRiskInfo = (riskId: string) => {
        return risks.find(r => r.id === riskId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#025159]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Excluir Tarefa"
                message="Deseja realmente excluir esta tarefa?"
                confirmLabel="Excluir"
                variant="danger"
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                            <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-[#025159]">Planos de Ação</h1>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm">
                        Gerenciamento centralizado de tarefas de riscos e oportunidades
                    </p>
                </div>
                <button
                    onClick={() => openTaskModal()}
                    className="flex items-center justify-center gap-2 bg-[#025159] text-white px-4 py-2.5 rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium w-full md:w-auto"
                >
                    <Plus size={20} />
                    <span>Nova Tarefa</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                        <h3 className="text-xs md:text-sm font-medium text-gray-500">Total</h3>
                        <Target className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{totalTasks}</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                        <h3 className="text-xs md:text-sm font-medium text-gray-500">Pendentes</h3>
                        <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-amber-600">{pendingTasks}</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                        <h3 className="text-xs md:text-sm font-medium text-gray-500">Concluídas</h3>
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">{completedTasks}</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                        <h3 className="text-xs md:text-sm font-medium text-gray-500">Atrasadas</h3>
                        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-red-600">{overdueTasks}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 mb-4 md:mb-6 flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar tarefas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] text-sm"
                    />
                </div>
                <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                    <Filter size={20} />
                    <span className="hidden sm:inline">Filtros</span>
                    {(statusFilter !== 'all' || responsibleFilter !== 'all' || deadlineFilter !== 'all') && (
                        <span className="ml-1 px-2 py-0.5 bg-[#025159] text-white text-xs rounded-full">
                            {[
                                statusFilter !== 'all' ? 1 : 0,
                                responsibleFilter !== 'all' ? 1 : 0,
                                deadlineFilter !== 'all' ? 1 : 0
                            ].reduce((a, b) => a + b)}
                        </span>
                    )}
                </button>
            </div>

            {/* Tasks List - Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="px-6 py-4 w-12"></th>
                                <th className="px-6 py-4">Tarefa</th>
                                <th className="px-6 py-4">Risco/Oportunidade</th>
                                <th className="px-6 py-4">Responsável</th>
                                <th className="px-6 py-4">Prazo</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTasks.map((task) => {
                                const riskInfo = getRiskInfo(task.risk_id);
                                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status === 'pending';

                                return (
                                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(task)}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'completed'
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-300 hover:border-green-500'
                                                    }`}
                                            >
                                                {task.status === 'completed' && (
                                                    <CheckCircle2 size={14} className="text-white" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm font-medium ${task.status === 'completed'
                                                ? 'line-through text-gray-400'
                                                : 'text-gray-900'
                                                }`}>
                                                {task.description}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {riskInfo && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${riskInfo.type === 'risk' ? 'bg-red-500' : 'bg-blue-500'
                                                        }`}></span>
                                                    <span className="text-sm text-gray-600 line-clamp-1">
                                                        {riskInfo.description}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.responsible_name ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <User size={14} className="text-gray-400" />
                                                    {task.responsible_name}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.deadline ? (
                                                <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                                                    }`}>
                                                    <Calendar size={14} />
                                                    {new Date(task.deadline).toLocaleDateString('pt-BR')}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : isOverdue
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {task.status === 'completed' ? 'Concluída' : isOverdue ? 'Atrasada' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openTaskModal(task)}
                                                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredTasks.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>Nenhuma tarefa encontrada.</p>
                    </div>
                )}
            </div>

            {/* Tasks List - Mobile Cards */}
            <div className="md:hidden space-y-3">
                {filteredTasks.map((task) => {
                    const riskInfo = getRiskInfo(task.risk_id);
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status === 'pending';

                    return (
                        <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => handleToggleStatus(task)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${task.status === 'completed'
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 hover:border-green-500'
                                        }`}
                                >
                                    {task.status === 'completed' && (
                                        <CheckCircle2 size={14} className="text-white" />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium mb-2 ${task.status === 'completed'
                                        ? 'line-through text-gray-400'
                                        : 'text-gray-900'
                                        }`}>
                                        {task.description}
                                    </p>

                                    {riskInfo && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${riskInfo.type === 'risk' ? 'bg-red-500' : 'bg-blue-500'
                                                }`}></span>
                                            <span className="text-xs text-gray-500 line-clamp-1">
                                                {riskInfo.description}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        {task.responsible_name && (
                                            <div className="flex items-center gap-1">
                                                <User size={12} className="text-gray-400" />
                                                <span>{task.responsible_name}</span>
                                            </div>
                                        )}
                                        {task.deadline && (
                                            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                                <Calendar size={12} />
                                                <span>{new Date(task.deadline).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : isOverdue
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {task.status === 'completed' ? 'Concluída' : isOverdue ? 'Atrasada' : 'Pendente'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openTaskModal(task)}
                                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredTasks.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                        <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm">Nenhuma tarefa encontrada.</p>
                    </div>
                )}
            </div>

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsTaskModalOpen(false);
                                    setSelectedTask(null);
                                    setTaskForm({ risk_id: '', description: '', responsible_id: '', deadline: '' });
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {!selectedTask && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Risco/Oportunidade *
                                    </label>
                                    <select
                                        value={taskForm.risk_id}
                                        onChange={e => setTaskForm({ ...taskForm, risk_id: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] bg-white"
                                    >
                                        <option value="">Selecione...</option>
                                        {risks.map((risk) => (
                                            <option key={risk.id} value={risk.id}>
                                                [{risk.type === 'risk' ? 'Risco' : 'Oportunidade'}] {risk.description.substring(0, 60)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição *
                                </label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] resize-none"
                                    rows={3}
                                    placeholder="O que precisa ser feito..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Responsável
                                </label>
                                <select
                                    value={taskForm.responsible_id}
                                    onChange={e => setTaskForm({ ...taskForm, responsible_id: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] bg-white"
                                >
                                    <option value="">Selecione...</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.full_name || 'Sem nome'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prazo
                                </label>
                                <input
                                    type="date"
                                    value={taskForm.deadline}
                                    onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsTaskModalOpen(false);
                                        setSelectedTask(null);
                                        setTaskForm({ risk_id: '', description: '', responsible_id: '', deadline: '' });
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={selectedTask ? handleUpdateTask : handleCreateTask}
                                    className="flex-1 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors"
                                >
                                    {selectedTask ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Filtros</h3>
                            <button
                                onClick={() => setIsFilterModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'all', label: 'Todas' },
                                        { value: 'pending', label: 'Pendentes' },
                                        { value: 'completed', label: 'Concluídas' }
                                    ].map(option => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={statusFilter === option.value}
                                                onChange={() => setStatusFilter(option.value as any)}
                                                className="text-[#025159]"
                                            />
                                            <span className="text-sm">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Responsável</label>
                                <select
                                    value={responsibleFilter}
                                    onChange={e => setResponsibleFilter(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] bg-white"
                                >
                                    <option value="all">Todos</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.full_name || 'Sem nome'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Prazo</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'all', label: 'Todas' },
                                        { value: 'overdue', label: 'Atrasadas' },
                                        { value: 'week', label: 'Esta semana' },
                                        { value: 'month', label: 'Este mês' }
                                    ].map(option => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={deadlineFilter === option.value}
                                                onChange={() => setDeadlineFilter(option.value as any)}
                                                className="text-[#025159]"
                                            />
                                            <span className="text-sm">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setResponsibleFilter('all');
                                        setDeadlineFilter('all');
                                        setIsFilterModalOpen(false);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Limpar Filtros
                                </button>
                                <button
                                    onClick={() => setIsFilterModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
