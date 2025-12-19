import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    AlertCircle,
    User,
    Loader2,
    MessageSquare,
    Check,
    AlertTriangle,
    ShieldCheck,
    Briefcase
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { AuditBadge } from '../../common/AuditIndicator';
import { FindingResponseModal } from './FindingResponseModal';
import { ConfirmationModal } from '../../common/ConfirmationModal';
import { useAuditor } from '../../../contexts/AuditorContext';

interface AuditDetails {
    id: string;
    company_id: string;
    status: string;
    start_date: string;
    end_date: string;
    notes: string;
    auditor?: {
        full_name: string;
        avatar_url: string;
    };
}

interface Finding {
    id: string;
    entity_type: string;
    entity_id: string;
    severity: 'conforme' | 'oportunidade' | 'nao_conformidade_menor' | 'nao_conformidade_maior';
    auditor_notes: string;
    company_response: string;
    status: 'open' | 'waiting_validation' | 'closed';
    created_at: string;
    // Helper para exibir nome da entidade (precisaria de joins complexos ou fetch separado, vamos simplificar por enquanto)
}

export const ExternalAuditDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [audit, setAudit] = useState<AuditDetails | null>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(true);

    // Response Modal State
    const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
    const [responseModalOpen, setResponseModalOpen] = useState(false);

    // Auditor Context & Confirmation Modal State (Moved to top)
    const { user } = useAuthContext();
    const { isAuditorMode } = useAuditor();
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | null;
        findingId: string | null;
    }>({
        isOpen: false,
        type: null,
        findingId: null
    });

    useEffect(() => {
        if (id) {
            fetchAuditDetails();
        }
    }, [id]);

    const fetchAuditDetails = async () => {
        try {
            setLoading(true);

            // Fetch Audit Info (sem join quebrado)
            const { data: auditData, error: auditError } = await supabase
                .from('audit_assignments')
                .select('id, company_id, status, start_date, end_date, notes, auditor_id')
                .eq('id', id)
                .single();

            if (auditError) throw auditError;

            // Fetch Auditor Profile Manually
            let auditorProfile = undefined;
            if (auditData.auditor_id) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', auditData.auditor_id)
                    .maybeSingle();

                if (profileData) {
                    auditorProfile = profileData;
                }
            }

            setAudit({
                ...auditData,
                auditor: auditorProfile
            });

            // Fetch Findings
            const { data: findingsData, error: findingsError } = await supabase
                .from('audit_findings')
                .select('id, entity_type, entity_id, severity, auditor_notes, company_response, status, created_at, audit_assignment_id, iso_clause')
                .eq('audit_assignment_id', id)
                .order('created_at', { ascending: false });

            if (findingsError) throw findingsError;
            setFindings(findingsData || []);

        } catch (error: any) {
            console.error('Erro ao buscar detalhes da auditoria:', error);
            toast.error('Erro ao carregar detalhes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenResponse = (findingId: string) => {
        setSelectedFinding(findingId);
        setResponseModalOpen(true);
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-[#025159]" size={32} />
            </div>
        );
    }

    if (!audit) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Auditoria não encontrada.</p>
                <button onClick={() => navigate('/app/auditorias-externas')} className="text-[#025159] hover:underline mt-2">
                    Voltar
                </button>
            </div>
        );
    }

    // Hooks moved to top

    // ... (rest of code)

    // State moved to top

    const openConfirmModal = (type: 'approve' | 'reject', findingId: string) => {
        setConfirmModal({
            isOpen: true,
            type,
            findingId
        });
    };

    const handleConfirmAction = async () => {
        const { type, findingId } = confirmModal;
        if (!findingId || !type) return;

        try {
            if (type === 'approve') {
                const { error } = await supabase
                    .from('audit_findings')
                    .update({ status: 'closed' })
                    .eq('id', findingId);

                if (error) throw error;
                toast.success('Apontamento validado e concluído!');
            } else {
                const { error } = await supabase
                    .from('audit_findings')
                    .update({ status: 'open' })
                    .eq('id', findingId);

                if (error) throw error;
                toast.success('Resposta rejeitada. Apontamento devolvido para a empresa.');
            }
            fetchAuditDetails();
        } catch (error) {
            console.error(`Erro ao ${type === 'approve' ? 'validar' : 'rejeitar'}:`, error);
            toast.error(`Erro ao ${type === 'approve' ? 'validar' : 'rejeitar'} ação`);
        }
    };


    const openFindingsCount = findings.filter(f => f.status !== 'closed').length;

    // Determine which auditor info to show
    // If audit has auditor info, use it.
    // If not, and we are in auditor mode, use current user info.
    const displayAuditor = audit.auditor || (isAuditorMode && user ? {
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Auditor',
        avatar_url: user.user_metadata?.avatar_url || ''
    } : undefined);


    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
            {/* Header / Back */}
            <button
                onClick={() => navigate('/app/auditorias-externas')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft size={16} />
                Voltar para Auditorias
            </button>

            {/* Audit Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                                {audit.status}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(audit.start_date)} - {formatDate(audit.end_date)}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Auditoria Externa</h1>

                        <div className="flex items-center gap-3 mt-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {displayAuditor?.avatar_url ? (
                                    <img src={displayAuditor.avatar_url} alt={displayAuditor.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-gray-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{displayAuditor?.full_name || 'Auditor não atribuído'}</p>
                                <p className="text-xs text-gray-500">Auditor Responsável</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center min-w-[120px]">
                            <div className="text-2xl font-bold text-red-700">
                                {findings.filter(f => f.severity === 'nao_conformidade_maior').length}
                            </div>
                            <div className="text-xs font-medium text-red-600 uppercase">Não Conformidade Maior</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center min-w-[120px]">
                            <div className="text-2xl font-bold text-orange-700">
                                {findings.filter(f => f.severity === 'nao_conformidade_menor').length}
                            </div>
                            <div className="text-xs font-medium text-orange-600 uppercase">Não Conformidade Menor</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center min-w-[100px]">
                            <div className="text-2xl font-bold text-blue-700">
                                {findings.filter(f => f.severity === 'oportunidade').length}
                            </div>
                            <div className="text-xs font-medium text-blue-600 uppercase">Oportunidades</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Findings List */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="text-amber-600" />
                    Apontamentos ({findings.length})
                </h2>

                <div className="space-y-4">
                    {findings.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <CheckCircle2 className="mx-auto text-green-500 opacity-50 mb-3" size={48} />
                            <p className="text-gray-500 font-medium">Nenhum apontamento registrado nesta auditoria.</p>
                        </div>
                    ) : (
                        findings.map((finding) => (
                            <div key={finding.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <AuditBadge finding={finding as any} />
                                        <span className="text-xs text-gray-400 font-mono hidden sm:inline-block">ID: {finding.id.slice(0, 8)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {finding.status === 'open' && (
                                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                                Aguardando Resposta
                                            </span>
                                        )}
                                        {finding.status === 'waiting_validation' && (
                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                                Aguardando Validação
                                            </span>
                                        )}
                                        {finding.status === 'closed' && (
                                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                                                <Check size={12} /> Concluído
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 grid md:grid-cols-2 gap-8">
                                    {/* Auditor Side */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            Observações do Auditor
                                        </h4>
                                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed border border-gray-100">
                                            {finding.auditor_notes}
                                        </div>
                                    </div>

                                    {/* Company Side */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-gray-400" />
                                            Resposta da Empresa
                                        </h4>

                                        {finding.company_response ? (
                                            <div className="bg-blue-50/50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed border border-blue-100">
                                                {finding.company_response}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 border border-dashed border-gray-200 text-center italic">
                                                Nenhuma resposta registrada.
                                            </div>
                                        )}

                                        {/* Action Button for Company */}
                                        {!isAuditorMode && finding.status === 'open' && (
                                            <button
                                                onClick={() => handleOpenResponse(finding.id)}
                                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#025159] text-[#025159] text-sm font-medium rounded-lg hover:bg-[#025159] hover:text-white transition-all shadow-sm"
                                            >
                                                <MessageSquare size={16} />
                                                Responder Apontamento
                                            </button>
                                        )}

                                        {/* Action Buttons for Auditor */}
                                        {isAuditorMode && finding.status === 'waiting_validation' && (
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={() => openConfirmModal('reject', finding.id)}
                                                    className="flex-1 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                                >
                                                    Rejeitar
                                                </button>
                                                <button
                                                    onClick={() => openConfirmModal('approve', finding.id)}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    <Check size={16} />
                                                    Validar Resposta
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <FindingResponseModal
                isOpen={responseModalOpen}
                onClose={() => setResponseModalOpen(false)}
                findingId={selectedFinding || ''}
                currentResponse={findings.find(f => f.id === selectedFinding)?.company_response}
                onResponseSaved={fetchAuditDetails}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'approve' ? 'Validar Resposta?' : 'Rejeitar Resposta?'}
                description={
                    confirmModal.type === 'approve'
                        ? 'Ao validar, o apontamento será considerado concluído (Verde).'
                        : 'Ao rejeitar, o apontamento voltará para o status "Aberto" para que a empresa possa corrigir.'
                }
                confirmText={confirmModal.type === 'approve' ? 'Validar' : 'Rejeitar'}
                variant={confirmModal.type === 'approve' ? 'success' : 'danger'}
            />
        </div>
    );
};
