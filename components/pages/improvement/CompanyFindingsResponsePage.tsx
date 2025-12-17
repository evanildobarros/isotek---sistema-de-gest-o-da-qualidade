import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    Lightbulb,
    Send,
    Clock,
    FileText,
    Shield,
    ClipboardList,
    ChevronDown,
    ChevronUp,
    Loader2,
    Calendar,
    User,
    Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { AuditFinding, AuditFindingSeverity, AuditFindingWorkflowStatus } from '../../../types';

interface AuditAssignmentWithAuditor {
    id: string;
    company_id: string;
    auditor_id: string;
    start_date: string;
    end_date?: string;
    status: string;
    auditor?: {
        id: string;
        full_name: string;
        email: string;
    };
}

interface FindingWithEntity extends AuditFinding {
    entity_name?: string;
}

export const CompanyFindingsResponsePage: React.FC = () => {
    const { effectiveCompanyId } = useAuthContext();
    const [assignments, setAssignments] = useState<AuditAssignmentWithAuditor[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<AuditAssignmentWithAuditor | null>(null);
    const [findings, setFindings] = useState<FindingWithEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingFindings, setLoadingFindings] = useState(false);
    const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);

    // Carregar atribuições de auditoria da empresa
    useEffect(() => {
        if (effectiveCompanyId) {
            fetchAssignments();
        }
    }, [effectiveCompanyId]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_assignments')
                .select(`
                    *,
                    auditor:profiles!audit_assignments_auditor_id_fkey (
                        id,
                        full_name,
                        email
                    )
                `)
                .eq('company_id', effectiveCompanyId)
                .in('status', ['em_andamento', 'concluida'])
                .order('start_date', { ascending: false });

            if (error) throw error;
            setAssignments(data || []);

            // Selecionar a primeira automaticamente
            if (data && data.length > 0) {
                setSelectedAssignment(data[0]);
                fetchFindings(data[0].id);
            }
        } catch (error) {
            console.error('Erro ao buscar auditorias:', error);
            toast.error('Erro ao carregar auditorias');
        } finally {
            setLoading(false);
        }
    };

    const fetchFindings = async (assignmentId: string) => {
        try {
            setLoadingFindings(true);
            const { data, error } = await supabase
                .from('audit_findings')
                .select('*')
                .eq('audit_assignment_id', assignmentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFindings(data || []);

            // Inicializar respostas existentes
            const existingResponses: Record<string, string> = {};
            data?.forEach(f => {
                if (f.company_response) {
                    existingResponses[f.id] = f.company_response;
                }
            });
            setResponseText(existingResponses);
        } catch (error) {
            console.error('Erro ao buscar apontamentos:', error);
            toast.error('Erro ao carregar apontamentos');
        } finally {
            setLoadingFindings(false);
        }
    };

    const handleSelectAssignment = (assignment: AuditAssignmentWithAuditor) => {
        setSelectedAssignment(assignment);
        fetchFindings(assignment.id);
    };

    const handleSubmitResponse = async (findingId: string) => {
        const response = responseText[findingId];
        if (!response?.trim()) {
            toast.error('Por favor, escreva sua resposta antes de enviar.');
            return;
        }

        try {
            setSubmitting(findingId);
            const { error } = await supabase
                .from('audit_findings')
                .update({
                    company_response: response.trim(),
                    status: 'waiting_validation'
                })
                .eq('id', findingId);

            if (error) throw error;

            toast.success('Resposta enviada com sucesso!');

            // Atualizar lista local
            setFindings(prev => prev.map(f =>
                f.id === findingId
                    ? { ...f, company_response: response.trim(), status: 'waiting_validation' as AuditFindingWorkflowStatus }
                    : f
            ));
        } catch (error) {
            console.error('Erro ao enviar resposta:', error);
            toast.error('Erro ao enviar resposta');
        } finally {
            setSubmitting(null);
        }
    };

    const getSeverityConfig = (severity: AuditFindingSeverity) => {
        switch (severity) {
            case 'conforme':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    label: 'Conforme'
                };
            case 'oportunidade':
                return {
                    icon: Lightbulb,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    label: 'Oportunidade de Melhoria'
                };
            case 'nao_conformidade_menor':
                return {
                    icon: AlertCircle,
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    label: 'Não Conformidade Menor'
                };
            case 'nao_conformidade_maior':
                return {
                    icon: AlertTriangle,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    label: 'Não Conformidade Maior'
                };
            default:
                return {
                    icon: FileText,
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    label: severity
                };
        }
    };

    const getStatusConfig = (status: AuditFindingWorkflowStatus) => {
        switch (status) {
            case 'open':
                return { label: 'Aguardando Resposta', color: 'text-orange-600', bg: 'bg-orange-100' };
            case 'waiting_validation':
                return { label: 'Aguardando Validação', color: 'text-blue-600', bg: 'bg-blue-100' };
            case 'closed':
                return { label: 'Encerrado', color: 'text-green-600', bg: 'bg-green-100' };
            default:
                return { label: status, color: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case 'document': return FileText;
            case 'risk': return Shield;
            case 'rnc': return AlertTriangle;
            default: return ClipboardList;
        }
    };

    // Estatísticas
    const stats = {
        total: findings.length,
        open: findings.filter(f => f.status === 'open').length,
        waiting: findings.filter(f => f.status === 'waiting_validation').length,
        closed: findings.filter(f => f.status === 'closed').length,
        ncMaior: findings.filter(f => f.severity === 'nao_conformidade_maior').length,
        ncMenor: findings.filter(f => f.severity === 'nao_conformidade_menor').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#025159] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-7 h-7 text-[#025159]" />
                    <h1 className="text-2xl font-bold text-gray-900">Apontamentos de Auditoria</h1>
                </div>
                <p className="text-gray-600">
                    Visualize e responda aos apontamentos registrados pelos auditores externos.
                </p>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma auditoria encontrada
                    </h3>
                    <p className="text-gray-500">
                        Você não possui auditorias com apontamentos registrados.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Lista de Auditorias */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                            Selecione a Auditoria
                        </h3>
                        <div className="space-y-2">
                            {assignments.map((assignment) => (
                                <button
                                    key={assignment.id}
                                    onClick={() => handleSelectAssignment(assignment)}
                                    className={`w-full p-4 rounded-lg border text-left transition-all ${selectedAssignment?.id === assignment.id
                                            ? 'bg-[#025159] text-white border-[#025159]'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#025159]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <User size={14} />
                                        <span className="text-sm font-medium truncate">
                                            {assignment.auditor?.full_name || 'Auditor'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs opacity-80">
                                        <Calendar size={12} />
                                        <span>
                                            {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className={`mt-2 text-xs px-2 py-1 rounded inline-block ${selectedAssignment?.id === assignment.id
                                            ? 'bg-white/20'
                                            : 'bg-gray-100'
                                        }`}>
                                        {assignment.status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content - Apontamentos */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-sm text-gray-500">Total</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                                <p className="text-2xl font-bold text-orange-600">{stats.open}</p>
                                <p className="text-sm text-orange-600">Pendentes</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                                <p className="text-2xl font-bold text-blue-600">{stats.waiting}</p>
                                <p className="text-sm text-blue-600">Em Validação</p>
                            </div>
                            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                                <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
                                <p className="text-sm text-green-600">Encerrados</p>
                            </div>
                        </div>

                        {/* Lista de Apontamentos */}
                        {loadingFindings ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-[#025159] animate-spin" />
                            </div>
                        ) : findings.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Nenhum apontamento
                                </h3>
                                <p className="text-gray-500">
                                    Esta auditoria não possui apontamentos registrados.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {findings.map((finding) => {
                                    const severityConfig = getSeverityConfig(finding.severity);
                                    const statusConfig = getStatusConfig(finding.status);
                                    const EntityIcon = getEntityIcon(finding.entity_type);
                                    const isExpanded = expandedFinding === finding.id;
                                    const canRespond = finding.status === 'open';

                                    return (
                                        <div
                                            key={finding.id}
                                            className={`bg-white rounded-xl border ${severityConfig.border} overflow-hidden`}
                                        >
                                            {/* Header do Apontamento */}
                                            <button
                                                onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                                                className="w-full p-4 flex items-start justify-between hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-2 rounded-lg ${severityConfig.bg}`}>
                                                        <severityConfig.icon className={`w-5 h-5 ${severityConfig.color}`} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-sm font-semibold ${severityConfig.color}`}>
                                                                {severityConfig.label}
                                                            </span>
                                                            {finding.iso_clause && (
                                                                <span className="text-xs text-gray-400">
                                                                    ISO {finding.iso_clause}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-700 text-sm line-clamp-2">
                                                            {finding.auditor_notes}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                                                                {statusConfig.label}
                                                            </span>
                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                <EntityIcon size={12} />
                                                                {finding.entity_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>

                                            {/* Conteúdo Expandido */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 border-t border-gray-100">
                                                    {/* Notas do Auditor */}
                                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                            <User size={14} />
                                                            Observação do Auditor
                                                        </h4>
                                                        <p className="text-gray-600 text-sm whitespace-pre-wrap">
                                                            {finding.auditor_notes}
                                                        </p>
                                                    </div>

                                                    {/* Resposta Existente ou Campo de Resposta */}
                                                    <div className="mt-4">
                                                        {finding.company_response && finding.status !== 'open' ? (
                                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                                <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                                                    <MessageSquare size={14} />
                                                                    Sua Resposta
                                                                </h4>
                                                                <p className="text-blue-700 text-sm whitespace-pre-wrap">
                                                                    {finding.company_response}
                                                                </p>
                                                            </div>
                                                        ) : canRespond ? (
                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                    <MessageSquare size={14} />
                                                                    Sua Resposta
                                                                </h4>
                                                                <textarea
                                                                    value={responseText[finding.id] || ''}
                                                                    onChange={(e) => setResponseText(prev => ({
                                                                        ...prev,
                                                                        [finding.id]: e.target.value
                                                                    }))}
                                                                    rows={4}
                                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#025159] focus:border-transparent resize-none"
                                                                    placeholder="Descreva as ações tomadas ou planejadas para tratar este apontamento..."
                                                                />
                                                                <div className="flex justify-end">
                                                                    <button
                                                                        onClick={() => handleSubmitResponse(finding.id)}
                                                                        disabled={submitting === finding.id}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#013d42] transition-colors disabled:opacity-50"
                                                                    >
                                                                        {submitting === finding.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Send className="w-4 h-4" />
                                                                        )}
                                                                        Enviar Resposta
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                                                                <Clock size={18} className="text-gray-400" />
                                                                <span className="text-sm text-gray-500">
                                                                    Aguardando validação do auditor
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyFindingsResponsePage;
