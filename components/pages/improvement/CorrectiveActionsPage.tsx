import React, { useEffect, useState } from 'react';
import {
    Plus,
    AlertTriangle,
    Clock,
    CheckCircle,
    TrendingUp,
    Edit,
    X,
    ChevronRight,
    ChevronLeft,
    MoreVertical,
    Trash2,
    Copy,
    Eye,
    Filter,
    Download,
    XCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { CorrectiveAction, CorrectiveActionTask } from '../../../types';
import { Modal } from '../../common/Modal';
import { PageHeader } from '../../common/PageHeader';
import { EmptyState } from '../../common/EmptyState';

export const CorrectiveActionsPage: React.FC = () => {
    const { user, company } = useAuthContext();
    const [actions, setActions] = useState<CorrectiveAction[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Filter states
    const [filters, setFilters] = useState({
        status: '' as string,
        origin: '' as string,
        responsible_id: '' as string,
        overdue: false
    });

    // Form states
    const [form, setForm] = useState({
        code: '',
        origin: 'Auditoria',
        description: '',
        immediate_action: '',
        responsible_id: user?.id || '',
        deadline: '',
        root_cause: '',
        effectiveness_verified: false,
        effectiveness_notes: ''
    });

    const [tasks, setTasks] = useState<Partial<CorrectiveActionTask>[]>([]);
    const [newTask, setNewTask] = useState({
        description: '',
        responsible_id: '',
        due_date: ''
    });

    useEffect(() => {
        fetchActions();
        fetchProfiles();
    }, [company]);

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    const fetchActions = async () => {
        try {
            setLoading(true);
            if (!company) return;

            const { data, error } = await supabase
                .from('corrective_actions_with_details')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActions(data || []);
        } catch (error) {
            console.error('Erro ao carregar ações:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfiles = async () => {
        try {
            if (!company) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('company_id', company.id);

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
        }
    };

    const fetchNextCode = async () => {
        if (!company) return '';
        try {
            const { data, error } = await supabase
                .rpc('generate_next_rnc_code', { p_company_id: company.id });

            if (error) throw error;
            return data || '';
        } catch (error) {
            console.error('Erro ao gerar código:', error);
            return '';
        }
    };

    // Função para aplicar filtros
    const getFilteredActions = () => {
        let filtered = [...actions];

        if (filters.status) {
            filtered = filtered.filter(action => action.status === filters.status);
        }

        if (filters.origin) {
            filtered = filtered.filter(action => action.origin === filters.origin);
        }

        if (filters.responsible_id) {
            filtered = filtered.filter(action => action.responsible_id === filters.responsible_id);
        }

        if (filters.overdue) {
            filtered = filtered.filter(action =>
                action.status !== 'closed' && isOverdue(action.deadline)
            );
        }

        return filtered;
    };

    // Função para exportar para CSV
    const handleExport = () => {
        const filteredData = getFilteredActions();

        const csvHeader = 'Código,Origem,Descrição,Responsável,Prazo,Status\n';
        const csvRows = filteredData.map(action => {
            const status = action.status === 'open' ? 'Aberta' :
                action.status === 'root_cause_analysis' ? 'Análise de Causa' :
                    action.status === 'implementation' ? 'Implementação' :
                        action.status === 'effectiveness_check' ? 'Verificação' : 'Concluída';

            return `"${action.code}","${action.origin}","${action.description}","${action.responsible_name}","${new Date(action.deadline).toLocaleDateString('pt-BR')}","${status}"`;
        }).join('\n');

        const csvContent = csvHeader + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `acoes_corretivas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            origin: '',
            responsible_id: '',
            overdue: false
        });
    };

    const hasActiveFilters = () => {
        return filters.status || filters.origin || filters.responsible_id || filters.overdue;
    };


    const handleOpenModal = async (action?: CorrectiveAction) => {
        if (action) {
            setSelectedAction(action);
            setForm({
                code: action.code,
                origin: action.origin,
                description: action.description,
                immediate_action: action.immediate_action || '',
                responsible_id: action.responsible_id,
                deadline: action.deadline,
                root_cause: action.root_cause || '',
                effectiveness_verified: action.effectiveness_verified || false,
                effectiveness_notes: action.effectiveness_notes || ''
            });
            setTasks(action.tasks || []);
        } else {
            setSelectedAction(null);
            resetForm();
            // Buscar próximo código automaticamente
            const nextCode = await fetchNextCode();
            setForm(prev => ({ ...prev, code: nextCode }));
        }
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleSaveStep = async () => {
        if (!company) return;

        try {
            const payload: any = {
                company_id: company.id,
                ...form
            };

            if (currentStep === 1) {
                payload.status = 'open';
            } else if (currentStep === 2) {
                payload.status = 'root_cause_analysis';
            } else if (currentStep === 3) {
                payload.status = 'implementation';
            } else if (currentStep === 4) {
                payload.status = form.effectiveness_verified ? 'closed' : 'effectiveness_check';
            }

            if (selectedAction) {
                const { error } = await supabase
                    .from('corrective_actions')
                    .update(payload)
                    .eq('id', selectedAction.id);

                if (error) throw error;

                // Update tasks
                if (currentStep === 3) {
                    await saveTasks(selectedAction.id);
                }
            } else {
                const { data, error } = await supabase
                    .from('corrective_actions')
                    .insert([payload])
                    .select();

                if (error) throw error;
                if (currentStep === 3 && data && data[0]) {
                    await saveTasks(data[0].id);
                }
            }

            if (currentStep === 4) {
                fetchActions();
                setIsModalOpen(false);
            } else {
                setCurrentStep(currentStep + 1);
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar: ' + (error.message || error.error_description || JSON.stringify(error)));
        }
    };

    const saveTasks = async (actionId: string) => {
        try {
            // Delete existing tasks
            await supabase
                .from('corrective_action_tasks')
                .delete()
                .eq('corrective_action_id', actionId);

            // Insert new tasks
            if (tasks.length > 0) {
                const tasksToInsert = tasks.map(t => ({
                    corrective_action_id: actionId,
                    description: t.description!,
                    responsible_id: t.responsible_id!,
                    due_date: t.due_date!,
                    completed: t.completed || false
                }));

                const { error } = await supabase
                    .from('corrective_action_tasks')
                    .insert(tasksToInsert);

                if (error) throw error;
            }
        } catch (error) {
            console.error('Erro ao salvar tarefas:', error);
        }
    };

    const handleAddTask = () => {
        if (!newTask.description || !newTask.responsible_id || !newTask.due_date) {
            alert('Preencha todos os campos da tarefa');
            return;
        }

        setTasks([...tasks, { ...newTask, completed: false }]);
        setNewTask({ description: '', responsible_id: '', due_date: '' });
    };

    const handleToggleTask = (index: number) => {
        const updated = [...tasks];
        updated[index].completed = !updated[index].completed;
        setTasks(updated);
    };

    const handleRemoveTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setForm({
            code: '',
            origin: 'Auditoria',
            description: '',
            immediate_action: '',
            responsible_id: user?.id || '',
            deadline: '',
            root_cause: '',
            effectiveness_verified: false,
            effectiveness_notes: ''
        });
        setTasks([]);
    };

    const handleDeleteAction = async (actionId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta ação corretiva?')) return;

        try {
            const { error } = await supabase
                .from('corrective_actions')
                .delete()
                .eq('id', actionId);

            if (error) throw error;

            fetchActions();
            alert('✅ Ação corretiva excluída com sucesso!');
        } catch (error: any) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir: ' + (error.message || JSON.stringify(error)));
        }
    };

    const handleDuplicateAction = async (action: CorrectiveAction) => {
        try {
            const nextCode = await fetchNextCode();

            const payload = {
                company_id: company?.id,
                code: nextCode,
                origin: action.origin,
                description: `[CÓPIA] ${action.description}`,
                immediate_action: action.immediate_action,
                responsible_id: action.responsible_id,
                deadline: action.deadline,
                root_cause: action.root_cause,
                status: 'open'
            };

            const { data, error } = await supabase
                .from('corrective_actions')
                .insert([payload])
                .select();

            if (error) throw error;

            fetchActions();
            alert('✅ Ação corretiva duplicada com sucesso!');
        } catch (error: any) {
            console.error('Erro ao duplicar:', error);
            alert('Erro ao duplicar: ' + (error.message || JSON.stringify(error)));
        }
    };

    const getStatusBadge = (status: CorrectiveAction['status']) => {
        switch (status) {
            case 'open':
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Aberta</span>;
            case 'root_cause_analysis':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">📝 Análise Causa</span>;
            case 'implementation':
                return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">🔨 Implementação</span>;
            case 'effectiveness_check':
                return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">⏳ Verificar Eficácia</span>;
            case 'closed':
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">✅ Concluída</span>;
        }
    };

    const getOriginBadge = (origin: string) => {
        const colors: Record<string, string> = {
            'Auditoria': 'bg-purple-100 text-purple-700',
            'Reclamação Cliente': 'bg-red-100 text-red-700',
            'Indicador': 'bg-yellow-100 text-yellow-700'
        };
        return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[origin] || 'bg-gray-100 text-gray-700'}`}>{origin}</span>;
    };

    const isOverdue = (deadline: string) => {
        return new Date(deadline) < new Date() && deadline !== '';
    };

    // KPIs
    const openActions = actions.filter(a => a.status !== 'closed');
    const overdueActions = openActions.filter(a => isOverdue(a.deadline));
    const awaitingEffectiveness = actions.filter(a => a.status === 'effectiveness_check');

    const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <PageHeader
                icon={TrendingUp}
                title="Ações Corretivas e Melhoria"
                subtitle="ISO 9001: 10.1 - Não Conformidade e Ação Corretiva"
                iconColor="orange"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium relative"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="sm:inline">Filtrar</span>
                            {hasActiveFilters() && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                                    {[filters.status, filters.origin, filters.responsible_id, filters.overdue].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleExport}
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Abrir RNC</span>
                        </button>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Abertas</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{openActions.length}</p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-blue-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-700 text-sm font-medium">Atrasadas</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{overdueActions.length}</p>
                        </div>
                        <Clock className="w-12 h-12 text-red-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-700 text-sm font-medium">Aguardando Eficácia</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{awaitingEffectiveness.length}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-yellow-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Table (Desktop) / Cards (Mobile) */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando ações...</p>
                </div>
            ) : actions.length === 0 ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="Nenhuma ação corretiva registrada"
                    description="Comece abrindo uma RNC para registrar problemas e melhorias"
                />
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prazo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {getFilteredActions().map(action => {
                                        const overdue = action.status !== 'closed' && isOverdue(action.deadline);
                                        return (
                                            <tr key={action.id} className={overdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-semibold text-gray-900">{action.code}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getOriginBadge(action.origin)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-900 line-clamp-2" title={action.description}>
                                                        {action.description}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700">{action.responsible_name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                                                        {new Date(action.deadline).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(action.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setMenuPosition({
                                                                top: rect.bottom + window.scrollY,
                                                                left: rect.left + window.scrollX - 180 // Adjust for menu width
                                                            });
                                                            setOpenMenuId(openMenuId === action.id ? null : action.id);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Fixed Position Menu Portal */}
                    {openMenuId && menuPosition && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenuId(null)}
                            />
                            <div
                                className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-48 animate-in fade-in zoom-in-95 duration-100"
                                style={{
                                    top: `${menuPosition.top}px`,
                                    left: `${menuPosition.left}px`
                                }}
                            >
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            const action = actions.find(a => a.id === openMenuId);
                                            if (action) handleOpenModal(action);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Edit className="w-4 h-4 text-gray-500" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => {
                                            const action = actions.find(a => a.id === openMenuId);
                                            if (action) {
                                                handleOpenModal(action);
                                                setCurrentStep(4);
                                            }
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Eye className="w-4 h-4 text-gray-500" />
                                        Visualizar Detalhes
                                    </button>
                                    <button
                                        onClick={() => {
                                            const action = actions.find(a => a.id === openMenuId);
                                            if (action) handleDuplicateAction(action);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Copy className="w-4 h-4 text-gray-500" />
                                        Duplicar
                                    </button>
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                        onClick={() => {
                                            handleDeleteAction(openMenuId);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </>
                    )}


                    {/* Mobile Card View */}
                    < div className="md:hidden space-y-3" >
                        {
                            getFilteredActions().map(action => {
                                const overdue = action.status !== 'closed' && isOverdue(action.deadline);
                                return (
                                    <div
                                        key={action.id}
                                        className={`bg-white rounded-xl shadow-sm border ${overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'} p-4`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900">{action.code}</span>
                                                    {getOriginBadge(action.origin)}
                                                </div>
                                                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{action.description}</p>
                                            </div>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === action.id ? null : action.id)}
                                                className="text-gray-400 hover:text-gray-600 p-1 ml-2"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Status:</span>
                                                {getStatusBadge(action.status)}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Responsável:</span>
                                                <span className="text-gray-900 font-medium">{action.responsible_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Prazo:</span>
                                                <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {new Date(action.deadline).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Menu */}
                                        {openMenuId === action.id && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => {
                                                        handleOpenModal(action);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleOpenModal(action);
                                                        setCurrentStep(4);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Ver
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDuplicateAction(action);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    Duplicar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDeleteAction(action.id);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        }
                    </div >
                </>
            )}

            {/* Modal Wizard */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${selectedAction ? 'Editar' : 'Nova'} RNC - Etapa ${currentStep} de 4`}
                subtitle={['O Problema', 'Causa Raiz', 'Plano de Ação', 'Verificação de Eficácia'][currentStep - 1]}
                size="xl"
            >
                <div className="p-6">
                    {/* Step 1: Problema */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Código *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.code}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                                        placeholder="RNC-2024-001"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Código gerado automaticamente</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Origem *</label>
                                    <select
                                        value={form.origin}
                                        onChange={e => setForm({ ...form, origin: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                                    >
                                        <option value="Auditoria">Auditoria</option>
                                        <option value="Reclamação Cliente">Reclamação Cliente</option>
                                        <option value="Indicador">Indicador</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Problema *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Descreva detalhadamente o problema identificado..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ação Imediata (Estancar)</label>
                                <textarea
                                    rows={3}
                                    value={form.immediate_action}
                                    onChange={e => setForm({ ...form, immediate_action: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="O que foi feito imediatamente para conter o problema?"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsável *</label>
                                    <select
                                        value={form.responsible_id}
                                        onChange={e => setForm({ ...form, responsible_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                                    >
                                        {profiles.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Prazo *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.deadline}
                                        onChange={e => setForm({ ...form, deadline: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Causa Raiz */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Análise de Causa Raiz (5 Porquês / Ishikawa)</label>
                                <textarea
                                    rows={10}
                                    value={form.root_cause}
                                    onChange={e => setForm({ ...form, root_cause: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none font-mono text-sm"
                                    placeholder={`Método 5 Porquês:
1. Por que ocorreu? [resposta]
2. Por que [resposta anterior]? [resposta]
3. Por que [resposta anterior]? [resposta]
4. Por que [resposta anterior]? [resposta]
5. Por que [resposta anterior]? [CAUSA RAIZ]

Ou use Diagrama de Ishikawa (6M):
- Método:
- Máquina:
- Mão-de-obra:
- Matéria-prima:
- Medida:
- Meio ambiente:`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Plano de Ação */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Tarefas do Plano de Ação</h4>
                                <div className="space-y-2 mb-4">
                                    {tasks.map((task, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleTask(index)}
                                                className="w-5 h-5"
                                            />
                                            <div className="flex-1">
                                                <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                    {task.description}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {profiles.find(p => p.id === task.responsible_id)?.full_name} - {task.due_date && new Date(task.due_date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTask(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">+ Adicionar Tarefa</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            value={newTask.description}
                                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                            placeholder="O que fazer"
                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
                                        />
                                        <select
                                            value={newTask.responsible_id}
                                            onChange={e => setNewTask({ ...newTask, responsible_id: e.target.value })}
                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 bg-white"
                                        >
                                            <option value="">Quem</option>
                                            {profiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={newTask.due_date}
                                                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500"
                                            />
                                            <button
                                                onClick={handleAddTask}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Eficácia */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            {!allTasksCompleted && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 text-sm">
                                        ⚠️ <strong>Atenção:</strong> Todas as tarefas devem estar concluídas antes de verificar a eficácia.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">O problema voltou a ocorrer após as ações implementadas?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!form.effectiveness_verified}
                                            onChange={() => setForm({ ...form, effectiveness_verified: false })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Sim (Problema persiste)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={form.effectiveness_verified}
                                            onChange={() => setForm({ ...form, effectiveness_verified: true })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Não (Ação eficaz)</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Parecer do Gestor</label>
                                <textarea
                                    rows={5}
                                    value={form.effectiveness_notes}
                                    onChange={e => setForm({ ...form, effectiveness_notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Descreva os resultados observados, evidências de eficácia, recomendações..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-6 pt-4 border-t flex justify-between">
                        <button
                            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </button>

                        <button
                            onClick={handleSaveStep}
                            disabled={currentStep === 4 && !allTasksCompleted}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {currentStep === 4 ? 'Encerrar RNC' : 'Próximo'}
                            {currentStep !== 4 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Filtros */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Filtros Avançados"
                subtitle="Refine a busca de ações corretivas"
            >
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="">Todos</option>
                            <option value="open">Aberta</option>
                            <option value="root_cause_analysis">Análise de Causa</option>
                            <option value="implementation">Em Implementação</option>
                            <option value="effectiveness_check">Verificar Eficácia</option>
                            <option value="closed">Concluída</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
                        <select
                            value={filters.origin}
                            onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="">Todas</option>
                            <option value="Auditoria">Auditoria</option>
                            <option value="Reclamação Cliente">Reclamação Cliente</option>
                            <option value="Indicador">Indicador</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Responsável</label>
                        <select
                            value={filters.responsible_id}
                            onChange={(e) => setFilters({ ...filters, responsible_id: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="">Todos</option>
                            {profiles.map(profile => (
                                <option key={profile.id} value={profile.id}>{profile.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="overdue"
                            checked={filters.overdue}
                            onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="overdue" className="ml-2 text-sm font-medium text-gray-700">
                            Mostrar apenas atrasadas
                        </label>
                    </div>

                    <div className="pt-4 border-t flex justify-between">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            Limpar Filtros
                        </button>
                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};
