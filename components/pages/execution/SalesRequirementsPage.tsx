import React, { useEffect, useState } from 'react';
import {
    Plus,
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    Package,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { SalesOrder } from '../../../types';
import { Modal } from '../../common/Modal';
import { PageHeader } from '../../common/PageHeader';
import { EmptyState } from '../../common/EmptyState';

export const SalesRequirementsPage: React.FC = () => {
    const { user, company } = useAuthContext();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

    // Form states
    const [createForm, setCreateForm] = useState({
        code: '',
        client_name: '',
        description: '',
        delivery_deadline: ''
    });

    const [reviewForm, setReviewForm] = useState({
        requirements_defined: false,
        has_capacity: false,
        risks_considered: false,
        review_notes: ''
    });

    useEffect(() => {
        fetchOrders();
    }, [user, company]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            if (!company) return;

            const { data, error } = await supabase
                .from('sales_orders_with_reviewer')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;

        try {
            const payload = {
                ...createForm,
                company_id: company.id,
                status: 'pending_review' as const
            };

            const { error } = await supabase
                .from('sales_orders')
                .insert([payload]);

            if (error) throw error;

            fetchOrders();
            setIsCreateModalOpen(false);
            resetCreateForm();
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            alert('Erro ao criar pedido');
        }
    };

    const handleOpenReview = (order: SalesOrder) => {
        setSelectedOrder(order);
        setReviewForm({
            requirements_defined: false,
            has_capacity: false,
            risks_considered: false,
            review_notes: ''
        });
        setIsReviewModalOpen(true);
    };

    const handleReview = async (approved: boolean) => {
        if (!selectedOrder || !user) return;

        try {
            const payload = {
                ...reviewForm,
                status: approved ? 'approved' : 'rejected',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('sales_orders')
                .update(payload)
                .eq('id', selectedOrder.id);

            if (error) throw error;

            fetchOrders();
            setIsReviewModalOpen(false);
            setSelectedOrder(null);
        } catch (error) {
            console.error('Erro ao salvar análise:', error);
            alert('Erro ao salvar análise');
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            code: '',
            client_name: '',
            description: '',
            delivery_deadline: ''
        });
    };

    const getStatusBadge = (status: SalesOrder['status']) => {
        switch (status) {
            case 'approved':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                        <CheckCircle className="w-4 h-4" />
                        APROVADO
                    </div>
                );
            case 'pending_review':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg font-semibold text-sm">
                        <Clock className="w-4 h-4" />
                        AGUARDANDO ANÁLISE
                    </div>
                );
            case 'rejected':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-semibold text-sm">
                        <XCircle className="w-4 h-4" />
                        REJEITADO
                    </div>
                );
            case 'delivered':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                        <Package className="w-4 h-4" />
                        ENTREGUE
                    </div>
                );
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const renderChecklistItem = (label: string, value: boolean | undefined) => {
        if (value === undefined) return null;
        return (
            <div className="flex items-start gap-2 text-sm text-gray-700">
                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                    {label} <strong>{value ? 'Sim.' : 'Não.'}</strong>
                </span>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                icon={FileText}
                title="Comercial e Requisitos de Clientes"
                subtitle="ISO 9001: 8.2 - Análise Crítica de Requisitos"
                iconColor="sky"
                action={
                    <button
                        onClick={() => {
                            resetCreateForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Pedido
                    </button>
                }
            />

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando pedidos...</p>
                </div>
            ) : orders.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Nenhum pedido cadastrado"
                    description="Comece registrando um novo pedido para análise crítica"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <div
                            key={order.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Header */}
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    PEDIDO #{order.code}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    <strong>CLIENTE:</strong> {order.client_name}
                                </p>
                            </div>

                            {/* Body */}
                            <div className="space-y-3 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Produto:</p>
                                    <p className="text-sm text-gray-900 line-clamp-2">{order.description}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Entrega: {formatDate(order.delivery_deadline)}</span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="mb-4">
                                {getStatusBadge(order.status)}
                            </div>

                            {/* Checklist (se aprovado/rejeitado) */}
                            {(order.status === 'approved' || order.status === 'rejected') && (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
                                    {renderChecklistItem('Requisitos definidos?', order.requirements_defined)}
                                    {renderChecklistItem('Capacidade técnica?', order.has_capacity)}
                                    {renderChecklistItem('Prazos viáveis?', order.risks_considered)}
                                </div>
                            )}

                            {/* Action Button */}
                            {order.status === 'pending_review' && (
                                <button
                                    onClick={() => handleOpenReview(order)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Realizar Análise
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Novo Pedido */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Registrar Novo Pedido"
                subtitle="Preencha as informações do pedido/contrato"
                size="lg"
            >
                <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número/Código do Pedido *
                        </label>
                        <input
                            type="text"
                            required
                            value={createForm.code}
                            onChange={e => setCreateForm({ ...createForm, code: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="Ex: 1024, PED-2025-001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Cliente *
                        </label>
                        <input
                            type="text"
                            required
                            value={createForm.client_name}
                            onChange={e => setCreateForm({ ...createForm, client_name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="Ex: Hospital São Luís"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição do Escopo/Produto *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={createForm.description}
                            onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Ex: Software de Gestão de Leitos"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prazo de Entrega *
                        </label>
                        <input
                            type="date"
                            required
                            value={createForm.delivery_deadline}
                            onChange={e => setCreateForm({ ...createForm, delivery_deadline: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
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
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                            Registrar Pedido
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Análise Crítica */}
            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title="Análise Crítica de Requisitos"
                subtitle={selectedOrder ? `Pedido #${selectedOrder.code} - ${selectedOrder.client_name}` : ''}
                size="lg"
            >
                <div className="p-6 space-y-6">
                    {/* Dados do Pedido */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="text-sm">
                            <span className="text-gray-600">Produto/Serviço:</span>
                            <p className="font-medium text-gray-900 mt-1">{selectedOrder?.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Entrega: {selectedOrder?.delivery_deadline && formatDate(selectedOrder.delivery_deadline)}</span>
                        </div>
                    </div>

                    {/* Checklist ISO 8.2.3 */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Checklist de Validação</h4>

                        <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={reviewForm.requirements_defined}
                                onChange={e => setReviewForm({ ...reviewForm, requirements_defined: e.target.checked })}
                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-900">Os requisitos estão claramente definidos?</span>
                                <p className="text-xs text-gray-500 mt-1">Especificações técnicas, quantidades, prazos estão documentados</p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={reviewForm.has_capacity}
                                onChange={e => setReviewForm({ ...reviewForm, has_capacity: e.target.checked })}
                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-900">A empresa tem capacidade de cumprir o prazo?</span>
                                <p className="text-xs text-gray-500 mt-1">Recursos, equipe e infraestrutura disponíveis</p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={reviewForm.risks_considered}
                                onChange={e => setReviewForm({ ...reviewForm, risks_considered: e.target.checked })}
                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-900">Riscos associados foram considerados?</span>
                                <p className="text-xs text-gray-500 mt-1">Complexidade técnica, dependências, limitações</p>
                            </div>
                        </label>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observações da Análise
                        </label>
                        <textarea
                            rows={3}
                            value={reviewForm.review_notes}
                            onChange={e => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Comentários adicionais sobre a análise..."
                        />
                    </div>

                    {/* Decisão Final */}
                    <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-3">Decisão Final</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleReview(false)}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                            >
                                <XCircle className="w-5 h-5" />
                                Rejeitar/Ajustar
                            </button>
                            <button
                                onClick={() => handleReview(true)}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Aprovar Pedido
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
