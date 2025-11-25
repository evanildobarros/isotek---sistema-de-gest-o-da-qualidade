import React, { useEffect, useState } from 'react';
import { Save, Plus, ArrowRight, User, Settings, Layers, Trash2, Edit2, X, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { QualityManual, Process } from '../types';

export const ScopePage: React.FC = () => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [savingScope, setSavingScope] = useState(false);

    // Scope State
    const [scopeData, setScopeData] = useState<Partial<QualityManual>>({
        scope: '',
        applies_to_all_units: true,
        excluded_units: ''
    });
    const [manualId, setManualId] = useState<string | null>(null);

    // Processes State
    const [processes, setProcesses] = useState<Process[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
    const [processForm, setProcessForm] = useState<Partial<Process>>({
        name: '',
        owner: '',
        inputs: '',
        outputs: '',
        resources: ''
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Scope
            const { data: manualData, error: manualError } = await supabase
                .from('quality_manual')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (manualError) throw manualError;

            if (manualData) {
                setManualId(manualData.id);
                setScopeData({
                    scope: manualData.scope,
                    applies_to_all_units: manualData.applies_to_all_units,
                    excluded_units: manualData.excluded_units
                });
            }

            // Fetch Processes
            const { data: processesData, error: processesError } = await supabase
                .from('processes')
                .select('*')
                .order('created_at', { ascending: true });

            if (processesError) throw processesError;
            setProcesses(processesData || []);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Scope Functions ---

    const handleSaveScope = async () => {
        if (!user) return;
        setSavingScope(true);
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Perfil não encontrado');

            const payload = {
                ...scopeData,
                company_id: profile.company_id,
                updated_at: new Date().toISOString()
            };

            if (manualId) {
                const { error } = await supabase
                    .from('quality_manual')
                    .update(payload)
                    .eq('id', manualId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('quality_manual')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                if (data) setManualId(data.id);
            }

            alert('Escopo salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar escopo:', error);
            alert(`Erro ao salvar escopo: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        } finally {
            setSavingScope(false);
        }
    };

    // --- Process Functions ---

    const handleOpenModal = (process?: Process) => {
        if (process) {
            setEditingProcessId(process.id);
            setProcessForm({
                name: process.name,
                owner: process.owner,
                inputs: process.inputs,
                outputs: process.outputs,
                resources: process.resources
            });
        } else {
            setEditingProcessId(null);
            setProcessForm({
                name: '',
                owner: '',
                inputs: '',
                outputs: '',
                resources: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProcessId(null);
    };

    const handleSaveProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Perfil não encontrado');

            const payload = {
                ...processForm,
                company_id: profile.company_id
            };

            if (editingProcessId) {
                const { error } = await supabase
                    .from('processes')
                    .update(payload)
                    .eq('id', editingProcessId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('processes')
                    .insert([payload]);
                if (error) throw error;
            }

            fetchData(); // Refresh list
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar processo:', error);
            alert(`Erro ao salvar processo: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    };

    const handleDeleteProcess = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este processo?')) return;
        try {
            const { error } = await supabase
                .from('processes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Erro ao excluir processo:', error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">

            {/* SEÇÃO 1: DEFINIÇÃO DO ESCOPO (4.3) */}
            <section>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                Escopo do Sistema de Gestão da Qualidade
                            </h2>
                            <p className="text-blue-100 mt-1 text-sm">Definição dos limites e aplicabilidade do SGQ (ISO 9001:2015 - 4.3)</p>
                        </div>
                        <button
                            onClick={handleSaveScope}
                            disabled={savingScope}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors font-medium backdrop-blur-sm"
                        >
                            <Save className="w-4 h-4" />
                            {savingScope ? 'Salvando...' : 'Salvar Escopo'}
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição do Escopo
                            </label>
                            <textarea
                                rows={4}
                                value={scopeData.scope}
                                onChange={e => setScopeData({ ...scopeData, scope: e.target.value })}
                                placeholder="Ex: Desenvolvimento, comercialização e suporte de softwares para gestão empresarial..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700 leading-relaxed resize-y"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Descreva os produtos e serviços cobertos pelo SGQ.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center h-5">
                                <input
                                    id="applies-all"
                                    type="checkbox"
                                    checked={scopeData.applies_to_all_units}
                                    onChange={e => setScopeData({ ...scopeData, applies_to_all_units: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="applies-all" className="font-medium text-gray-900 text-sm">
                                    Aplica-se a todas as unidades e locais da organização?
                                </label>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Se desmarcado, especifique quais unidades ou processos não estão inclusos.
                                </p>

                                {!scopeData.applies_to_all_units && (
                                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Unidades ou Locais Excluídos
                                        </label>
                                        <input
                                            type="text"
                                            value={scopeData.excluded_units}
                                            onChange={e => setScopeData({ ...scopeData, excluded_units: e.target.value })}
                                            placeholder="Ex: Filial Norte, Depósito Externo..."
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: MAPA DE PROCESSOS (4.4) */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Layers className="w-7 h-7 text-blue-600" />
                            Mapeamento de Processos
                        </h2>
                        <p className="text-gray-500 mt-1">Identificação dos processos, suas interações e recursos (ISO 9001:2015 - 4.4)</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Processo
                    </button>
                </div>

                <div className="grid gap-6">
                    {processes.map((process) => (
                        <div key={process.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 group">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">

                                {/* Header do Processo */}
                                <div className="min-w-[200px]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900">{process.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <User className="w-4 h-4" />
                                        <span>{process.owner || 'Sem responsável'}</span>
                                    </div>
                                </div>

                                {/* Fluxo Visual */}
                                <div className="flex-1 bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-4 border border-gray-100">
                                    <div className="flex-1 text-center">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Entradas</span>
                                        <p className="text-sm font-medium text-gray-700">{process.inputs}</p>
                                    </div>

                                    <div className="flex flex-col items-center justify-center px-4">
                                        <div className="h-0.5 w-16 bg-blue-200 relative">
                                            <div className="absolute right-0 -top-1.5 text-blue-400">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase mt-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Processo</span>
                                    </div>

                                    <div className="flex-1 text-center">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Saídas</span>
                                        <p className="text-sm font-medium text-gray-700">{process.outputs}</p>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                                    <button
                                        onClick={() => handleOpenModal(process)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProcess(process.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Recursos (Expansível ou visível) */}
                            {process.resources && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
                                    <Settings className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Recursos Necessários:</span>
                                        <span className="text-sm text-gray-600">{process.resources}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {processes.length === 0 && !loading && (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Nenhum processo mapeado</h3>
                            <p className="text-gray-500 max-w-md mx-auto mt-1">
                                Comece definindo os processos principais da sua organização para visualizar o fluxo de valor.
                            </p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="mt-6 text-blue-600 font-medium hover:text-blue-700 hover:underline"
                            >
                                Adicionar primeiro processo
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Modal de Processo */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingProcessId ? 'Editar Processo' : 'Novo Processo'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProcess} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Nome do Processo</label>
                                    <input
                                        type="text"
                                        required
                                        value={processForm.name}
                                        onChange={e => setProcessForm({ ...processForm, name: e.target.value })}
                                        placeholder="Ex: Vendas, Compras, Produção"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Responsável</label>
                                    <input
                                        type="text"
                                        value={processForm.owner}
                                        onChange={e => setProcessForm({ ...processForm, owner: e.target.value })}
                                        placeholder="Ex: Gerente Comercial"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Entradas (Inputs)</label>
                                    <textarea
                                        rows={3}
                                        value={processForm.inputs}
                                        onChange={e => setProcessForm({ ...processForm, inputs: e.target.value })}
                                        placeholder="O que inicia o processo? Ex: Pedido do cliente"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Saídas (Outputs)</label>
                                    <textarea
                                        rows={3}
                                        value={processForm.outputs}
                                        onChange={e => setProcessForm({ ...processForm, outputs: e.target.value })}
                                        placeholder="O que é entregue? Ex: Produto enviado"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Recursos Necessários</label>
                                <input
                                    type="text"
                                    value={processForm.resources}
                                    onChange={e => setProcessForm({ ...processForm, resources: e.target.value })}
                                    placeholder="Ex: Software CRM, Veículo, Equipe de 3 pessoas"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    Salvar Processo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
