import React, { useEffect, useState } from 'react';
import { Save, Plus, ArrowRight, User, Settings, Layers, Trash2, Edit2, X, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { QualityManual, Process } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const ScopePage: React.FC = () => {
    const { user, company, effectiveCompanyId } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [savingScope, setSavingScope] = useState(false);
    const [isEditingScope, setIsEditingScope] = useState(false);

    // Scope State
    const [scopeData, setScopeData] = useState<Partial<QualityManual>>({
        scope: ''
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

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        if (effectiveCompanyId) {
            fetchData();
        }
    }, [user, effectiveCompanyId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Verificar se temos o ID da empresa
            if (!effectiveCompanyId) {
                console.warn('Empresa não identificada no ScopePage');
                setLoading(false);
                return;
            }

            // Fetch Scope
            const { data: manualData, error: manualError } = await supabase
                .from('quality_manual')
                .select('id, scope, company_id')
                .eq('company_id', effectiveCompanyId)
                .limit(1)
                .maybeSingle();

            if (manualError) throw manualError;

            if (manualData) {
                setManualId(manualData.id);
                setScopeData({
                    scope: manualData.scope
                });
            }

            // Fetch Processes
            const { data: processesData, error: processesError } = await supabase
                .from('processes')
                .select('id, name, owner, inputs, outputs, resources, company_id, created_at')
                .eq('company_id', effectiveCompanyId)
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
        if (!user || !effectiveCompanyId) {
            toast.warning('Você precisa estar logado para realizar esta ação.');
            return;
        }

        setSavingScope(true);
        try {
            const payload = {
                scope: scopeData.scope,
                company_id: effectiveCompanyId
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

            toast.success('Escopo salvo com sucesso!');
            setIsEditingScope(false); // Exit edit mode after save
        } catch (error) {
            console.error('Erro ao salvar escopo:', error);
            toast.error(`Erro ao salvar escopo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
        if (!user || !company) {
            toast.warning('Você precisa estar logado e vinculado a uma empresa.');
            return;
        }

        try {
            const payload = {
                ...processForm,
                company_id: effectiveCompanyId
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
            toast.error(`Erro ao salvar processo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    };

    const handleDeleteProcess = async (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            const { error } = await supabase
                .from('processes')
                .delete()
                .eq('id', deleteModal.id);
            if (error) throw error;
            fetchData();
            toast.success('Processo excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir processo:', error);
            toast.error('Erro ao excluir processo');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Excluir Processo"
                message="Tem certeza que deseja excluir este processo?"
                confirmLabel="Excluir"
                variant="danger"
            />

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Carregando...</p>
                    </div>
                </div>
            )}

            {/* No Company State */}
            {!loading && !effectiveCompanyId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <p className="text-yellow-800 font-medium">Você não está vinculado a nenhuma empresa.</p>
                    <p className="text-yellow-600 text-sm mt-1">Entre em contato com o administrador do sistema.</p>
                </div>
            )}

            {/* Content - Only show when not loading and company exists */}
            {!loading && effectiveCompanyId && (
                <>

                    {/* SEÇÃO 1: DEFINIÇÃO DO ESCOPO (4.3) */}
                    <section>
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                    <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-[#025159]">Escopo do Sistema de Gestão da Qualidade</h1>
                            </div>
                            <p className="text-gray-500 text-sm">Defina o que está incluído no seu SGQ (ISO 9001:2015 - Cláusula 4.3)</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                            {/* View Mode - Show when scope exists and not editing */}
                            {scopeData.scope && !isEditingScope ? (
                                <div className="p-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <h3 className="font-semibold text-gray-900">Escopo Definido</h3>
                                            </div>
                                            <button
                                                onClick={() => setIsEditingScope(true)}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Editar
                                            </button>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {scopeData.scope}
                                        </p>
                                    </div>
                                </div>
                            ) : !isEditingScope ? (
                                /* Empty State - Show when no scope and not editing */
                                <div className="p-8">
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Escopo não definido</h3>
                                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                                            Defina o escopo do seu Sistema de Gestão da Qualidade para atender aos requisitos da ISO 9001.
                                        </p>
                                        <button
                                            onClick={() => setIsEditingScope(true)}
                                            className="inline-flex items-center gap-2 bg-[#025159] hover:bg-[#3F858C] text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Definir Escopo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Edit Mode - Show when editing */
                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Descrição do Escopo
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={scopeData.scope || ''}
                                            onChange={e => setScopeData({ ...scopeData, scope: e.target.value })}
                                            placeholder="Ex: Desenvolvimento, comercialização e suporte de softwares para gestão empresarial..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700 leading-relaxed resize-y"
                                            autoFocus
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Descreva os produtos e serviços cobertos pelo SGQ.
                                        </p>
                                    </div>

                                    {/* Botões */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                setIsEditingScope(false);
                                                // Reload original data
                                                fetchData();
                                            }}
                                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveScope}
                                            disabled={savingScope}
                                            className="flex items-center gap-2 bg-[#025159] hover:bg-[#3F858C] text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-4 h-4" />
                                            {savingScope ? 'Salvando...' : 'Salvar Escopo'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* SEÇÃO 2: MAPA DE PROCESSOS (4.4) */}
                    <section>
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                        <Layers className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#025159]">Mapeamento de Processos</h2>
                                </div>
                                <p className="text-gray-500 text-sm">Identificação dos processos, suas interações e recursos (ISO 9001:2015 - 4.4)</p>
                            </div>
                            <button
                                onClick={() => handleOpenModal()}
                                className="flex items-center gap-2 bg-[#025159] text-white px-5 py-2.5 rounded-xl hover:bg-[#025159]/90 transition-colors shadow-sm font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Novo Processo
                            </button>
                        </div>

                        <div className="grid gap-6">
                            {processes.map((process) => (
                                <div key={process.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 md:p-6 group">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">

                                        {/* Header do Processo */}
                                        <div className="w-full md:w-auto md:min-w-[200px]">
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
                                        <div className="flex-1 bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">
                                            {/* Seta inicial */}
                                            <div className="hidden md:flex items-center text-gray-400">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1 text-center md:text-left w-full">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Entradas</span>
                                                <p className="text-sm font-medium text-gray-700">{process.inputs}</p>
                                            </div>

                                            {/* Seta após Entradas */}
                                            <div className="flex items-center text-gray-400">
                                                <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                                            </div>

                                            <div className="flex flex-col items-center justify-center px-2">
                                                <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Processo</span>
                                            </div>

                                            {/* Seta após Processo */}
                                            <div className="flex items-center text-gray-400">
                                                <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                                            </div>

                                            <div className="flex-1 text-center md:text-left w-full">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Saídas</span>
                                                <p className="text-sm font-medium text-gray-700">{process.outputs}</p>
                                            </div>

                                            {/* Seta final */}
                                            <div className="hidden md:flex items-center text-gray-400">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Ações */}
                                        <div className="flex items-center justify-end gap-2 w-full md:w-auto pt-4 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-100 mt-4 md:mt-0">
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
                                            className="px-6 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                                        >
                                            Salvar Processo
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
