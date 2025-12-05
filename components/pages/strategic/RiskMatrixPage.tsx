import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    ShieldAlert,
    Edit2,
    Trash2,
    Search,
    Filter,
    Link as LinkIcon,
    Download,
    X,
    Loader2,
    Plus,
    Check,
    Calendar,
    User
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { RiskTask } from '../../../types';

type RiskType = 'risk' | 'opportunity';

interface RiskItem {
    id: string;
    type: RiskType;
    origin: string;
    description: string;
    probability: number;
    impact: number;
    action_plan: string;
    company_id: string;
}

interface SwotItem {
    id: string;
    type: 'forca' | 'fraqueza' | 'oportunidade' | 'ameaca';
    description: string;
}

export const RiskMatrixPage: React.FC = () => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [risks, setRisks] = useState<RiskItem[]>([]);
    const [swotItems, setSwotItems] = useState<SwotItem[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedSwotItems, setSelectedSwotItems] = useState<string[]>([]);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
    const [editForm, setEditForm] = useState({
        probability: 1,
        impact: 1,
        action_plan: ''
    });

    // Filter state
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        type: 'all' as 'all' | 'risk' | 'opportunity',
        severity: 'all' as 'all' | 'low' | 'medium' | 'high' | 'critical'
    });

    // Task management states
    const [tasks, setTasks] = useState<RiskTask[]>([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        description: '',
        responsible_id: '',
        deadline: ''
    });
    const [selectedTask, setSelectedTask] = useState<RiskTask | null>(null);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Get Company
            const { data: company } = await supabase
                .from('company_info')
                .select('id')
                .eq('owner_id', user?.id)
                .single();

            if (company) {
                setCompanyId(company.id);

                // Get risks from database (including swot_id)
                const { data: risksData } = await supabase
                    .from('risks_opportunities')
                    .select('*')
                    .eq('company_id', company.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                setRisks(risksData || []);

                // Get imported SWOT IDs (for items with swot_id)
                const importedSwotIds = new Set(
                    (risksData || [])
                        .map(r => r.swot_id)
                        .filter((id): id is string => id !== null)
                );

                // Get imported descriptions (fallback for legacy items without swot_id)
                const importedDescriptions = new Set(
                    (risksData || [])
                        .filter(r => r.origin?.includes('SWOT'))
                        .map(r => r.description.replace(/\s*\(Origem:.*?\)$/, '').trim())
                );

                // Get SWOT items that haven't been imported yet
                const { data: swotData } = await supabase
                    .from('swot_analysis')
                    .select('id, description, type')
                    .eq('company_id', company.id)
                    .eq('is_active', true);

                // Filter out already imported items (by ID or description)
                const availableSwotItems = (swotData || []).filter(
                    item => !importedSwotIds.has(item.id) && !importedDescriptions.has(item.description.trim())
                );
                setSwotItems(availableSwotItems);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSeverity = (prob: number, imp: number) => prob * imp;

    const getSeverityLevel = (score: number, type: RiskType) => {
        if (type === 'opportunity') {
            if (score >= 15) return { label: 'Excelente', color: 'bg-green-100 text-green-800 border-green-200' };
            if (score >= 8) return { label: 'Bom', color: 'bg-blue-100 text-blue-800 border-blue-200' };
            return { label: 'Baixo', color: 'bg-gray-100 text-gray-800 border-gray-200' };
        } else {
            if (score >= 15) return { label: 'Crítico', color: 'bg-red-100 text-red-800 border-red-200' };
            if (score >= 8) return { label: 'Alto', color: 'bg-orange-100 text-orange-800 border-orange-200' };
            if (score >= 4) return { label: 'Médio', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            return { label: 'Baixo', color: 'bg-green-100 text-green-800 border-green-200' };
        }
    };

    const handleImportSwot = async () => {
        if (!companyId) return;

        try {
            const newRisks = selectedSwotItems.map(id => {
                const item = swotItems.find(i => i.id === id);
                if (!item) return null;

                return {
                    company_id: companyId,
                    swot_id: item.id,
                    type: item.type === 'forca' || item.type === 'oportunidade' ? 'opportunity' : 'risk',
                    origin: `SWOT - ${item.type === 'forca' ? 'Força' : item.type === 'fraqueza' ? 'Fraqueza' : item.type === 'oportunidade' ? 'Oportunidade' : 'Ameaça'}`,
                    description: item.description,
                    probability: 1,
                    impact: 1,
                    action_plan: 'Definir plano de ação...',
                    status: 'active'
                };
            }).filter((r): r is any => r !== null);

            const { error } = await supabase
                .from('risks_opportunities')
                .insert(newRisks);

            if (error) throw error;

            setIsImportModalOpen(false);
            setSelectedSwotItems([]);
            await loadData(); // Reload to show new items and update available SWOT items
            alert(`${newRisks.length} itens importados com sucesso!`);
        } catch (error: any) {
            alert('Erro ao importar: ' + error.message);
        }
    };

    const toggleSwotSelection = (id: string) => {
        setSelectedSwotItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const openEditModal = async (risk: RiskItem) => {
        setEditingRisk(risk);
        setEditForm({
            probability: risk.probability,
            impact: risk.impact,
            action_plan: risk.action_plan || ''
        });
        setIsEditModalOpen(true);

        // Load tasks and users for the modal
        await fetchTasksForRisk(risk.id);
        await fetchUsers();
    };

    const handleUpdateRisk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRisk) return;

        try {
            const { error } = await supabase
                .from('risks_opportunities')
                .update({
                    probability: editForm.probability,
                    impact: editForm.impact,
                    action_plan: editForm.action_plan
                })
                .eq('id', editingRisk.id);

            if (error) throw error;

            setIsEditModalOpen(false);
            await loadData();
            alert('✅ Risco atualizado com sucesso!');
        } catch (error: any) {
            alert('❌ Erro ao atualizar: ' + error.message);
        }
    };

    const handleDeleteRisk = async (id: string) => {
        if (!confirm('Deseja realmente excluir este item?')) return;

        try {
            const { error } = await supabase
                .from('risks_opportunities')
                .update({ status: 'archived' })
                .eq('id', id);

            if (error) throw error;

            await loadData();
            alert('✅ Item excluído com sucesso!');
        } catch (error: any) {
            alert('❌ Erro ao excluir: ' + error.message);
        }
    };

    // Task Management Functions
    const fetchTasksForRisk = async (riskId: string) => {
        try {
            const { data, error } = await supabase
                .from('risk_tasks_with_responsible')
                .select('*')
                .eq('risk_id', riskId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (error: any) {
            console.error('Error fetching tasks:', error);
        }
    };

    const fetchUsers = async () => {
        if (!companyId) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('company_id', companyId);

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            console.error('Error fetching users:', error);
        }
    };

    const handleCreateTask = async () => {
        if (!editingRisk || !taskForm.description.trim()) {
            alert('Preencha a descrição da tarefa');
            return;
        }

        try {
            const { error } = await supabase
                .from('risk_tasks')
                .insert([{
                    risk_id: editingRisk.id,
                    description: taskForm.description,
                    responsible_id: taskForm.responsible_id || null,
                    deadline: taskForm.deadline || null,
                    status: 'pending'
                }]);

            if (error) throw error;

            setIsTaskModalOpen(false);
            setTaskForm({ description: '', responsible_id: '', deadline: '' });
            await fetchTasksForRisk(editingRisk.id);
            alert('✅ Tarefa criada com sucesso!');
        } catch (error: any) {
            alert('❌ Erro ao criar tarefa: ' + error.message);
        }
    };

    const handleUpdateTask = async () => {
        if (!selectedTask || !taskForm.description.trim()) {
            alert('Preencha a descrição da tarefa');
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
            setTaskForm({ description: '', responsible_id: '', deadline: '' });
            if (editingRisk) await fetchTasksForRisk(editingRisk.id);
            alert('✅ Tarefa atualizada com sucesso!');
        } catch (error: any) {
            alert('❌ Erro ao atualizar tarefa: ' + error.message);
        }
    };

    const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
            const { error } = await supabase
                .from('risk_tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) throw error;

            if (editingRisk) await fetchTasksForRisk(editingRisk.id);
        } catch (error: any) {
            alert('❌ Erro ao atualizar tarefa: ' + error.message);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Deseja realmente excluir esta tarefa?')) return;

        try {
            const { error } = await supabase
                .from('risk_tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            if (editingRisk) await fetchTasksForRisk(editingRisk.id);
            alert('✅ Tarefa excluída com sucesso!');
        } catch (error: any) {
            alert('❌ Erro ao excluir tarefa: ' + error.message);
        }
    };

    const openTaskModal = (task?: RiskTask) => {
        if (task) {
            setSelectedTask(task);
            setTaskForm({
                description: task.description,
                responsible_id: task.responsible_id || '',
                deadline: task.deadline || ''
            });
        } else {
            setSelectedTask(null);
            setTaskForm({ description: '', responsible_id: '', deadline: '' });
        }
        setIsTaskModalOpen(true);
    };


    const filteredRisks = risks.filter(risk => {
        // Search filter
        const matchesSearch = risk.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            risk.action_plan.toLowerCase().includes(searchTerm.toLowerCase());

        // Type filter
        const matchesType = filters.type === 'all' || risk.type === filters.type;

        // Severity filter
        const severity = calculateSeverity(risk.probability, risk.impact);
        let matchesSeverity = true;
        if (filters.severity !== 'all') {
            if (filters.severity === 'critical') matchesSeverity = severity >= 15;
            else if (filters.severity === 'high') matchesSeverity = severity >= 8 && severity < 15;
            else if (filters.severity === 'medium') matchesSeverity = severity >= 4 && severity < 8;
            else if (filters.severity === 'low') matchesSeverity = severity < 4;
        }

        return matchesSearch && matchesType && matchesSeverity;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#025159]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ShieldAlert className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#025159]">Matriz de Riscos e Oportunidades</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Gestão baseada em riscos (ISO 9001: 6.1)
                    </p>
                </div>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 bg-[#025159] text-white px-4 py-2.5 rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                >
                    <Download size={20} />
                    <span>Importar da SWOT</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar riscos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                        />
                    </div>
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
                    >
                        <Filter size={20} />
                        <span>Filtros</span>
                        {(filters.type !== 'all' || filters.severity !== 'all') && (
                            <span className="ml-1 px-2 py-0.5 bg-[#025159] text-white text-xs rounded-full">
                                {[filters.type !== 'all' ? 1 : 0, filters.severity !== 'all' ? 1 : 0].reduce((a, b) => a + b)}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4 w-1/3">Descrição do Risco/Oportunidade</th>
                                <th className="px-6 py-4 text-center">Prob.</th>
                                <th className="px-6 py-4 text-center">Imp.</th>
                                <th className="px-6 py-4 text-center">Nível (PxI)</th>
                                <th className="px-6 py-4 w-1/3">Plano de Ação</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRisks.map((risk) => {
                                const severity = calculateSeverity(risk.probability, risk.impact);
                                const level = getSeverityLevel(severity, risk.type);
                                const isSwot = risk.origin.toLowerCase().includes('swot') || risk.origin.toLowerCase().includes('contexto');

                                return (
                                    <tr key={risk.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {risk.type === 'risk' ? (
                                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2 py-1 rounded-md w-fit">
                                                        <AlertTriangle size={16} />
                                                        <span className="text-xs font-bold">Risco</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                                                        <TrendingUp size={16} />
                                                        <span className="text-xs font-bold">Oportunidade</span>
                                                    </div>
                                                )}

                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {/* Origin Badge */}
                                                <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border w-fit mb-1 ${isSwot
                                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    <LinkIcon size={10} />
                                                    <span title={risk.origin}>{risk.origin}</span>
                                                </div>
                                                <p className="text-sm text-gray-900 font-medium line-clamp-2">{risk.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                                                {risk.probability}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                                                {risk.impact}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${level.color}`}>
                                                <span className="text-xs font-bold uppercase">{level.label}</span>
                                                <span className="text-xs font-black opacity-75">({severity})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <ShieldAlert size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-gray-600 line-clamp-2">{risk.action_plan}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(risk)}
                                                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRisk(risk.id)}
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

                {filteredRisks.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <p>Nenhum item encontrado.</p>
                    </div>
                )}
            </div>

            {/* Mobile Cards - Hidden on desktop */}
            <div className="lg:hidden space-y-3">
                {filteredRisks.length > 0 ? (
                    filteredRisks.map((risk) => {
                        const severity = calculateSeverity(risk.probability, risk.impact);
                        const level = getSeverityLevel(severity, risk.type);
                        const isSwot = risk.origin.toLowerCase().includes('swot') || risk.origin.toLowerCase().includes('contexto');

                        return (
                            <div key={risk.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        {/* Type Badge */}
                                        {risk.type === 'risk' ? (
                                            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2.5 py-1 rounded-md w-fit mb-2">
                                                <AlertTriangle size={14} />
                                                <span className="text-xs font-bold">Risco</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md w-fit mb-2">
                                                <TrendingUp size={14} />
                                                <span className="text-xs font-bold">Oportunidade</span>
                                            </div>
                                        )}

                                        {/* Origin Badge */}
                                        <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border w-fit mb-2 ${isSwot
                                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                            <LinkIcon size={10} />
                                            <span>{risk.origin}</span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-gray-900 font-medium mb-2">{risk.description}</p>

                                        {/* Severity Level */}
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${level.color}`}>
                                            <span className="font-bold uppercase">{level.label}</span>
                                            <span className="font-black opacity-75">({severity})</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1 flex-shrink-0 ml-2">
                                        <button
                                            onClick={() => openEditModal(risk)}
                                            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRisk(risk.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <span className="text-xs text-gray-500 block mb-1">Probabilidade</span>
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold">
                                            {risk.probability}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <span className="text-xs text-gray-500 block mb-1">Impacto</span>
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold">
                                            {risk.impact}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Plan */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <ShieldAlert size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-gray-500 font-medium block mb-1">Plano de Ação:</span>
                                            <p className="text-xs text-gray-700">{risk.action_plan}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                        <p>Nenhum item encontrado.</p>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Importar da Análise SWOT</h3>
                                <p className="text-sm text-gray-500">Selecione os itens do contexto para transformar em riscos/oportunidades</p>
                            </div>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-3">
                                {swotItems.length > 0 ? swotItems.map(item => (
                                    <label
                                        key={item.id}
                                        className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedSwotItems.includes(item.id)
                                            ? 'border-[#025159] bg-[#025159]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSwotItems.includes(item.id)}
                                            onChange={() => toggleSwotSelection(item.id)}
                                            className="mt-1 w-5 h-5 text-[#025159] border-gray-300 rounded focus:ring-[#025159]"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${item.type === 'forca' ? 'bg-green-100 text-green-700' :
                                                    item.type === 'fraqueza' ? 'bg-orange-100 text-orange-700' :
                                                        item.type === 'oportunidade' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.type === 'forca' ? 'Força' :
                                                        item.type === 'fraqueza' ? 'Fraqueza' :
                                                            item.type === 'oportunidade' ? 'Oportunidade' : 'Ameaça'}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 font-medium">{item.description}</p>
                                        </div>
                                    </label>
                                )) : (
                                    <p className="text-center text-gray-500 py-8">Nenhum item SWOT encontrado. Adicione itens na Análise de Contexto primeiro.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImportSwot}
                                disabled={selectedSwotItems.length === 0}
                                className="px-6 py-2 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#3F858C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Importar {selectedSwotItems.length > 0 ? `(${selectedSwotItems.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingRisk && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Editar Risco/Oportunidade</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRisk} className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="text-sm text-gray-700 font-medium">{editingRisk.description}</p>
                                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${editingRisk.type === 'risk'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {editingRisk.type === 'risk' ? 'Risco' : 'Oportunidade'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Probabilidade (1-5)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        required
                                        value={editForm.probability}
                                        onChange={e => setEditForm({ ...editForm, probability: parseInt(e.target.value) })}
                                        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Impacto (1-5)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        required
                                        value={editForm.impact}
                                        onChange={e => setEditForm({ ...editForm, impact: parseInt(e.target.value) })}
                                        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Nível Calculado (P×I):</span>
                                    <span className="text-lg font-bold text-[#025159]">
                                        {editForm.probability * editForm.impact}
                                    </span>
                                </div>
                            </div>

                            {/* Task List Section */}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Plano de Ação (Tarefas)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => openTaskModal()}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#025159] text-white text-sm rounded-lg hover:bg-[#3F858C] transition-colors"
                                    >
                                        <Plus size={16} />
                                        Nova Tarefa
                                    </button>
                                </div>

                                {tasks.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <p>Nenhuma tarefa adicionada.</p>
                                        <p className="text-xs mt-1">Clique em "Nova Tarefa" para começar</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`p-3 rounded-lg border transition-colors ${task.status === 'completed'
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-white border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'completed'
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-gray-300 hover:border-green-500'
                                                            }`}
                                                    >
                                                        {task.status === 'completed' && (
                                                            <Check size={14} className="text-white" />
                                                        )}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium ${task.status === 'completed'
                                                            ? 'line-through text-gray-500'
                                                            : 'text-gray-900'
                                                            }`}>
                                                            {task.description}
                                                        </p>

                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                            {task.responsible_name && (
                                                                <span className="flex items-center gap-1">
                                                                    <User size={12} />
                                                                    {task.responsible_name}
                                                                </span>
                                                            )}
                                                            {task.deadline && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(task.deadline).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openTaskModal(task)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.type === 'all'}
                                            onChange={() => setFilters({ ...filters, type: 'all' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Todos</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.type === 'risk'}
                                            onChange={() => setFilters({ ...filters, type: 'risk' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Apenas Riscos</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.type === 'opportunity'}
                                            onChange={() => setFilters({ ...filters, type: 'opportunity' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Apenas Oportunidades</span>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Severidade</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.severity === 'all'}
                                            onChange={() => setFilters({ ...filters, severity: 'all' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Todos</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.severity === 'critical'}
                                            onChange={() => setFilters({ ...filters, severity: 'critical' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Crítico (≥15)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.severity === 'high'}
                                            onChange={() => setFilters({ ...filters, severity: 'high' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Alto (8-14)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.severity === 'medium'}
                                            onChange={() => setFilters({ ...filters, severity: 'medium' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Médio (4-7)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={filters.severity === 'low'}
                                            onChange={() => setFilters({ ...filters, severity: 'low' })}
                                            className="text-[#025159]"
                                        />
                                        <span className="text-sm">Baixo (&lt;4)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setFilters({ type: 'all', severity: 'all' });
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
                                    setTaskForm({ description: '', responsible_id: '', deadline: '' });
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
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
                                        setTaskForm({ description: '', responsible_id: '', deadline: '' });
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
        </div>
    );
};
