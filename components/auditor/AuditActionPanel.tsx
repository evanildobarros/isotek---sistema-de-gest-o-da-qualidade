import React, { useState, useEffect } from 'react';
import {
    ClipboardCheck,
    X,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Minimize2,
    Maximize2,
    Send
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuditor } from '../../contexts/AuditorContext';
import { AuditResponseStatus } from '../../types';

interface Question {
    id: number;
    text: string;
    status: AuditResponseStatus | null;
    evidence?: string;
}

const MOCK_QUESTIONS = [
    { id: 1, text: 'O processo possui indicadores definidos?' },
    { id: 2, text: 'A documentação está atualizada?' },
    { id: 3, text: 'As competências dos envolvidos foram verificadas?' }
];

export const AuditActionPanel: React.FC = () => {
    const { isAuditorMode, currentContext, targetCompany, activeAssignmentId } = useAuditor();
    const [isExpanded, setIsExpanded] = useState(false);
    const [questions, setQuestions] = useState<Question[]>(
        MOCK_QUESTIONS.map(q => ({ ...q, status: null }))
    );
    const [activeNCItem, setActiveNCItem] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Carregar respostas existentes (Persistência)
    useEffect(() => {
        const loadExistingFindings = async () => {
            if (!activeAssignmentId || !currentContext) return;

            setLoading(true);
            try {
                const { data: findings, error } = await supabase
                    .from('audit_findings')
                    .select('auditor_notes, severity, status')
                    .eq('audit_assignment_id', activeAssignmentId)
                    .eq('iso_clause', currentContext.clause);

                if (error) throw error;

                if (findings && findings.length > 0) {
                    setQuestions(prev => prev.map(q => {
                        // Tentar encontrar um finding que comece com o texto da questão
                        const finding = findings.find(f => f.auditor_notes.startsWith(q.text));
                        if (finding) {
                            return {
                                ...q,
                                status: finding.severity === 'conforme' ? 'compliant' : 'non_compliant',
                                // Se for NC, extrair a evidência (texto após o ": ")
                                evidence: finding.severity === 'nao_conformidade_menor'
                                    ? finding.auditor_notes.split(': ')[1]
                                    : undefined
                            };
                        }
                        return q;
                    }));
                } else {
                    // Reset if no findings for this context
                    setQuestions(MOCK_QUESTIONS.map(q => ({ ...q, status: null })));
                }
            } catch (error) {
                console.error('Erro ao carregar constatações:', error);
            } finally {
                setLoading(false);
            }
        };

        loadExistingFindings();
    }, [activeAssignmentId, currentContext]);

    if (!isAuditorMode) return null;

    const handleAnswer = async (questionId: number, status: AuditResponseStatus) => {
        const newQuestions = questions.map(q =>
            q.id === questionId ? { ...q, status } : q
        );
        setQuestions(newQuestions);

        const question = questions.find(q => q.id === questionId);
        const questionText = question?.text || 'Questão de Auditoria';

        // Calcular e atualizar progresso no banco
        if (activeAssignmentId) {
            const answeredCount = newQuestions.filter(q => q.status !== null).length;
            const progress = Math.round((answeredCount / MOCK_QUESTIONS.length) * 100);

            try {
                // 1. Atualizar progresso geral
                await supabase
                    .from('audit_assignments')
                    .update({
                        progress,
                        status: 'em_andamento'
                    })
                    .eq('id', activeAssignmentId);

                // 2. Se for conforme, registrar no histórico de constatações
                if (status === 'compliant') {
                    await supabase
                        .from('audit_findings')
                        .insert({
                            audit_assignment_id: activeAssignmentId,
                            entity_type: 'general',
                            severity: 'conforme',
                            auditor_notes: `${questionText}: Verificado e conforme.`,
                            status: 'closed',
                            iso_clause: currentContext?.clause || 'ISO'
                        });
                }
            } catch (error) {
                console.error('Erro ao atualizar progresso e registros:', error);
            }
        }

        if (status === 'non_compliant') {
            setActiveNCItem(questionId);
        } else {
            setActiveNCItem(null);
            toast.success('Resposta registrada como Conforme!');
        }
    };

    const handleSaveNC = async (questionId: number, evidence: string) => {
        if (!evidence.trim()) {
            toast.error('Descreva a evidência objetiva!');
            return;
        }

        const question = questions.find(q => q.id === questionId);
        const questionText = question?.text || 'Questão de Auditoria';

        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, evidence } : q
        ));
        setActiveNCItem(null);

        // Notificar empresa e REGISTRAR no sistema
        try {
            if (targetCompany?.id && activeAssignmentId) {
                // 1. Buscar owner da empresa e usuário atual
                const { data: { user } } = await supabase.auth.getUser();
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('owner_id')
                    .eq('id', targetCompany.id)
                    .maybeSingle();

                if (companyError) console.error('Erro ao buscar dados da empresa:', companyError);

                // Fallback para o usuário atual caso não encontre o dono da empresa
                const finalResponsibleId = companyData?.owner_id || user?.id;

                if (!finalResponsibleId) {
                    throw new Error('Não foi possível determinar um responsável válido para a RNC.');
                }

                // 2. Registrar o Apontamento (Audit Finding)
                const { data: findingData, error: findingError } = await supabase
                    .from('audit_findings')
                    .insert({
                        audit_assignment_id: activeAssignmentId,
                        entity_type: 'general',
                        severity: 'nao_conformidade_menor',
                        auditor_notes: `${questionText}: ${evidence}`,
                        status: 'open',
                        iso_clause: currentContext?.clause || 'ISO'
                    })
                    .select()
                    .single();

                if (findingError) throw findingError;

                // 3. Gerar código RNC e Registrar a Ação Corretiva
                const { data: nextCode } = await supabase.rpc('generate_next_rnc_code', { p_company_id: targetCompany.id });

                const { error: rncError } = await supabase
                    .from('corrective_actions')
                    .insert({
                        company_id: targetCompany.id,
                        code: nextCode || `RNC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                        origin: 'Auditoria',
                        description: `${questionText}: ${evidence}`,
                        status: 'open',
                        responsible_id: finalResponsibleId,
                        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 dias de prazo
                    });

                if (rncError) console.error('Erro ao registrar RNC:', rncError);

                // 4. Enviar Notificação
                if (companyData?.owner_id) {
                    await supabase.from('notifications').insert({
                        company_id: targetCompany.id,
                        recipient_id: companyData.owner_id,
                        title: 'Nova Não Conformidade',
                        message: `O auditor apontou uma falha no requisito ${currentContext?.clause || 'ISO'}: ${questionText}`,
                        type: 'warning',
                        link: '/app/melhoria/nao-conformidades',
                        read: false
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao processar ação de auditoria:', error);
            toast.error('Erro ao registrar NC no banco de dados.');
        }

        toast.warning('Não Conformidade registrada com evidência.');
    };

    const pendingCount = questions.filter(q => q.status === null).length;

    // Minimizado (FAB)
    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-6 right-24 z-50 p-4 bg-[#025159] text-white rounded-full shadow-2xl hover:scale-110 transition-all group"
                title="Painel de Auditoria"
            >
                <ClipboardCheck className="w-8 h-8" />
                {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white">
                        {pendingCount}
                    </span>
                )}
            </button>
        );
    }

    // Expandido
    return (
        <div className="fixed bottom-6 right-24 z-50 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-[#025159] p-4 text-white flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider opacity-70">Contexto ISO 9001:2015</span>
                    <h3 className="font-bold flex items-center gap-2">
                        {currentContext ? (
                            <>
                                <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{currentContext.clause}</span>
                                <span className="truncate max-w-[200px]">{currentContext.title}</span>
                            </>
                        ) : (
                            'Aguardando Contexto...'
                        )}
                    </h3>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Minimize2 className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-4 bg-gray-50">
                {!currentContext ? (
                    <div className="text-center py-10">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm italic">
                            Navegue para uma área auditável para iniciar a coleta de evidências.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="text-center py-10">
                        <div className="w-8 h-8 border-2 border-[#025159] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-400 text-xs">Carregando coletas...</p>
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-gray-500 leading-relaxed border-l-2 border-[#025159]/30 pl-3">
                            {currentContext.description}
                        </p>

                        <div className="space-y-3">
                            {questions.map((q) => (
                                <div
                                    key={q.id}
                                    className={`bg-white p-4 rounded-xl border transition-all ${q.status === 'compliant' ? 'border-green-200 bg-green-50/30' :
                                        q.status === 'non_compliant' ? 'border-red-200 bg-red-50/30' :
                                            'border-gray-100'
                                        }`}
                                >
                                    <p className="text-sm font-medium text-gray-800 mb-3">{q.text}</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAnswer(q.id, 'compliant')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${q.status === 'compliant'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                }`}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Conforme
                                        </button>
                                        <button
                                            onClick={() => handleAnswer(q.id, 'non_compliant')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${q.status === 'non_compliant'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                }`}
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            Não Conforme
                                        </button>
                                    </div>

                                    {/* NC Evidence Input */}
                                    {activeNCItem === q.id && (
                                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="block text-[10px] font-bold text-red-600 uppercase">
                                                Evidência Objetiva (Obrigatório)
                                            </label>
                                            <textarea
                                                autoFocus
                                                placeholder="Descreva o que foi encontrado que não atende ao requisito..."
                                                className="w-full p-3 text-sm border-2 border-red-100 rounded-lg focus:ring-0 focus:border-red-300 resize-none h-24"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.ctrlKey) {
                                                        handleSaveNC(q.id, (e.target as HTMLTextAreaElement).value);
                                                    }
                                                }}
                                                id={`nc-evidence-${q.id}`}
                                            />
                                            <button
                                                onClick={() => {
                                                    const val = (document.getElementById(`nc-evidence-${q.id}`) as HTMLTextAreaElement).value;
                                                    handleSaveNC(q.id, val);
                                                }}
                                                className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Send className="w-4 h-4" />
                                                Salvar Não Conformidade
                                            </button>
                                        </div>
                                    )}

                                    {q.evidence && q.status === 'non_compliant' && activeNCItem !== q.id && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 mb-1">
                                                <MessageSquare className="w-3 h-3" />
                                                EVIDÊNCIA COLETADA
                                            </div>
                                            <p className="text-xs text-red-800 italic leading-relaxed">
                                                "{q.evidence}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">
                    Auditando: <span className="text-[#025159] font-bold">Modo Coleta em Tempo Real</span>
                </span>
                <span className="text-[10px] text-gray-400">v1.0-alpha</span>
            </div>
        </div>
    );
};
