import React, { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle2,
    XCircle,
    MinusCircle,
    ArrowLeft,
    Camera,
    Upload,
    AlertTriangle,
    ClipboardCheck,
    ChevronDown,
    ChevronUp,
    Save,
    Loader2,
    HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import {
    Audit,
    AuditChecklistItem,
    AuditChecklistResponse,
    AuditResponseStatus
} from '../../../types';

interface AuditChecklistProps {
    audit?: Audit;
    assignmentId?: string;
    onClose: () => void;
    onComplete?: () => void;
}

interface GroupedItems {
    [category: string]: AuditChecklistItem[];
}

export const AuditChecklist: React.FC<AuditChecklistProps> = ({ audit, assignmentId, onClose, onComplete }) => {
    const { user } = useAuthContext();
    const [items, setItems] = useState<AuditChecklistItem[]>([]);
    const [responses, setResponses] = useState<Map<string, AuditChecklistResponse>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [evidenceModal, setEvidenceModal] = useState<{
        isOpen: boolean;
        itemId: string;
        item?: AuditChecklistItem;
    }>({ isOpen: false, itemId: '' });
    const [qmsScope, setQmsScope] = useState<string | null>(null);

    // Carregar itens do checklist e respostas existentes
    useEffect(() => {
        if (audit?.template_id) {
            fetchChecklistData(audit.template_id, audit.id, audit.company_id);
        } else if (assignmentId) {
            fetchAssignmentData();
        } else {
            setLoading(false);
            toast.warning('Esta auditoria não possui um template de checklist vinculado.');
        }
    }, [audit, assignmentId]);

    const fetchAssignmentData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_assignments')
                .select('template_id, company_id')
                .eq('id', assignmentId)
                .single();

            if (error) throw error;
            if (data.template_id) {
                await fetchChecklistData(data.template_id, assignmentId, data.company_id);
            } else {
                toast.warning('Esta designação não possui um template de checklist vinculado.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Erro ao buscar assignment:', error);
            setLoading(false);
        }
    };

    const fetchChecklistData = async (templateId: string, currentAuditId: string, companyId: string) => {
        try {
            setLoading(true);

            // Buscar itens do template
            const { data: itemsData, error: itemsError } = await supabase
                .from('audit_checklist_items')
                .select('id, category, question, iso_clause, help_text, order_index, is_required, template_id')
                .eq('template_id', templateId)
                .order('order_index', { ascending: true });

            if (itemsError) throw itemsError;
            setItems(itemsData || []);

            // Expandir todas as categorias por padrão
            const categories = new Set(itemsData?.map(item => item.category || 'Geral') || []);
            setExpandedCategories(categories);

            // Buscar respostas existentes
            const { data: responsesData, error: responsesError } = await supabase
                .from('audit_checklist_responses')
                .select('id, item_id, status, evidence_text, evidence_url, verified_by, verified_at, audit_id')
                .eq('audit_id', currentAuditId);

            if (responsesError) throw responsesError;

            // Mapear respostas por item_id
            const responsesMap = new Map<string, AuditChecklistResponse>();
            responsesData?.forEach(response => {
                responsesMap.set(response.item_id, response);
            });
            setResponses(responsesMap);

            // Buscar escopo do SGQ para referência
            const { data: qmsData } = await supabase
                .from('quality_manual')
                .select('scope')
                .eq('company_id', companyId)
                .maybeSingle();

            if (qmsData) setQmsScope(qmsData.scope);

        } catch (error) {
            console.error('Erro ao carregar checklist:', error);
            toast.error('Erro ao carregar checklist da auditoria');
        } finally {
            setLoading(false);
        }
    };

    // Agrupar itens por categoria
    const groupedItems = useMemo<GroupedItems>(() => {
        return items.reduce((acc, item) => {
            const category = item.category || 'Geral';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as GroupedItems);
    }, [items]);

    // Estatísticas de progresso
    const stats = useMemo(() => {
        const total = items.length;
        const answered = responses.size;
        const compliant = Array.from(responses.values()).filter(r => r.status === 'compliant').length;
        const nonCompliant = Array.from(responses.values()).filter(r => r.status === 'non_compliant').length;
        const notApplicable = Array.from(responses.values()).filter(r => r.status === 'not_applicable').length;
        const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

        return { total, answered, compliant, nonCompliant, notApplicable, progress };
    }, [items, responses]);

    // Handler para marcar resposta
    const handleResponse = async (item: AuditChecklistItem, status: AuditResponseStatus) => {
        // Se for não conforme, abrir modal de evidência
        if (status === 'non_compliant') {
            setEvidenceModal({ isOpen: true, itemId: item.id, item });
            return;
        }

        await saveResponse(item.id, status);
    };

    // Salvar resposta no banco
    const saveResponse = async (
        itemId: string,
        status: AuditResponseStatus,
        evidenceText?: string,
        evidenceUrl?: string
    ) => {
        try {
            setSaving(true);

            const activeAuditId = audit?.id || assignmentId;
            if (!activeAuditId) throw new Error('ID de auditoria não encontrado');

            const existingResponse = responses.get(itemId);

            const responseData = {
                audit_id: activeAuditId,
                item_id: itemId,
                status,
                evidence_text: evidenceText || null,
                evidence_url: evidenceUrl || null,
                verified_by: user?.id,
                verified_at: new Date().toISOString()
            };

            let result;
            if (existingResponse?.id) {
                // Update
                result = await supabase
                    .from('audit_checklist_responses')
                    .update(responseData)
                    .eq('id', existingResponse.id)
                    .select()
                    .single();
            } else {
                // Insert
                result = await supabase
                    .from('audit_checklist_responses')
                    .insert([responseData])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            // Atualizar estado local
            const newResponses = new Map(responses);
            newResponses.set(itemId, result.data);
            setResponses(newResponses);

            // Atualizar progresso se for assignment
            if (assignmentId) {
                const total = items.length;
                const answered = newResponses.size;
                const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

                await supabase
                    .from('audit_assignments')
                    .update({ progress })
                    .eq('id', assignmentId);
            }

            toast.success('Resposta registrada!');

        } catch (error) {
            console.error('Erro ao salvar resposta:', error);
            toast.error('Erro ao salvar resposta');
        } finally {
            setSaving(false);
        }
    };

    // Handler para salvar evidência de não conformidade
    const handleSaveEvidence = async (evidenceText: string, evidenceUrl?: string) => {
        if (!evidenceText.trim()) {
            toast.error('A descrição da não conformidade é obrigatória!');
            return;
        }

        await saveResponse(evidenceModal.itemId, 'non_compliant', evidenceText, evidenceUrl);
        setEvidenceModal({ isOpen: false, itemId: '' });
    };

    // Toggle categoria
    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    // Obter estilo do status
    const getStatusStyle = (status?: AuditResponseStatus) => {
        switch (status) {
            case 'compliant':
                return 'bg-green-100 border-green-300 text-green-700';
            case 'non_compliant':
                return 'bg-red-100 border-red-300 text-red-700';
            case 'not_applicable':
                return 'bg-gray-100 border-gray-300 text-gray-600';
            default:
                return 'bg-white border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#025159] animate-spin" />
                    <p className="text-gray-600">Carregando checklist...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Execução de Auditoria
                                </h2>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    {audit?.scope || 'Auditoria Externa'}
                                    {qmsScope && audit?.scope && audit.scope !== qmsScope && (
                                        <div className="group relative">
                                            <AlertTriangle size={14} className="text-amber-500 cursor-help" />
                                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg z-[70]">
                                                Este escopo diverge do escopo oficial definido no SGQ da empresa.
                                            </div>
                                        </div>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {saving && (
                                <span className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">
                                Progresso: {stats.answered} de {stats.total} itens
                            </span>
                            <span className="font-semibold text-[#025159]">{stats.progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#025159] rounded-full transition-all duration-300"
                                style={{ width: `${stats.progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600">Conformes: <strong>{stats.compliant}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-gray-600">Não Conformes: <strong>{stats.nonCompliant}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MinusCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">N/A: <strong>{stats.notApplicable}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhum item no checklist
                            </h3>
                            <p className="text-gray-500">
                                O template vinculado não possui itens. Adicione perguntas ao template primeiro.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ClipboardCheck className="w-5 h-5 text-[#025159]" />
                                            <span className="font-semibold text-gray-900">{category}</span>
                                            <span className="text-sm text-gray-500">
                                                ({categoryItems.filter(i => responses.has(i.id)).length}/{categoryItems.length})
                                            </span>
                                        </div>
                                        {expandedCategories.has(category) ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}
                                    </button>

                                    {/* Category Items */}
                                    {expandedCategories.has(category) && (
                                        <div className="divide-y divide-gray-100">
                                            {categoryItems.map((item, index) => {
                                                const response = responses.get(item.id);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`p-4 transition-colors ${getStatusStyle(response?.status)}`}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            {/* Número do Item */}
                                                            <div className="flex-shrink-0 w-8 h-8 bg-[#025159] text-white rounded-full flex items-center justify-center text-sm font-medium">
                                                                {index + 1}
                                                            </div>

                                                            {/* Conteúdo */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-gray-900">
                                                                            {item.question}
                                                                        </p>
                                                                        {item.iso_clause && (
                                                                            <span className="text-xs text-gray-500 mt-1">
                                                                                ISO: {item.iso_clause}
                                                                            </span>
                                                                        )}
                                                                        {item.help_text && (
                                                                            <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                                                                                <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                                                <span>{item.help_text}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Botões de Ação */}
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <button
                                                                            onClick={() => handleResponse(item, 'compliant')}
                                                                            disabled={saving}
                                                                            className={`p-2 rounded-lg transition-colors ${response?.status === 'compliant'
                                                                                ? 'bg-green-500 text-white'
                                                                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                                }`}
                                                                            title="Conforme"
                                                                        >
                                                                            <CheckCircle2 className="w-5 h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleResponse(item, 'non_compliant')}
                                                                            disabled={saving}
                                                                            className={`p-2 rounded-lg transition-colors ${response?.status === 'non_compliant'
                                                                                ? 'bg-red-500 text-white'
                                                                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                                }`}
                                                                            title="Não Conforme"
                                                                        >
                                                                            <XCircle className="w-5 h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleResponse(item, 'not_applicable')}
                                                                            disabled={saving}
                                                                            className={`p-2 rounded-lg transition-colors ${response?.status === 'not_applicable'
                                                                                ? 'bg-gray-500 text-white'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                                }`}
                                                                            title="Não Aplicável"
                                                                        >
                                                                            <MinusCircle className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Evidência de Não Conformidade */}
                                                                {response?.status === 'non_compliant' && response.evidence_text && (
                                                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                                        <div className="flex items-start gap-2">
                                                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                                            <div>
                                                                                <p className="text-sm font-medium text-red-800">
                                                                                    Evidência da Não Conformidade:
                                                                                </p>
                                                                                <p className="text-sm text-red-700 mt-1">
                                                                                    {response.evidence_text}
                                                                                </p>
                                                                                {response.evidence_url && (
                                                                                    <a
                                                                                        href={response.evidence_url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                                                                    >
                                                                                        📎 Ver anexo
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0 flex justify-between items-center bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Fechar
                    </button>

                    {stats.progress === 100 && (
                        <button
                            onClick={onComplete}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            Concluir Auditoria
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de Evidência para Não Conformidade */}
            {evidenceModal.isOpen && (
                <EvidenceModal
                    item={evidenceModal.item}
                    onSave={handleSaveEvidence}
                    onClose={() => setEvidenceModal({ isOpen: false, itemId: '' })}
                />
            )}
        </div>
    );
};

// Componente do Modal de Evidência
interface EvidenceModalProps {
    item?: AuditChecklistItem;
    onSave: (evidenceText: string, evidenceUrl?: string) => void;
    onClose: () => void;
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({ item, onSave, onClose }) => {
    const [evidenceText, setEvidenceText] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');

    const handleSubmit = () => {
        if (!evidenceText.trim()) {
            toast.error('Descreva a não conformidade encontrada!');
            return;
        }
        onSave(evidenceText, evidenceUrl || undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Registrar Não Conformidade
                            </h3>
                            <p className="text-sm text-gray-500">
                                Descreva a evidência encontrada
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {item && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 font-medium">Item:</p>
                            <p className="text-gray-900">{item.question}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição da Não Conformidade <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            placeholder="Descreva detalhadamente o que foi encontrado, onde e quais requisitos não foram atendidos..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL do Anexo (foto, documento)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={evidenceUrl}
                                onChange={(e) => setEvidenceUrl(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                            <button
                                type="button"
                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Upload de arquivo (em breve)"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Cole o link de uma imagem ou documento de evidência
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Registrar Não Conformidade
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditChecklist;
