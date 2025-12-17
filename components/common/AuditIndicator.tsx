import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Finding, FindingsMap } from '../../hooks/useAuditFindings';

interface AuditIndicatorProps {
    entityId: string;
    findingsMap: FindingsMap;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}

/**
 * AuditIndicator - Indicador visual de constatação de auditoria
 * Mostra um ícone colorido baseado na severidade da constatação
 */
export const AuditIndicator: React.FC<AuditIndicatorProps> = ({
    entityId,
    findingsMap,
    size = 'sm',
    showTooltip = true,
}) => {
    const finding = findingsMap[entityId];

    // Se não houver constatação para essa entidade, não renderiza nada
    if (!finding) {
        return null;
    }

    // Classes de tamanho
    const sizeClasses = {
        sm: 'w-5 h-5 p-0.5',
        md: 'w-6 h-6 p-1',
        lg: 'w-8 h-8 p-1.5',
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 20,
    };

    // Classes baseadas na severidade
    const getSeverityClasses = (severity: Finding['severity']) => {
        switch (severity) {
            case 'nao_conformidade_maior':
                return 'text-red-600 bg-red-50 border-red-200 animate-pulse';
            case 'nao_conformidade_menor':
                return 'text-orange-500 bg-orange-50 border-orange-200';
            case 'oportunidade':
                return 'text-blue-500 bg-blue-50 border-blue-200';
            case 'conforme':
                return 'text-green-500 bg-green-50 border-green-200';
            default:
                return 'text-gray-500 bg-gray-50 border-gray-200';
        }
    };

    // Labels para tooltip
    const getSeverityLabel = (severity: Finding['severity']) => {
        switch (severity) {
            case 'nao_conformidade_maior':
                return '🔴 Não Conformidade Maior';
            case 'nao_conformidade_menor':
                return '🟠 Não Conformidade Menor';
            case 'oportunidade':
                return '🔵 Oportunidade de Melhoria';
            case 'conforme':
                return '🟢 Conforme';
            default:
                return 'Constatação';
        }
    };

    // Status do workflow
    const getStatusLabel = (status: Finding['status']) => {
        switch (status) {
            case 'open':
                return 'Aguardando resposta';
            case 'waiting_validation':
                return 'Resposta enviada';
            case 'closed':
                return 'Fechado';
            default:
                return '';
        }
    };

    const tooltipText = showTooltip
        ? `${getSeverityLabel(finding.severity)}\n${getStatusLabel(finding.status)}\n\n${finding.auditor_notes || ''}`
        : undefined;

    const statusColors = {
        open: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Aguardando Resposta' },
        waiting_validation: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Resposta Enviada' },
        closed: { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', label: 'Fechado' }
    };

    const currentStatus = statusColors[finding.status as keyof typeof statusColors] || statusColors.open;
    const severityLabel = getSeverityLabel(finding.severity);
    const severityClass = getSeverityClasses(finding.severity);

    // Remover classes 'animate-pulse' do ícone estático para não piscar o tooltip
    const staticSeverityClass = severityClass.replace('animate-pulse', '');

    return (
        <div className="relative group inline-flex">
            <div
                className={`
                    inline-flex items-center justify-center rounded-full border
                    cursor-help transition-all hover:scale-110
                    ${sizeClasses[size]}
                    ${severityClass}
                `}
            >
                <AlertCircle size={iconSizes[size]} />
            </div>

            {/* Tooltip Rico Customizado */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                        {/* Cabeçalho */}
                        <div className={`px-3 py-2 border-b flex items-center gap-2 ${staticSeverityClass.replace('bg-opacity-100', 'bg-opacity-20')}`}>
                            <AlertCircle size={14} />
                            <span className="text-xs font-bold uppercase tracking-wide">
                                {severityLabel}
                            </span>
                        </div>

                        {/* Corpo */}
                        <div className="p-3">
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                                {finding.auditor_notes || 'Sem observações registradas.'}
                            </p>
                        </div>

                        {/* Rodapé - Status */}
                        <div className={`px-3 py-2 border-t text-[10px] font-medium flex items-center justify-between ${currentStatus.bg} ${currentStatus.text}`}>
                            <span>STATUS:</span>
                            <span className="uppercase">{currentStatus.label}</span>
                        </div>
                    </div>

                    {/* Seta do Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-2 h-2 bg-white transform rotate-45 border-r border-b border-gray-100 shadow-sm"></div>
                </div>
            )}
        </div>
    );
};

/**
 * AuditBadge - Versão em badge com texto para usar em headers
 */
interface AuditBadgeProps {
    finding: Finding;
}

export const AuditBadge: React.FC<AuditBadgeProps> = ({ finding }) => {
    const getBadgeClasses = (severity: Finding['severity']) => {
        switch (severity) {
            case 'nao_conformidade_maior':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'nao_conformidade_menor':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'oportunidade':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'conforme':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getLabel = (severity: Finding['severity']) => {
        switch (severity) {
            case 'nao_conformidade_maior':
                return 'NC Maior';
            case 'nao_conformidade_menor':
                return 'NC Menor';
            case 'oportunidade':
                return 'Oportunidade';
            case 'conforme':
                return 'Conforme';
            default:
                return 'Constatação';
        }
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border
        ${getBadgeClasses(finding.severity)}
        ${finding.severity === 'nao_conformidade_maior' ? 'animate-pulse' : ''}
      `}
            title={finding.auditor_notes}
        >
            <AlertCircle size={12} />
            {getLabel(finding.severity)}
        </span>
    );
};
