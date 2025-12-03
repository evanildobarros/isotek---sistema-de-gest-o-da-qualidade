import React, { useEffect, useState } from 'react';
import {
    Plus,
    Truck,
    Package,
    Wrench,
    Laptop,
    Building,
    Star,
    Edit2,
    Trash2,
    X,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Supplier, SupplierEvaluation } from '../../../types';
import { PlanGuard } from '../../auth/PlanGuard';

const SuppliersPageContent: React.FC = () => {
    const { user, company } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'directory' | 'evaluations'>('directory');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

    // Modals
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [evaluatingSupplier, setEvaluatingSupplier] = useState<Supplier | null>(null);

    // Forms
    const [supplierForm, setSupplierForm] = useState({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        category: 'Matéria Prima',
        status: 'em_analise' as const,
        blocked_reason: ''
    });

    const [evaluationForm, setEvaluationForm] = useState({
        criteria_quality: 8,
        criteria_deadline: 8,
        criteria_communication: 8,
        comments: ''
    });

    useEffect(() => {
        fetchSuppliers();
        fetchEvaluations();
    }, [user, company]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            if (!company) return;

            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('company_id', company.id)
                .order('name');

            if (error) throw error;
            setSuppliers(data || []);
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvaluations = async () => {
        try {
            if (!company) return;

            const { data, error } = await supabase
                .from('supplier_evaluations_with_details')
                .select('*')
                .eq('company_id', company.id)
                .order('evaluation_date', { ascending: false })
                .limit(20);

            if (error) throw error;
            setEvaluations(data || []);
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        }
    };

    const handleOpenSupplierModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setSupplierForm({
                name: supplier.name,
                cnpj: supplier.cnpj || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                category: supplier.category,
                status: supplier.status,
                blocked_reason: supplier.blocked_reason || ''
            });
        } else {
            setEditingSupplier(null);
            setSupplierForm({
                name: '',
                cnpj: '',
                email: '',
                phone: '',
                category: 'Matéria Prima',
                status: 'em_analise',
                blocked_reason: ''
            });
        }
        setIsSupplierModalOpen(true);
    };

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;

        try {
            const payload = {
                ...supplierForm,
                company_id: company.id
            };

            if (editingSupplier) {
                const { error } = await supabase
                    .from('suppliers')
                    .update(payload)
                    .eq('id', editingSupplier.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('suppliers')
                    .insert([payload]);
                if (error) throw error;
            }

            fetchSuppliers();
            setIsSupplierModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            toast.error('Erro ao salvar fornecedor');
        }
    };

    const handleDeleteSupplier = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchSuppliers();
        } catch (error) {
            console.error('Erro ao excluir fornecedor:', error);
        }
    };

    const handleOpenEvaluationModal = (supplier: Supplier) => {
        setEvaluatingSupplier(supplier);
        setEvaluationForm({
            criteria_quality: 8,
            criteria_deadline: 8,
            criteria_communication: 8,
            comments: ''
        });
        setIsEvaluationModalOpen(true);
    };

    const handleSaveEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!evaluatingSupplier || !user) return;

        try {
            const payload = {
                supplier_id: evaluatingSupplier.id,
                evaluator_id: user.id,
                evaluation_date: new Date().toISOString().split('T')[0],
                ...evaluationForm
            };

            const { error } = await supabase
                .from('supplier_evaluations')
                .insert([payload]);

            if (error) throw error;

            // Refresh data
            fetchSuppliers();
            fetchEvaluations();
            setIsEvaluationModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar avaliação:', error);
            toast.error('Erro ao salvar avaliação');
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Matéria Prima':
            case 'Mat. Escritório':
                return <Package className="w-6 h-6 text-amber-600" />;
            case 'Transporte':
            case 'Logística':
                return <Truck className="w-6 h-6 text-orange-600" />;
            case 'TI/Hardware':
            case 'TI / Hardware':
                return <Laptop className="w-6 h-6 text-blue-600" />;
            case 'Serviços':
                return <Wrench className="w-6 h-6 text-purple-600" />;
            default:
                return <Building className="w-6 h-6 text-gray-600" />;
        }
    };

    const getStatusBadge = (status: Supplier['status']) => {
        switch (status) {
            case 'homologado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                        <CheckCircle2 className="w-4 h-4" />
                        APROVADO
                    </span>
                );
            case 'em_analise':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-sm font-semibold rounded-full border border-yellow-200">
                        <Clock className="w-4 h-4" />
                        EM ANÁLISE
                    </span>
                );
            case 'bloqueado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-sm font-semibold rounded-full border border-red-200">
                        <AlertCircle className="w-4 h-4" />
                        BLOQUEADO
                    </span>
                );
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const calculateAverage = () => {
        const { criteria_quality, criteria_deadline, criteria_communication } = evaluationForm;
        return ((criteria_quality + criteria_deadline + criteria_communication) / 3).toFixed(1);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6 md:mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                            Gestão de Fornecedores e Compras
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        ISO 9001: 8.4 - Controle de Processos Externos
                    </p>
                </div>
                <button
                    onClick={() => handleOpenSupplierModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-md font-medium w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span>Novo Fornecedor</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('directory')}
                            className={`flex-1 px-3 md:px-6 py-3 font-semibold text-xs md:text-sm transition-colors ${activeTab === 'directory'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="hidden sm:inline">DIRETÓRIO DE FORNECEDORES</span>
                            <span className="sm:hidden">FORNECEDORES</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('evaluations')}
                            className={`flex-1 px-3 md:px-6 py-3 font-semibold text-xs md:text-sm transition-colors ${activeTab === 'evaluations'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="hidden sm:inline">AVALIAÇÕES (IQF)</span>
                            <span className="sm:hidden">AVALIAÇÕES</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {activeTab === 'directory' && (
                        <div>
                            {/* Table Header - Desktop Only */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg mb-3 font-semibold text-sm text-gray-600">
                                <div className="col-span-3">EMPRESA</div>
                                <div className="col-span-2">CATEGORIA</div>
                                <div className="col-span-2">STATUS</div>
                                <div className="col-span-2">NOTA (IQF)</div>
                                <div className="col-span-3 text-right">AÇÕES</div>
                            </div>

                            {/* Suppliers List */}
                            <div className="space-y-2">
                                {suppliers.map(supplier => {
                                    const isExpanded = expandedSupplierId === supplier.id;
                                    const hasLowScore = supplier.iqf_score < 70;

                                    return (
                                        <div key={supplier.id} className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                            {/* Desktop Layout */}
                                            <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 items-center">
                                                {/* Company */}
                                                <div className="col-span-3 flex items-center gap-3">
                                                    <div className="p-2 bg-gray-50 rounded-lg">
                                                        {getCategoryIcon(supplier.category)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-gray-900 truncate">
                                                            {supplier.name}
                                                        </h3>
                                                        {supplier.cnpj && (
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {supplier.cnpj}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Category */}
                                                <div className="col-span-2">
                                                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                                        {supplier.category}
                                                    </span>
                                                </div>

                                                {/* Status */}
                                                <div className="col-span-2">
                                                    {getStatusBadge(supplier.status)}
                                                </div>

                                                {/* IQF Score */}
                                                <div className="col-span-2">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                        <span className={`text-lg font-bold ${hasLowScore ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {supplier.iqf_score.toFixed(0)}/100
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="col-span-3 flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEvaluationModal(supplier)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Avaliar Fornecedor"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        Avaliar
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenSupplierModal(supplier)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    {supplier.status === 'bloqueado' && supplier.blocked_reason && (
                                                        <button
                                                            onClick={() => setExpandedSupplierId(isExpanded ? null : supplier.id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mobile Layout */}
                                            <div className="lg:hidden p-4 space-y-3">
                                                {/* Header: Icon + Name + Status */}
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                                                        {getCategoryIcon(supplier.category)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900">
                                                            {supplier.name}
                                                        </h3>
                                                        {supplier.cnpj && (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {supplier.cnpj}
                                                            </p>
                                                        )}
                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                                                {supplier.category}
                                                            </span>
                                                            {getStatusBadge(supplier.status)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* IQF Score */}
                                                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                                    <span className="text-sm text-gray-600 font-medium">Nota IQF:</span>
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                        <span className={`text-xl font-bold ${hasLowScore ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {supplier.iqf_score.toFixed(0)}/100
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleOpenEvaluationModal(supplier)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        Avaliar
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenSupplierModal(supplier)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    {supplier.status === 'bloqueado' && supplier.blocked_reason && (
                                                        <button
                                                            onClick={() => setExpandedSupplierId(isExpanded ? null : supplier.id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Block Reason */}
                                            {isExpanded && supplier.blocked_reason && (
                                                <div className="px-4 pb-4 border-t border-gray-100 bg-red-50/30">
                                                    <div className="flex items-start gap-2 pt-3">
                                                        <ChevronRight className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-sm text-red-900">Motivo:</span>
                                                            <span className="text-sm text-red-800 ml-2">{supplier.blocked_reason}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {suppliers.length === 0 && !loading && (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900">Nenhum fornecedor cadastrado</h3>
                                        <p className="text-gray-500">Comece adicionando seus fornecedores.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'evaluations' && (
                        <div className="space-y-4">
                            {evaluations.map(evaluation => (
                                <div key={evaluation.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                                            <span className="font-semibold text-gray-900">{evaluation.supplier_name}</span>
                                            <span className="hidden sm:inline text-xs text-gray-500">•</span>
                                            <span className="text-sm text-gray-600">{formatDate(evaluation.evaluation_date)}</span>
                                        </div>
                                        {evaluation.comments && (
                                            <p className="text-sm text-gray-600 mb-2">{evaluation.comments}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-gray-500">
                                            <span>Qualidade: {evaluation.criteria_quality.toFixed(1)}</span>
                                            <span>Prazos: {evaluation.criteria_deadline.toFixed(1)}</span>
                                            <span>Comunicação: {evaluation.criteria_communication.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                        <span className="md:hidden text-sm text-gray-600 font-medium">Nota Final:</span>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-xl font-bold text-gray-900">
                                                {evaluation.final_score.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {evaluations.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-base md:text-lg font-medium text-gray-900">Nenhuma avaliação registrada</h3>
                                    <p className="text-sm text-gray-500">As avaliações de fornecedores aparecerão aqui.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Supplier Modal */}
            {isSupplierModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h2 className="text-base md:text-lg font-bold text-gray-900">
                                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                            </h2>
                            <button onClick={() => setIsSupplierModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSupplier} className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa *</label>
                                    <input
                                        type="text"
                                        required
                                        value={supplierForm.name}
                                        onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="Ex: Papelaria Silva Ltda"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                                    <input
                                        type="text"
                                        value={supplierForm.cnpj}
                                        onChange={e => setSupplierForm({ ...supplierForm, cnpj: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                                    <select
                                        value={supplierForm.category}
                                        onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                                    >
                                        <option value="Matéria Prima">Matéria Prima</option>
                                        <option value="Mat. Escritório">Mat. Escritório</option>
                                        <option value="Serviços">Serviços</option>
                                        <option value="Transporte">Transporte</option>
                                        <option value="Logística">Logística</option>
                                        <option value="TI/Hardware">TI/Hardware</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={supplierForm.email}
                                        onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="contato@fornecedor.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                                    <input
                                        type="tel"
                                        value={supplierForm.phone}
                                        onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="(00) 0000-0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                    <select
                                        value={supplierForm.status}
                                        onChange={e => setSupplierForm({ ...supplierForm, status: e.target.value as Supplier['status'] })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                                    >
                                        <option value="em_analise">Em Análise</option>
                                        <option value="homologado">Homologado</option>
                                        <option value="bloqueado">Bloqueado</option>
                                    </select>
                                </div>

                                {supplierForm.status === 'bloqueado' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Motivo do Bloqueio</label>
                                        <textarea
                                            rows={3}
                                            value={supplierForm.blocked_reason}
                                            onChange={e => setSupplierForm({ ...supplierForm, blocked_reason: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                            placeholder="Ex: Atrasos recorrentes (Ver 3 RNCs)"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 sticky bottom-0 bg-white pb-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSupplierModalOpen(false)}
                                    className="w-full md:w-auto px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="w-full md:w-auto px-6 py-2.5 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {isEvaluationModalOpen && evaluatingSupplier && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                            <div>
                                <h2 className="text-base md:text-lg font-bold text-gray-900">Avaliação de Desempenho</h2>
                                <p className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">{evaluatingSupplier.name}</p>
                            </div>
                            <button onClick={() => setIsEvaluationModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvaluation} className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto flex-1">
                            {/* Quality Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-700">Qualidade do Produto/Serviço</label>
                                    <span className="text-lg font-bold text-blue-600">{evaluationForm.criteria_quality.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={evaluationForm.criteria_quality}
                                    onChange={e => setEvaluationForm({ ...evaluationForm, criteria_quality: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0</span>
                                    <span>5</span>
                                    <span>10</span>
                                </div>
                            </div>

                            {/* Deadline Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-700">Cumprimento de Prazos</label>
                                    <span className="text-lg font-bold text-blue-600">{evaluationForm.criteria_deadline.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={evaluationForm.criteria_deadline}
                                    onChange={e => setEvaluationForm({ ...evaluationForm, criteria_deadline: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0</span>
                                    <span>5</span>
                                    <span>10</span>
                                </div>
                            </div>

                            {/* Communication Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-700">Atendimento/Comunicação</label>
                                    <span className="text-lg font-bold text-blue-600">{evaluationForm.criteria_communication.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={evaluationForm.criteria_communication}
                                    onChange={e => setEvaluationForm({ ...evaluationForm, criteria_communication: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0</span>
                                    <span>5</span>
                                    <span>10</span>
                                </div>
                            </div>

                            {/* Average Score */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Nota Final (Média):</span>
                                    <div className="flex items-center gap-2">
                                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                        <span className="text-2xl font-bold text-gray-900">{calculateAverage()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Comentários</label>
                                <textarea
                                    rows={3}
                                    value={evaluationForm.comments}
                                    onChange={e => setEvaluationForm({ ...evaluationForm, comments: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Observações sobre o desempenho do fornecedor..."
                                />
                            </div>

                            <div className="pt-4 flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 sticky bottom-0 bg-white pb-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEvaluationModalOpen(false)}
                                    className="w-full md:w-auto px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="w-full md:w-auto px-6 py-2.5 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                                >
                                    Salvar Avaliação
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SuppliersPage: React.FC = () => {
    return (
        <PlanGuard
            requiredFeature="suppliers"
            featureName="Gestão de Fornecedores"
            requiredPlan="pro"
            description="Gerencie seu cadastro de fornecedores, realize avaliações de desempenho (IQF) e mantenha o controle de qualidade da sua cadeia de suprimentos."
        >
            <SuppliersPageContent />
        </PlanGuard>
    );
};
