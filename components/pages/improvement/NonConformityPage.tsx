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
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useAuditor } from '../../../contexts/AuditorContext';
import { NonConformityProduct } from '../../../types';
import { Modal } from '../../common/Modal';
import { PageHeader } from '../../common/PageHeader';
import { EmptyState } from '../../common/EmptyState';
import { ConfirmModal } from '../../common/ConfirmModal';

export const NonConformityPage: React.FC = () => {
    const { user, company } = useAuthContext();
    const { effectiveCompanyId, isAuditorMode } = useAuditor();
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

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        fetchNonConformities();
    }, [user, company]);

    const fetchNonConformities = async () => {
        try {
            setLoading(true);
            if (!effectiveCompanyId) return;

            const { data, error } = await supabase
                .from('non_conformities_with_responsible')
                .select('id, description, origin, severity, quantity_affected, status, disposition, disposition_justification, authorized_by, photo_url, date_occurred, created_at, responsible_id, responsible_name, company_id')
                .eq('company_id', effectiveCompanyId)
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
        if (!effectiveCompanyId || isAuditorMode) return;

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
                company_id: effectiveCompanyId,
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
            toast.error('Erro ao criar registro');
        } finally {
            setUploading(false);
        }
    };

    const handleApplyDisposition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!effectiveCompanyId || isAuditorMode) return;

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
            toast.error('Erro ao salvar disposição');
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
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;

        try {
            const { error } = await supabase
                .from('non_conformities_products')
                .delete()
                .eq('id', deleteModal.id);

            if (error) throw error;
            fetchNonConformities();
            toast.success('Não Conformidade excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir RNC:', error);
            toast.error('Erro ao excluir Não Conformidade');
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
                            <p className="text-gray-400 text-sm">Nenhuma Não Conformidade neste estágio</p>
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
                                    {!isAuditorMode && status !== 'resolved' && (
                                        <button
                                            onClick={() => handleMoveToNext(nc)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#025159] text-white text-sm font-medium rounded-lg hover:bg-[#3F858C] transition-colors"
                                        >
                                            {status === 'open' ? 'Analisar' : 'Tratar'}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handlePrintReport(nc)}
                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="Imprimir Não Conformidade"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
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
                                    {!isAuditorMode && (
                                        <button
                                            onClick={() => handleDelete(nc.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
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
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Excluir Não Conformidade"
                message="Tem certeza que deseja excluir esta Não Conformidade?"
                confirmLabel="Excluir"
                variant="danger"
            />

            <PageHeader
                icon={AlertTriangle}
                title="Controle de Saídas Não Conformes"
                subtitle="ISO 9001:2015 - 8.7 - Gestão de produtos/serviços defeituosos"
                iconColor="indigo"
                action={!isAuditorMode && (
                    <button
                        onClick={() => {
                            resetCreateForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Não Conformidade
                    </button>
                )}
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
                            disabled={isAuditorMode}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Ex: Peças com acabamento irregular, arranhões visíveis..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Onde foi detectado? *</label>
                            <select
                                value={createForm.origin}
                                onChange={e => setCreateForm({ ...createForm, origin: e.target.value as NonConformityProduct['origin'] })}
                                disabled={isAuditorMode}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-500"
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
                                disabled={isAuditorMode}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-500"
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
                                disabled={isAuditorMode}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade Afetada</label>
                            <input
                                type="number"
                                min="0"
                                value={createForm.quantity_affected}
                                onChange={e => setCreateForm({ ...createForm, quantity_affected: parseInt(e.target.value) })}
                                disabled={isAuditorMode}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                                placeholder="Ex: 50 peças"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Foto de Evidência (Opcional)
                        </label>
                        <div className="flex items-center gap-3">
                            <label className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ${isAuditorMode ? 'cursor-default opacity-50' : 'cursor-pointer'}`}>
                                <Upload className="w-4 h-4" />
                                Escolher Arquivo
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={e => !isAuditorMode && setPhotoFile(e.target.files?.[0] || null)}
                                    disabled={isAuditorMode}
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
                            {uploading ? 'Enviando...' : 'Registrar Não Conformidade'}
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
                            disabled={isAuditorMode}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-500"
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
                            disabled={isAuditorMode}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
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
                            disabled={isAuditorMode}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-50 disabled:text-gray-500"
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
                        {!isAuditorMode && (
                            <button
                                type="submit"
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                            >
                                Aplicar Disposição
                            </button>
                        )}
                        {isAuditorMode && (
                            <button
                                type="button"
                                onClick={() => setIsDispositionModalOpen(false)}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
                            >
                                Fechar
                            </button>
                        )}
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
                    <div className="print-area bg-white" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '11pt' }}>
                        {/* Cabeçalho Profissional */}
                        <div className="border-b-2 border-gray-900 pb-4 mb-6">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {company?.logo_url ? (
                                        <img
                                            src={company.logo_url}
                                            alt="Logo Empresa"
                                            className="h-14 w-auto object-contain"
                                            style={{ display: 'block', maxWidth: '100px', height: 'auto' }}
                                            crossOrigin="anonymous"
                                            onError={(e) => { console.error('Erro ao carregar logo:', e); e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="h-14 w-14 bg-gray-300 flex items-center justify-center rounded text-gray-600 text-xs font-bold">
                                            LOGO
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-base font-bold text-gray-900 uppercase">{company?.name || 'Empresa'}</h1>
                                        <p className="text-xs text-gray-700">CNPJ: {company?.cnpj || '_______________'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-900">RELATÓRIO DE NÃO CONFORMIDADE</p>
                                    <p className="text-xs text-gray-700">ISO 9001:2015 - 8.7</p>
                                </div>
                            </div>
                            <div className="text-center pt-2">
                                <p className="text-sm font-bold text-gray-900">NÃO CONFORMIDADE Nº {selectedNCForReport.id.slice(0, 6).toUpperCase()}</p>
                            </div>
                        </div>

                        {/* Seção 1: Identificação */}
                        <div className="mb-5">
                            <h3 className="text-xs font-bold text-gray-900 uppercase mb-2 pb-1 border-b border-gray-900">1. IDENTIFICAÇÃO DA OCORRÊNCIA</h3>
                            <table className="w-full text-xs border-collapse border border-gray-900 mb-3">
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-900 p-2 font-bold bg-gray-100 w-1/4">Data de Ocorrência:</td>
                                        <td className="border border-gray-900 p-2">{new Date(selectedNCForReport.date_occurred).toLocaleDateString('pt-BR')}</td>
                                        <td className="border border-gray-900 p-2 font-bold bg-gray-100 w-1/4">Origem:</td>
                                        <td className="border border-gray-900 p-2">{selectedNCForReport.origin}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-900 p-2 font-bold bg-gray-100">Severidade:</td>
                                        <td className="border border-gray-900 p-2">{selectedNCForReport.severity}</td>
                                        <td className="border border-gray-900 p-2 font-bold bg-gray-100">Quantidade Afetada:</td>
                                        <td className="border border-gray-900 p-2">{selectedNCForReport.quantity_affected || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-900 p-2 font-bold bg-gray-100">Status:</td>
                                        <td colSpan={3} className="border border-gray-900 p-2 uppercase">{selectedNCForReport.status}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div>
                                <p className="text-xs font-bold text-gray-900 mb-1">DESCRIÇÃO DO PROBLEMA:</p>
                                <p className="text-xs text-gray-800 border border-gray-900 p-3 bg-white min-h-12">
                                    {selectedNCForReport.description}
                                </p>
                            </div>
                        </div>

                        {/* Seção 2: Tratamento/Disposição */}
                        <div className="mb-5">
                            <h3 className="text-xs font-bold text-gray-900 uppercase mb-2 pb-1 border-b border-gray-900">2. TRATAMENTO / DISPOSIÇÃO</h3>
                            {selectedNCForReport.status === 'resolved' ? (
                                <table className="w-full text-xs border-collapse border border-gray-900">
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-900 p-2 font-bold bg-gray-100 w-1/2">Ação Tomada (Disposição):</td>
                                            <td className="border border-gray-900 p-2">{selectedNCForReport.disposition}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-900 p-2 font-bold bg-gray-100">Autorizado Por:</td>
                                            <td className="border border-gray-900 p-2">{selectedNCForReport.authorized_by || '_______________'}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="border border-gray-900 p-2">
                                                <p className="text-xs font-bold mb-1">Justificativa / Observações:</p>
                                                <p className="text-xs text-gray-800">{selectedNCForReport.disposition_justification || '—'}</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-xs text-gray-600 italic border border-gray-900 p-3 bg-gray-50">
                                    Ainda não foi aplicada uma disposição final.
                                </p>
                            )}
                        </div>

                        {/* Seção 3: Assinaturas */}
                        <div className="mt-8 pt-4">
                            <h3 className="text-xs font-bold text-gray-900 uppercase mb-6 pb-1 border-b border-gray-900">3. APROVAÇÕES E ASSINATURAS</h3>
                            <table className="w-full text-xs border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="text-center p-4 border-t-2 border-gray-900 w-1/2">
                                            <p className="text-xs font-bold text-gray-900 mt-1">Responsável pela Ocorrência</p>
                                            <p className="text-xs text-gray-700">Data: ___/___/______</p>
                                        </td>
                                        <td className="text-center p-4 border-t-2 border-gray-900 w-1/2">
                                            <p className="text-xs font-bold text-gray-900 mt-1">Aprovação da Qualidade</p>
                                            <p className="text-xs text-gray-700">Data: ___/___/______</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Rodapé */}
                        <div className="mt-8 text-center border-t-2 border-gray-300 pt-3">
                            <p className="text-xs text-gray-600">Documento gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>

                        {/* Botão Imprimir */}
                        <div className="mt-6 text-center no-print">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-3 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors mx-auto shadow-sm font-medium"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimir Relatório (PDF)
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
