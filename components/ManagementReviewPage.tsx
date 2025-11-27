import React, { useEffect, useState } from 'react';
import {
    Plus,
    FileText,
    CheckCircle,
    Printer,
    Users,
    Calendar,
    ChevronRight,
    ChevronLeft,
    X,
    Edit
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Modal } from './Modal';
import { PageHeader } from './PageHeader';
import { EmptyState } from './EmptyState';

interface ManagementReview {
    id: string;
    company_id: string;
    date: string;
    period_analyzed: string;
    participants: string;
    inputs_json: {
        previous_actions: string;
        context_changes: string;
        customer_satisfaction: string;
        supplier_performance: string;
        audit_results: string;
        process_performance: string;
    };
    outputs_decisions: string;
    status: 'draft' | 'concluded';
    created_at: string;
    updated_at: string;
}

export const ManagementReviewPage: React.FC = () => {
    const { company } = useAuthContext();
    const [reviews, setReviews] = useState<ManagementReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewAtaModal, setViewAtaModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState<ManagementReview | null>(null);
    const [editingReview, setEditingReview] = useState<ManagementReview | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Form states
    const [form, setForm] = useState({
        date: '',
        period_analyzed: '',
        participants: '',
        inputs: {
            previous_actions: '',
            context_changes: '',
            customer_satisfaction: '',
            supplier_performance: '',
            audit_results: '',
            process_performance: ''
        },
        outputs_decisions: ''
    });

    useEffect(() => {
        fetchReviews();
    }, [company]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            if (!company) return;

            const { data, error } = await supabase
                .from('management_reviews')
                .select('*')
                .eq('company_id', company.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Erro ao carregar análises:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (review?: ManagementReview) => {
        if (review) {
            // Modo edição
            setEditingReview(review);
            setForm({
                date: review.date,
                period_analyzed: review.period_analyzed,
                participants: review.participants,
                inputs: review.inputs_json,
                outputs_decisions: review.outputs_decisions
            });
        } else {
            // Modo criação
            setEditingReview(null);
            resetForm();
        }
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleSaveStep = async () => {
        if (!company) return;

        // Se não for a última etapa, apenas avança
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
            return;
        }

        // Última etapa: salvar no banco
        try {
            const payload: any = {
                company_id: company.id,
                date: form.date,
                period_analyzed: form.period_analyzed,
                participants: form.participants,
                inputs_json: form.inputs,
                outputs_decisions: form.outputs_decisions,
                status: 'concluded'
            };

            if (editingReview) {
                // UPDATE - Editando ata existente
                const { error } = await supabase
                    .from('management_reviews')
                    .update(payload)
                    .eq('id', editingReview.id);

                if (error) throw error;
                alert('✅ Ata atualizada com sucesso!');
            } else {
                // INSERT - Criando nova ata
                const { error } = await supabase
                    .from('management_reviews')
                    .insert([payload])
                    .select();

                if (error) throw error;
                alert('✅ Ata gerada com sucesso!');
            }

            fetchReviews();
            setIsModalOpen(false);
            setEditingReview(null);
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar: ' + (error.message || JSON.stringify(error)));
        }
    };

    const handleViewAta = (review: ManagementReview) => {
        setSelectedReview(review);
        setViewAtaModal(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const resetForm = () => {
        setForm({
            date: '',
            period_analyzed: '',
            participants: '',
            inputs: {
                previous_actions: '',
                context_changes: '',
                customer_satisfaction: '',
                supplier_performance: '',
                audit_results: '',
                process_performance: ''
            },
            outputs_decisions: ''
        });
    };

    const getStatusBadge = (status: ManagementReview['status']) => {
        return status === 'concluded' ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> CONCLUÍDA
            </span>
        ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                RASCUNHO
            </span>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                icon={FileText}
                title="Análise Crítica pela Direção"
                subtitle="ISO 9001: 9.3 - Reuniões de Análise do SGQ"
                action={
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Ata
                    </button>
                }
            />

            {/* Lista de Reuniões */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando análises...</p>
                </div>
            ) : reviews.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Nenhuma análise crítica registrada"
                    description="Inicie uma nova reunião de análise crítica pela direção"
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <h3 className="text-lg font-bold text-gray-900">
                                            REUNIÃO {review.period_analyzed || new Date(review.date).getFullYear()}
                                        </h3>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600">
                                            <strong>Data:</strong> {new Date(review.date).toLocaleDateString('pt-BR')}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-start gap-2">
                                            <strong className="flex items-center gap-1">
                                                <Users className="w-4 h-4" /> Participantes:
                                            </strong>
                                            {review.participants}
                                        </p>
                                        {review.status === 'concluded' && review.outputs_decisions && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-gray-700">
                                                    <strong>Resumo das Decisões:</strong>
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {review.outputs_decisions}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(review.status)}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(review)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleViewAta(review)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Visualizar Ata
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Criação - Wizard */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingReview(null); }}
                title={`${editingReview ? 'Editar' : 'Nova'} Análise Crítica - Etapa ${currentStep} de 3`}
                subtitle={['Setup da Reunião', 'Entradas Obrigatórias (ISO 9.3.2)', 'Saídas e Decisões (ISO 9.3.3)'][currentStep - 1]}
                size="xl"
            >
                <div className="p-6">
                    {/* Passo 1: Setup */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Reunião *</label>
                                <input
                                    type="date"
                                    required
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Período Analisado *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.period_analyzed}
                                    onChange={e => setForm({ ...form, period_analyzed: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    placeholder="Ex: Jan/2024 a Dez/2024"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Participantes *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={form.participants}
                                    onChange={e => setForm({ ...form, participants: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Ex: Diretoria, Gerente da Qualidade, RH"
                                />
                            </div>
                        </div>
                    )}

                    {/* Passo 2: Entradas */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ☑ Status de ações de reuniões anteriores
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.inputs.previous_actions}
                                    onChange={e => setForm({ ...form, inputs: { ...form.inputs, previous_actions: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Descreva o que foi decidido anteriormente e se foi implementado..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ☑ Mudanças em questões externas e internas (Contexto)
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.inputs.context_changes}
                                    onChange={e => setForm({ ...form, inputs: { ...form.inputs, context_changes: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Mudanças no mercado, legislação, tecnologia..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ☑ Satisfação do cliente e feedback
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.inputs.customer_satisfaction}
                                    onChange={e => setForm({ ...form, inputs: { ...form.inputs, customer_satisfaction: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Pesquisas de satisfação, reclamações, elogios..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ☑ Desempenho de provedores externos (Fornecedores)
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.inputs.supplier_performance}
                                    onChange={e => setForm({ ...form, inputs: { ...form.inputs, supplier_performance: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Avaliação dos fornecedores, qualidade, prazos..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ☑ Resultados de auditorias
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.inputs.audit_results}
                                    onChange={e => setForm({ ...form, inputs: { ...form.inputs, audit_results: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Auditorias internas e externas, não conformidades..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ☑ Desempenho dos processos e produtos (KPIs)
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.inputs.process_performance}
                                    onChange={e => setForm({ ...form, inputs: { ...form.inputs, process_performance: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Indicadores, metas alcançadas, produtividade..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Passo 3: Saídas */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>📋 Saídas Obrigatórias (ISO 9.3.3):</strong> Documente as decisões da reunião sobre melhorias, mudanças no SGQ e recursos necessários.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Decisões e Ações (Oportunidades de melhoria, mudanças no SGQ, recursos necessários) *
                                </label>
                                <textarea
                                    required
                                    rows={12}
                                    value={form.outputs_decisions}
                                    onChange={e => setForm({ ...form, outputs_decisions: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none font-mono text-sm"
                                    placeholder={`Exemplo:

OPORTUNIDADES DE MELHORIA:
- Implementar sistema de gestão de documentos digital
- Melhorar processo de onboarding de colaboradores

MUDANÇAS NO SGQ:
- Atualizar procedimento de controle de documentos
- Revisar política da qualidade

RECURSOS NECESSÁRIOS:
- Contratação: 2 vendedores (R$ 6.000/mês)
- Investimento: Novo servidor (R$ 15.000)
- Treinamento: Curso de auditoria interna para 3 colaboradores`}
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
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                        >
                            {currentStep === 3 ? '✅ Concluir e Gerar Ata' : 'Próximo'}
                            {currentStep !== 3 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Visualização da Ata */}
            <Modal
                isOpen={viewAtaModal}
                onClose={() => setViewAtaModal(false)}
                title="Ata de Análise Crítica pela Direção"
                size="xl"
            >
                {selectedReview && (
                    <div className="p-8 bg-white" style={{ fontFamily: 'serif' }}>
                        {/* Cabeçalho da Ata */}
                        <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                ATA DE ANÁLISE CRÍTICA PELA DIREÇÃO
                            </h1>
                            <p className="text-sm text-gray-600">ISO 9001:2015 - Requisito 9.3</p>
                            <p className="text-sm text-gray-600 mt-2">
                                Período: {selectedReview.period_analyzed} | Data: {new Date(selectedReview.date).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        {/* Participantes */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">PARTICIPANTES</h3>
                            <p className="text-gray-700">{selectedReview.participants}</p>
                        </div>

                        {/* Entradas */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">ENTRADAS DA ANÁLISE CRÍTICA (ISO 9.3.2)</h3>

                            {selectedReview.inputs_json?.previous_actions && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-1">1. Status de ações de reuniões anteriores</h4>
                                    <p className="text-gray-700 pl-4">{selectedReview.inputs_json.previous_actions}</p>
                                </div>
                            )}

                            {selectedReview.inputs_json?.context_changes && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-1">2. Mudanças em questões externas e internas</h4>
                                    <p className="text-gray-700 pl-4">{selectedReview.inputs_json.context_changes}</p>
                                </div>
                            )}

                            {selectedReview.inputs_json?.customer_satisfaction && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-1">3. Satisfação do cliente e feedback</h4>
                                    <p className="text-gray-700 pl-4">{selectedReview.inputs_json.customer_satisfaction}</p>
                                </div>
                            )}

                            {selectedReview.inputs_json?.supplier_performance && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-1">4. Desempenho de provedores externos</h4>
                                    <p className="text-gray-700 pl-4">{selectedReview.inputs_json.supplier_performance}</p>
                                </div>
                            )}

                            {selectedReview.inputs_json?.audit_results && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-1">5. Resultados de auditorias</h4>
                                    <p className="text-gray-700 pl-4">{selectedReview.inputs_json.audit_results}</p>
                                </div>
                            )}

                            {selectedReview.inputs_json?.process_performance && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-1">6. Desempenho dos processos e produtos</h4>
                                    <p className="text-gray-700 pl-4">{selectedReview.inputs_json.process_performance}</p>
                                </div>
                            )}
                        </div>

                        {/* Saídas */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">SAÍDAS DA ANÁLISE CRÍTICA (ISO 9.3.3)</h3>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.outputs_decisions}</p>
                            </div>
                        </div>

                        {/* Assinaturas */}
                        <div className="mt-12 pt-6 border-t border-gray-300">
                            <p className="text-sm text-gray-600 text-center">
                                Esta ata foi gerada eletronicamente em {new Date(selectedReview.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedReview.created_at).toLocaleTimeString('pt-BR')}
                            </p>
                        </div>

                        {/* Botão Imprimir */}
                        <div className="mt-6 text-center print:hidden">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimir Ata
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
