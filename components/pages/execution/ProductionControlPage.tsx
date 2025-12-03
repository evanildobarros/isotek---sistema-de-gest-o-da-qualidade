import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ChevronRight,
    Clock,
    Edit,
    Package,
    Plus,
    Search
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ProductionOrder, SalesOrder } from '../../../types';
import { EmptyState } from '../../common/EmptyState';
import { Modal } from '../../common/Modal';
import { PageHeader } from '../../common/PageHeader';

export const ProductionControlPage: React.FC = () => {
    const { company } = useAuthContext();
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

    // Form states
    const [createForm, setCreateForm] = useState({
        code: '',
        sales_order_id: '',
        product_service: '',
        start_date: '',
        work_instructions: ''
    });

    const [updateForm, setUpdateForm] = useState({
        status: 'scheduled' as ProductionOrder['status'],
        current_stage: '',
        notes: '',
        batch_number: ''
    });

    useEffect(() => {
        fetchOrders();
        fetchSalesOrders();
    }, [company]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            if (!company) return;

            const { data, error } = await supabase
                .from('production_orders_with_details')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Erro ao carregar ordens:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesOrders = async () => {
        try {
            if (!company) return;

            const { data, error } = await supabase
                .from('sales_orders')
                .select('id, code, client_name')
                .eq('company_id', company.id)
                .eq('status', 'approved')
                .order('code');

            if (error) throw error;
            setSalesOrders(data || []);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;

        try {
            const payload = {
                ...createForm,
                company_id: company.id,
                sales_order_id: createForm.sales_order_id || null,
                status: 'scheduled' as const
            };

            const { error } = await supabase
                .from('production_orders')
                .insert([payload]);

            if (error) throw error;

            fetchOrders();
            setIsCreateModalOpen(false);
            resetCreateForm();
        } catch (error) {
            console.error('Erro ao criar ordem:', error);
            alert('Erro ao criar ordem');
        }
    };

    const handleOpenUpdate = (order: ProductionOrder) => {
        setSelectedOrder(order);
        setUpdateForm({
            status: order.status,
            current_stage: order.current_stage || '',
            notes: order.notes || '',
            batch_number: order.batch_number || ''
        });
        setIsUpdateModalOpen(true);
    };

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        // Validação ISO 8.5.2: Rastreabilidade obrigatória para conclusão
        if (updateForm.status === 'completed' && !updateForm.batch_number.trim()) {
            alert('⚠️ Número de rastreabilidade (Lote/Série) é obrigatório para concluir a ordem!\n\nISO 9001:2015 - Requisito 8.5.2');
            return;
        }

        try {
            const { error } = await supabase
                .from('production_orders')
                .update(updateForm)
                .eq('id', selectedOrder.id);

            if (error) throw error;

            fetchOrders();
            setIsUpdateModalOpen(false);
            setSelectedOrder(null);
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
            alert('Erro ao atualizar ordem');
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            code: '',
            sales_order_id: '',
            product_service: '',
            start_date: '',
            work_instructions: ''
        });
    };

    const getStatusBadge = (status: ProductionOrder['status']) => {
        switch (status) {
            case 'scheduled':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                        <Calendar className="w-4 h-4" />
                        AGENDADO
                    </div>
                );
            case 'in_progress':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg font-semibold text-sm">
                        <Clock className="w-4 h-4" />
                        EM ANDAMENTO
                    </div>
                );
            case 'quality_check':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-semibold text-sm">
                        <Search className="w-4 h-4" />
                        VERIFICAÇÃO
                    </div>
                );
            case 'completed':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                        <CheckCircle className="w-4 h-4" />
                        CONCLUÍDO
                    </div>
                );
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'open') {
            return order.status !== 'completed';
        } else {
            return order.status === 'completed';
        }
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                icon={Package}
                title="Controle de Produção e Serviços"
                subtitle="ISO 9001: 8.5 - Execução Controlada"
                iconColor="purple"
                action={
                    <button
                        onClick={() => {
                            resetCreateForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-md font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Ordem
                    </button>
                }
            />

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('open')}
                    className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'open'
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    EM ABERTO
                    {activeTab === 'open' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#025159]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'history'
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    HISTÓRICO
                    {activeTab === 'history' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#025159]" />
                    )}
                </button>
            </div>

            {/* Orders Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando ordens...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title={activeTab === 'open' ? 'Nenhuma ordem em aberto' : 'Nenhuma ordem concluída'}
                    description={activeTab === 'open' ? 'Crie uma nova ordem de produção/serviço' : 'Ordens concluídas aparecerão aqui'}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Header */}
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    OP #{order.code}
                                </h3>
                                {order.client_name && (
                                    <p className="text-sm text-gray-600">
                                        <strong>CLIENTE:</strong> {order.client_name}
                                    </p>
                                )}
                            </div>

                            {/* Body */}
                            <div className="space-y-3 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Produto/Serviço:</p>
                                    <p className="text-sm text-gray-900 line-clamp-2">{order.product_service}</p>
                                </div>

                                {order.current_stage && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <ChevronRight className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span className="text-gray-700">
                                            <strong>Etapa Atual:</strong> {order.current_stage}
                                        </span>
                                    </div>
                                )}

                                {order.batch_number && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <ChevronRight className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                                        <span className="text-gray-700">
                                            <strong>Rastreabilidade:</strong> Lote #{order.batch_number}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Status Badge */}
                            <div className="mb-4">
                                {getStatusBadge(order.status)}
                            </div>

                            {/* Action Button */}
                            {order.status !== 'completed' && (
                                <button
                                    onClick={() => handleOpenUpdate(order)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors font-medium mb-3"
                                >
                                    <Edit className="w-4 h-4" />
                                    Registrar Execução
                                </button>
                            )}
                            {order.status !== 'completed' && (
                                <button
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setUpdateForm({
                                            status: order.status === 'scheduled' ? 'in_progress' :
                                                order.status === 'in_progress' ? 'quality_check' : 'completed',
                                            current_stage: order.current_stage || '',
                                            notes: order.notes || '',
                                            batch_number: order.batch_number || ''
                                        });
                                        setIsUpdateModalOpen(true);
                                    }}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    Concluir
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Nova Ordem */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Criar Nova Ordem de Produção/Serviço"
                subtitle="Planeje a execução controlada"
                size="lg"
            >
                <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código da Ordem (OP/OS) *
                        </label>
                        <input
                            type="text"
                            required
                            value={createForm.code}
                            onChange={e => setCreateForm({ ...createForm, code: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="Ex: 2024-050, OS-123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vincular com Pedido de Venda (Opcional)
                        </label>
                        <select
                            value={createForm.sales_order_id}
                            onChange={e => setCreateForm({ ...createForm, sales_order_id: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                        >
                            <option value="">Nenhum (produção interna)</option>
                            {salesOrders.map(so => (
                                <option key={so.id} value={so.id}>
                                    Pedido #{so.code} - {so.client_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição do Produto/Serviço *
                        </label>
                        <textarea
                            required
                            rows={2}
                            value={createForm.product_service}
                            onChange={e => setCreateForm({ ...createForm, product_service: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Ex: Instalação de Software de Gestão de Leitos"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data Prevista de Início
                        </label>
                        <input
                            type="date"
                            value={createForm.start_date}
                            onChange={e => setCreateForm({ ...createForm, start_date: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instruções de Trabalho (ISO 8.5.1)
                        </label>
                        <textarea
                            rows={3}
                            value={createForm.work_instructions}
                            onChange={e => setCreateForm({ ...createForm, work_instructions: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Como executar? Recursos necessários, procedimentos..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                        >
                            Criar Ordem
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Atualizar/Executar Ordem */}
            <Modal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                title="Registrar Execução"
                subtitle={selectedOrder ? `OP #${selectedOrder.code}` : ''}
                size="lg"
            >
                <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Produto/Serviço:</p>
                        <p className="font-medium text-gray-900">{selectedOrder?.product_service}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status da Ordem
                        </label>
                        <select
                            value={updateForm.status}
                            onChange={e => setUpdateForm({ ...updateForm, status: e.target.value as ProductionOrder['status'] })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                        >
                            <option value="scheduled">Agendado</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="quality_check">Verificação de Qualidade</option>
                            <option value="completed">Concluído</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Etapa Atual do Trabalho
                        </label>
                        <input
                            type="text"
                            value={updateForm.current_stage}
                            onChange={e => setUpdateForm({ ...updateForm, current_stage: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="Ex: Configuração do Servidor, Montagem Final..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas de Execução
                        </label>
                        <textarea
                            rows={3}
                            value={updateForm.notes}
                            onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Registre o que foi feito, observações, intercorrências..."
                        />
                    </div>

                    <div className={updateForm.status === 'completed' ? 'border-2 border-blue-500 rounded-lg p-4 bg-blue-50' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Rastreabilidade (Lote/Série/Versão)
                            {updateForm.status === 'completed' && (
                                <span className="text-red-600 ml-1">*</span>
                            )}
                        </label>
                        {updateForm.status === 'completed' && (
                            <div className="flex items-start gap-2 mb-2 text-sm text-blue-700">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>
                                    <strong>ISO 8.5.2:</strong> Identificação de rastreabilidade é obrigatória para concluir a ordem
                                </p>
                            </div>
                        )}
                        <input
                            type="text"
                            required={updateForm.status === 'completed'}
                            value={updateForm.batch_number}
                            onChange={e => setUpdateForm({ ...updateForm, batch_number: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="Ex: SW-992, Lote-2024-050, V1.2.3"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button
                            type="button"
                            onClick={() => setIsUpdateModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                        >
                            Salvar Registro
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
