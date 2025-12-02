import React, { useEffect, useState } from 'react';
import {
    Plus,
    AlertTriangle,
    Package,
    Users,
    Wrench,
    Trash2,
    ArrowRight,
    Upload,
    ExternalLink,
    X,
    Calendar,
    User,
    FileText,
    Printer
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { NonConformityProduct } from '../../../types';
import { Modal } from '../../common/Modal';
import { PageHeader } from '../../common/PageHeader';
import { EmptyState } from '../../common/EmptyState';

export const NonConformityPage: React.FC = () => {
    const { user, company } = useAuthContext();
    const [ncProducts, setNcProducts] = useState<NonConformityProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDispositionModalOpen, setIsDispositionModalOpen] = useState(false);
    const [viewReportModal, setViewReportModal] = useState(false);
    const [selectedNC, setSelectedNC] = useState<NonConformityProduct | null>(null);
    const [selectedNCForReport, setSelectedNCForReport] = useState<NonConformityProduct | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [createForm, setCreateForm] = useState({
        description: '',
        date_occurred: new Date().toISOString().split('T')[0],
        origin: 'Produção' as NonConformityProduct['origin'],
        severity: 'Média' as NonConformityProduct['severity'],
        quantity_affected: 0,
        responsible_id: user?.id || ''
    });

    const [dispositionForm, setDispositionForm] = useState({
        disposition: 'Retrabalho' as NonConformityProduct['disposition'],
        disposition_justification: '',
        authorized_by: ''
    });

    useEffect(() => {
        fetchNonConformities();
    }, [user, company]);

    const fetchNonConformities = async () => {
        try {
            setLoading(true);
            if (!company) return;

            const { data, error } = await supabase
                .from('non_conformities_with_responsible')
                .select('*')
                .eq('company_id', company.id)
                .order('date_occurred', { ascending: false });

            if (error) throw error;
            setNcProducts(data || []);
        } catch (error) {
            console.error('Erro ao carregar não conformidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNC = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;

        try {
            let photoUrl = '';

            // Upload photo if exists
            if (photoFile) {
                setUploading(true);
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${company.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('nc_photos')
                    .upload(filePath, photoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('nc_photos')
                    .getPublicUrl(filePath);

                photoUrl = publicUrl;
            }

            const payload = {
                ...createForm,
                company_id: company.id,
                photo_url: photoUrl || null,
                status: 'open' as const
            };

            const { error } = await supabase
                .from('non_conformities_products')
                .insert([payload]);

            if (error) throw error;

            fetchNonConformities();
            setIsCreateModalOpen(false);
            resetCreateForm();
        } catch (error) {
            console.error('Erro ao criar não conformidade:', error);
            alert('Erro ao criar registro');
        } finally {
            setUploading(false);
        }
    };

    const handleApplyDisposition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNC) return;

        try {
            const { error } = await supabase
                .from('non_conformities_products')
                .update({
                    ...dispositionForm,
                    status: 'resolved'
                })
                .eq('id', selectedNC.id);

            if (error) throw error;

            fetchNonConformities();
            setIsDispositionModalOpen(false);
            setSelectedNC(null);
        } catch (error) {
            console.error('Erro ao aplicar disposição:', error);
            alert('Erro ao salvar disposição');
        }
    };

    const handleMoveToNext = async (nc: NonConformityProduct) => {
        const nextStatus = nc.status === 'open' ? 'analyzing' : 'resolved';

        // Se mover para "resolved", abrir modal de disposição
        if (nextStatus === 'resolved') {
            setSelectedNC(nc);
            setDispositionForm({
                disposition: 'Retrabalho',
                disposition_justification: '',
                authorized_by: ''
            });
            setIsDispositionModalOpen(true);
            return;
        }

        try {
            const { error } = await supabase
                .from('non_conformities_products')
                .update({ status: nextStatus })
                .eq('id', nc.id);

            if (error) throw error;
            fetchNonConformities();
        } catch (error) {
            console.error('Erro ao mover RNC:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta RNC?')) return;

        try {
            const { error } = await supabase
                .from('non_conformities_products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchNonConformities();
        } catch (error) {
            console.error('Erro ao excluir RNC:', error);
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            description: '',
            date_occurred: new Date().toISOString().split('T')[0],
            origin: 'Produção',
            severity: 'Média',
            quantity_affected: 0,
            responsible_id: user?.id || ''
        });
        setPhotoFile(null);
    };

    const handlePrintReport = (nc: NonConformityProduct) => {
        setSelectedNCForReport(nc);
        setViewReportModal(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const getOriginIcon = (origin: string) => {
        switch (origin) {
            case 'Produção':
                return <Package className="w-4 h-4" />;
            case 'Fornecedor':
                return <Wrench className="w-4 h-4" />;
            case 'Cliente/Reclamação':
                return <Users className="w-4 h-4" />;
            default:
                return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Crítica':
                return 'border-red-500';
            case 'Média':
                return 'border-yellow-500';
            case 'Baixa':
                return 'border-green-500';
            default:
                return 'border-gray-300';
        }
    };

    const getDispositionBadge = (disposition?: string) => {
        if (!disposition) return null;

        const badges = {
            'Retrabalho': { icon: '🛠️', color: 'bg-blue-100 text-blue-700' },
            'Refugo': { icon: '🗑️', color: 'bg-red-100 text-red-700' },
            'Concessão/Aceite': { icon: '✅', color: 'bg-green-100 text-green-700' },
            'Devolução': { icon: '🔄', color: 'bg-purple-100 text-purple-700' }
        };

        const badge = badges[disposition as keyof typeof badges];
        if (!badge) return null;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                <span>{badge.icon}</span>
                {disposition}
            </span>
        );
    };

    const renderColumn = (status: NonConformityProduct['status'], title: string, icon: React.ReactNode) => {
        const items = ncProducts.filter(nc => nc.status === status);

        return (
            <div className="flex-1 min-w-[320px]">
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {icon}
                            <h3 className="font-semibold text-gray-900">{title}</h3>
                        </div>
                        <span className="bg-white px-2.5 py-1 rounded-full text-sm font-bold text-gray-700">
                            {items.length}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {items.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                            <p className="text-gray-400 text-sm">Nenhuma RNC neste estágio</p>
                        </div>
                    ) : (
                        items.map(nc => (
                            <div
                                key={nc.id}
                                className={`bg-white rounded-lg p-4 border-l-4 ${getSeverityColor(nc.severity)} shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                            {nc.description}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                {getOriginIcon(nc.origin)}
                                                {nc.origin}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${nc.severity === 'Crítica' ? 'bg-red-100 text-red-700' :
                                                nc.severity === 'Média' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {nc.severity}
                                            </span>
                                            {nc.disposition && getDispositionBadge(nc.disposition)}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(nc.date_occurred).toLocaleDateString('pt-BR')}
                                            </span>
                                            {nc.quantity_affected && (
                                                <span>Qtd: {nc.quantity_affected}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    {status !== 'resolved' && (
                                        <button
                                            onClick={() => handleMoveToNext(nc)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {status === 'open' ? 'Analisar' : 'Tratar'}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    {nc.photo_url && (
                                        <a
                                            href={nc.photo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Ver evidência"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleDelete(nc.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <PageHeader
                icon={AlertTriangle}
                title="Controle de Saídas Não Conformes"
                subtitle="ISO 9001:2015 - 8.7 - Gestão de produtos/serviços defeituosos"
                iconColor="indigo"
                action={
                    <button
                        onClick={() => {
                            resetCreateForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nova RNC
                    </button>
                }
            />

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-4">
                {renderColumn('open', 'Identificada', <AlertTriangle className="w-5 h-5 text-red-600" />)}
                {renderColumn('analyzing', 'Em Análise', <FileText className="w-5 h-5 text-yellow-600" />)}
                {renderColumn('resolved', 'Tratada/Encerrada', <Package className="w-5 h-5 text-green-600" />)}
            </div>

            {/* Modal: Nova RNC */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Registrar Nova Não Conformidade"
                subtitle="Preencha as informações sobre o problema identificado"
                size="lg"
            >
                <form onSubmit={handleCreateNC} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            O que aconteceu? (Descrição do defeito) *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={createForm.description}
                            onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Ex: Peças com acabamento irregular, arranhões visíveis..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Onde foi detectado? *</label>
                            <select
                                value={createForm.origin}
                                onChange={e => setCreateForm({ ...createForm, origin: e.target.value as NonConformityProduct['origin'] })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                            >
                                <option value="Produção">Produção</option>
                                <option value="Fornecedor">Fornecedor</option>
                                <option value="Cliente/Reclamação">Cliente/Reclamação</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Severidade *</label>
                            <select
                                value={createForm.severity}
                                onChange={e => setCreateForm({ ...createForm, severity: e.target.value as NonConformityProduct['severity'] })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                            >
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Crítica">Crítica</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data de Ocorrência *</label>
                            <input
                                type="date"
                                required
                                value={createForm.date_occurred}
                                onChange={e => setCreateForm({ ...createForm, date_occurred: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade Afetada</label>
                            <input
                                type="number"
                                min="0"
                                value={createForm.quantity_affected}
                                onChange={e => setCreateForm({ ...createForm, quantity_affected: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                placeholder="Ex: 50 peças"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Foto de Evidência (Opcional)
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                                <Upload className="w-4 h-4" />
                                Escolher Arquivo
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </label>
                            {photoFile && (
                                <span className="text-sm text-gray-600">{photoFile.name}</span>
                            )}
                        </div>
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
                            disabled={uploading}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                        >
                            {uploading ? 'Enviando...' : 'Registrar RNC'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Disposição/Tratamento */}
            <Modal
                isOpen={isDispositionModalOpen}
                onClose={() => setIsDispositionModalOpen(false)}
                title="Aplicar Disposição"
                subtitle={selectedNC?.description || ''}
                size="lg"
            >
                <form onSubmit={handleApplyDisposition} className="p-6 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Origem:</span>
                            <span className="font-medium">{selectedNC?.origin}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Severidade:</span>
                            <span className="font-medium">{selectedNC?.severity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Data:</span>
                            <span className="font-medium">
                                {selectedNC?.date_occurred && new Date(selectedNC.date_occurred).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Decisão de Disposição *
                        </label>
                        <select
                            required
                            value={dispositionForm.disposition}
                            onChange={e => setDispositionForm({ ...dispositionForm, disposition: e.target.value as NonConformityProduct['disposition'] })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                        >
                            <option value="Retrabalho">🛠️ Retrabalho (Consertar)</option>
                            <option value="Refugo">🗑️ Refugo (Descarte/Lixo)</option>
                            <option value="Concessão/Aceite">✅ Concessão (Cliente aceitou)</option>
                            <option value="Devolução">🔄 Devolução ao Fornecedor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Justificativa *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={dispositionForm.disposition_justification}
                            onChange={e => setDispositionForm({ ...dispositionForm, disposition_justification: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Explique o motivo da decisão..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Autorizado por *
                        </label>
                        <input
                            type="text"
                            required
                            value={dispositionForm.authorized_by}
                            onChange={e => setDispositionForm({ ...dispositionForm, authorized_by: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="Nome da autoridade que aprovou"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button
                            type="button"
                            onClick={() => setIsDispositionModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                        >
                            Aplicar Disposição
                        </button>
                    </div>
                </form>
            </Modal>
            {/* Modal: Relatório de RNC */}
            <Modal
                isOpen={viewReportModal}
                onClose={() => setViewReportModal(false)}
                title="Relatório de Não Conformidade"
                size="xl"
            >
                {selectedNCForReport && (
                    <div className="print-area p-8 bg-white" style={{ fontFamily: 'serif' }}>
                        {/* Cabeçalho */}
                        <div className="flex justify-between items-center border-b-2 border-gray-300 pb-6 mb-6">
                            <div className="flex items-center gap-4">
                                {company?.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
                                ) : (
                                    <div className="h-16 w-16 bg-gray-100 flex items-center justify-center rounded text-gray-400 text-xs">
                                        Sem Logo
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 uppercase">{company?.name || 'Empresa'}</h1>
                                    <p className="text-sm text-gray-600">Relatório de Não Conformidade (RNC)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">RNC #{selectedNCForReport.code || selectedNCForReport.id.slice(0, 6)}</p>
                                <p className="text-sm text-gray-600">{new Date(selectedNCForReport.date_occurred).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        {/* Detalhes */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase mb-2 border-b border-gray-200 pb-1">1. Detalhes da Ocorrência</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Origem</p>
                                    <p className="text-sm font-medium">{selectedNCForReport.origin}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Severidade</p>
                                    <p className="text-sm font-medium">{selectedNCForReport.severity}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Quantidade Afetada</p>
                                    <p className="text-sm font-medium">{selectedNCForReport.quantity_affected || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Status Atual</p>
                                    <p className="text-sm font-medium uppercase">{selectedNCForReport.status}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Descrição do Problema</p>
                                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 mt-1">
                                    {selectedNCForReport.description}
                                </p>
                            </div>
                        </div>

                        {/* Disposição */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase mb-2 border-b border-gray-200 pb-1">2. Tratamento / Disposição</h3>
                            {selectedNCForReport.status === 'resolved' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Ação Tomada</p>
                                            <p className="text-sm font-medium">{selectedNCForReport.disposition}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Autorizado Por</p>
                                            <p className="text-sm font-medium">{selectedNCForReport.authorized_by || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Justificativa</p>
                                        <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-100 mt-1">
                                            {selectedNCForReport.disposition_justification}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Ainda não foi aplicada uma disposição final.</p>
                            )}
                        </div>

                        {/* Assinaturas */}
                        <div className="grid grid-cols-2 gap-12 mt-16 pt-8">
                            <div className="text-center border-t border-gray-400 pt-2">
                                <p className="text-sm font-medium text-gray-900">Responsável pela Emissão</p>
                                <p className="text-xs text-gray-500">Data: ___/___/______</p>
                            </div>
                            <div className="text-center border-t border-gray-400 pt-2">
                                <p className="text-sm font-medium text-gray-900">Aprovação da Qualidade</p>
                                <p className="text-xs text-gray-500">Data: ___/___/______</p>
                            </div>
                        </div>

                        {/* Botão Imprimir */}
                        <div className="mt-8 text-center no-print">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto shadow-sm"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimir Relatório
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
