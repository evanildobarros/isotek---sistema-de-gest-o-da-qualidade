import React, { useState } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Lightbulb,
    XCircle,
    MessageSquare,
    Send,
    X,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuditor } from '../../contexts/AuditorContext';

export type AuditSeverity = 'conforme' | 'oportunidade' | 'nao_conformidade_menor' | 'nao_conformidade_maior';

interface AuditActionPanelProps {
    entityId: string;
    entityType: 'document' | 'risk' | 'rnc' | 'supplier' | 'process' | 'objective' | 'training' | 'audit' | 'general';
    entityName: string;
    auditAssignmentId: string;
    existingFinding?: {
        id: string;
        severity: AuditSeverity;
        auditor_notes: string;
        status: string;
    } | null;
    onFindingSaved?: () => void;
    compact?: boolean;
}

const severityConfig: Record<AuditSeverity, {
    label: string;
    icon: React.ElementType;
    bgColor: string;
    textColor: string;
    borderColor: string;
    description: string;
}> = {
    conforme: {
        label: 'Conforme',
        icon: CheckCircle,
        bgColor: 'bg-green-50 hover:bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        description: 'Atende aos requisitos da norma'
    },
    oportunidade: {
        label: 'Oportunidade',
        icon: Lightbulb,
        bgColor: 'bg-blue-50 hover:bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        description: 'Sugestão de melhoria'
    },
    nao_conformidade_menor: {
        label: 'NC Menor',
        icon: AlertTriangle,
        bgColor: 'bg-orange-50 hover:bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        description: 'Não conformidade que não afeta a eficácia do SGQ'
    },
    nao_conformidade_maior: {
        label: 'NC Maior',
        icon: XCircle,
        bgColor: 'bg-red-50 hover:bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        description: 'Não conformidade crítica que afeta a eficácia do SGQ'
    }
};

export const AuditActionPanel: React.FC<AuditActionPanelProps> = ({
    entityId,
    entityType,
    entityName,
    auditAssignmentId,
    existingFinding,
    onFindingSaved,
    compact = false
}) => {
    const { isAuditorMode } = useAuditor();
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | null>(
        existingFinding?.severity || null
    );
    const [notes, setNotes] = useState(existingFinding?.auditor_notes || '');
    const [saving, setSaving] = useState(false);

    // Só renderiza se estiver em modo auditor
    if (!isAuditorMode) {
        return null;
    }

    const handleSaveFinding = async () => {
        if (!selectedSeverity) {
            toast.warning('Selecione uma classificação');
            return;
        }

        setSaving(true);
        try {
            if (existingFinding?.id) {
                // Atualizar constatação existente
                const { error } = await supabase
                    .from('audit_findings')
                    .update({
                        severity: selectedSeverity,
                        auditor_notes: notes,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingFinding.id);

                if (error) throw error;
                toast.success('Constatação atualizada!');
            } else {
                // Criar nova constatação
                const { error } = await supabase
                    .from('audit_findings')
                    .insert({
                        audit_assignment_id: auditAssignmentId,
                        entity_type: entityType,
                        entity_id: entityId,
                        severity: selectedSeverity,
                        auditor_notes: notes,
                        status: 'open'
                    });

                if (error) throw error;
                toast.success('Constatação registrada!');
            }

            setIsExpanded(false);
            onFindingSaved?.();
        } catch (error: any) {
            console.error('Erro ao salvar constatação:', error);
            toast.error('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Versão compacta - apenas ícones
    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {Object.entries(severityConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedSeverity === key;
                    return (
                        <button
                            key={key}
                            onClick={() => {
                                setSelectedSeverity(key as AuditSeverity);
                                setIsExpanded(true);
                            }}
                            className={`p-1.5 rounded-lg border transition-all ${isSelected
                                ? `${config.bgColor} ${config.borderColor} ${config.textColor} ring-2 ring-offset-1 ring-${key === 'conforme' ? 'green' : key === 'oportunidade' ? 'blue' : key === 'nao_conformidade_menor' ? 'orange' : 'red'}-300`
                                : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                }`}
                            title={config.label}
                        >
                            <Icon size={14} />
                        </button>
                    );
                })}

                {isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                        title="Adicionar observações"
                    >
                        <MessageSquare size={14} />
                    </button>
                )}
            </div>
        );
    }

    // Versão expandida padrão - Organizada em blocos horizontais
    return (
        <div className="bg-amber-50 rounded-xl overflow-hidden">
            {/* Bloco 1: Cabeçalho - Identificação da classificação */}
            <div className="flex items-center justify-between px-4 py-3 bg-amber-100 border-b border-amber-200">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-200 rounded-lg">
                        <CheckCircle size={16} className="text-amber-700" />
                    </div>
                    <span className="text-sm font-semibold text-amber-800">
                        Classificação do Auditor
                    </span>
                </div>
                <span className="text-xs text-amber-600 truncate max-w-[150px]" title={entityName}>
                    {entityName}
                </span>
            </div>

            {/* Bloco 2: Área de Classificação - Botões e Observações */}
            <div className="p-4 border-b border-amber-200">
                {/* Botões de Severidade em linha horizontal */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(severityConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        const isSelected = selectedSeverity === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedSeverity(key as AuditSeverity)}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all flex-1 min-w-[70px] ${isSelected
                                    ? `${config.bgColor} ${config.borderColor} ${config.textColor} ring-2 ring-offset-1`
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="text-xs font-medium whitespace-nowrap">{config.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Campo de Observações */}
                <div>
                    <label className="block text-xs font-medium text-amber-700 mb-1.5">
                        Observações do Auditor
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Descreva as evidências, referência à cláusula ISO, etc..."
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white resize-none"
                        rows={2}
                    />
                </div>
            </div>

            {/* Bloco 3: Botões de Ação */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 bg-amber-50">
                <button
                    onClick={() => {
                        setSelectedSeverity(existingFinding?.severity || null);
                        setNotes(existingFinding?.auditor_notes || '');
                        setIsExpanded(false);
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSaveFinding}
                    disabled={saving || !selectedSeverity}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            {existingFinding ? 'Atualizar' : 'Registrar'} Constatação
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// Componente de Badge para exibir constatação existente
export const AuditFindingBadge: React.FC<{
    severity: AuditSeverity;
    notes?: string;
    onClick?: () => void;
}> = ({ severity, notes, onClick }) => {
    const config = severityConfig[severity];
    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} transition-colors`}
            title={notes || config.description}
        >
            <Icon size={12} />
            {config.label}
        </button>
    );
};

export default AuditActionPanel;
