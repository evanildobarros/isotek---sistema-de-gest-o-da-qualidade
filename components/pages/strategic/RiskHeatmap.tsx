import React, { useMemo } from 'react';

type RiskType = 'risk' | 'opportunity';

interface RiskItem {
    id: string;
    type: RiskType;
    origin: string;
    description: string;
    probability: number;
    impact: number;
    action_plan: string;
}

interface RiskHeatmapProps {
    risks: RiskItem[];
    onRiskClick?: (risk: RiskItem) => void;
}

// Configuração dos Eixos (Invertido Y para ficar 5 no topo)
const PROBABILITY_LEVELS = [5, 4, 3, 2, 1];
const IMPACT_LEVELS = [1, 2, 3, 4, 5];

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ risks, onRiskClick }) => {

    // 1. Agrupar riscos por célula para performance (useMemo)
    const risksMap = useMemo(() => {
        const map = new Map<string, RiskItem[]>();
        risks.forEach(r => {
            const key = `${r.probability}-${r.impact}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(r);
        });
        return map;
    }, [risks]);

    // 2. Lógica de Cores ISO 9001 (Multiplicação P x I)
    const getCellColor = (prob: number, imp: number, hasOpportunities: boolean) => {
        const score = prob * imp;

        // Se a célula contém apenas oportunidades, usamos tons de azul
        if (hasOpportunities) {
            if (score >= 17) return 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300 hover:from-blue-200 hover:to-blue-100 shadow-blue-100/50';      // Excelente
            if (score >= 10) return 'bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:from-blue-100 hover:to-blue-50';      // Estratégica
            if (score >= 5) return 'bg-gradient-to-br from-cyan-50 to-white border-cyan-200 hover:from-cyan-100 hover:to-cyan-50';       // Promissora
            return 'bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:from-slate-100 hover:to-slate-50';                   // Baixa
        }

        // Zonas de Calor (Heatmap) para Riscos/Ameaças
        if (score >= 17) return 'bg-gradient-to-br from-red-100 to-red-50 border-red-300 hover:from-red-200 hover:to-red-100 shadow-red-100/50';      // Crítico
        if (score >= 10) return 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300 hover:from-orange-200 hover:to-orange-100 shadow-orange-50/50'; // Alto
        if (score >= 5) return 'bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-300 hover:from-yellow-200 hover:to-yellow-100 shadow-yellow-50/50'; // Moderado
        return 'bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-300 hover:from-emerald-200 hover:to-emerald-100 shadow-emerald-50/50';           // Baixo
    };

    const getScoreLabel = (score: number, hasOnlyOpportunities: boolean) => {
        if (hasOnlyOpportunities) {
            if (score >= 17) return 'Excelente';
            if (score >= 10) return 'Estratégica';
            if (score >= 5) return 'Promissora';
            return 'Baixa';
        }
        if (score >= 17) return 'Crítico';
        if (score >= 10) return 'Alto';
        if (score >= 5) return 'Moderado';
        return 'Baixo';
    };

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <div className="w-full min-w-[600px]">
                <div className="grid grid-cols-[auto_1fr] gap-4 md:gap-6">
                    {/* Eixo Y: Título Vertical */}
                    <div className="flex items-center justify-center">
                        <span className="-rotate-90 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                            Probabilidade (Y)
                        </span>
                    </div>

                    {/* Grid Principal */}
                    <div className="flex flex-col gap-2 md:gap-3">
                        {/* Linhas da Matriz */}
                        {PROBABILITY_LEVELS.map((prob) => (
                            <div key={`row-${prob}`} className="grid grid-cols-[40px_repeat(5,1fr)] md:grid-cols-[50px_repeat(5,1fr)] gap-2 md:gap-3">
                                {/* Rótulo do Eixo Y (Número) */}
                                <div className="flex items-center justify-center font-black text-xs md:text-sm text-gray-500 bg-white border-2 border-gray-100 rounded-lg md:rounded-xl shadow-sm hover:border-[#025159]/20 transition-colors">
                                    {prob}
                                </div>

                                {/* Colunas (Células) */}
                                {IMPACT_LEVELS.map((imp) => {
                                    const cellRisks = risksMap.get(`${prob}-${imp}`) || [];
                                    const score = prob * imp;
                                    const hasOpportunities = cellRisks.some(r => r.type === 'opportunity');
                                    const hasRisks = cellRisks.some(r => r.type === 'risk');
                                    const isCrowded = cellRisks.length > 3;

                                    return (
                                        <div
                                            key={`cell-${prob}-${imp}`}
                                            className={`
                                                relative w-full aspect-square min-h-[60px] sm:min-h-[80px] md:min-h-[110px] 
                                                border-2 rounded-lg md:rounded-2xl p-1 md:p-3 transition-all duration-500 ease-out
                                                flex flex-col gap-1 md:gap-2 shadow-sm hover:shadow-xl hover:-translate-y-1
                                                group/cell overflow-hidden
                                                ${getCellColor(prob, imp, hasOpportunities && !hasRisks)}
                                            `}
                                        >
                                            {/* Badge de Score no canto */}
                                            <div className="absolute top-1 right-1.5 md:top-2 md:right-3 flex flex-col items-end gap-0.5 pointer-events-none">
                                                <span className="text-[10px] md:text-[14px] font-black text-gray-900/10 group-hover/cell:text-gray-900/20 transition-colors">
                                                    {score}
                                                </span>
                                                <span className="hidden md:block text-[8px] font-bold uppercase tracking-widest text-gray-900/10 group-hover/cell:text-gray-900/30 transition-colors">
                                                    {getScoreLabel(score, hasOpportunities && !hasRisks)}
                                                </span>
                                            </div>

                                            {/* Lista de Riscos (Badges/Pills) */}
                                            <div className="mt-auto md:mt-4 flex flex-wrap gap-1 md:gap-1.5 justify-center md:justify-start overflow-hidden max-h-[60%]">
                                                {cellRisks.slice(0, 6).map((risk) => (
                                                    <button
                                                        key={risk.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRiskClick?.(risk);
                                                        }}
                                                        className={`
                                                            group relative transition-all flex items-center gap-1 md:gap-1.5
                                                            hover:scale-[1.05] active:scale-[0.95]
                                                            /* Estilo Badge/Pill */
                                                            px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full border shadow-sm
                                                            ${risk.type === 'risk'
                                                                ? 'bg-red-50/90 border-red-200/50 hover:bg-red-100 hover:border-red-300'
                                                                : 'bg-blue-50/90 border-blue-200/50 hover:bg-blue-100 hover:border-blue-300'
                                                            }
                                                        `}
                                                        title={risk.description}
                                                    >
                                                        {/* Dot Indicador dentro do Badge */}
                                                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${risk.type === 'risk'
                                                                ? 'bg-red-500 animate-pulse'
                                                                : 'bg-blue-500'
                                                            }`} />

                                                        {/* Texto curto/truncado */}
                                                        <span className={`
                                                            truncate max-w-[35px] sm:max-w-[50px] md:max-w-[80px] font-bold text-[8px] md:text-[10px]
                                                            ${risk.type === 'risk' ? 'text-red-700' : 'text-blue-700'}
                                                        `}>
                                                            {risk.description}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Indicador de "Ver Mais" */}
                                            {isCrowded && (
                                                <div className="mt-auto pb-0.5 text-center md:pt-1">
                                                    <span className="text-[8px] md:text-[10px] font-black text-gray-500 bg-white/40 backdrop-blur-sm px-1 md:px-3 py-0.5 md:py-1 rounded-full border border-white/20 shadow-sm">
                                                        <span className="md:hidden">+{cellRisks.length - 5}</span>
                                                        <span className="hidden md:inline">{cellRisks.length - 5} itens extras</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Eixo X: Rótulos e Título */}
                        <div className="grid grid-cols-[50px_repeat(5,1fr)] gap-3 mt-2">
                            <div></div>
                            {IMPACT_LEVELS.map((imp) => (
                                <div key={`header-${imp}`} className="flex items-center justify-center font-black text-gray-500 bg-white border-2 border-gray-100 rounded-xl py-2 shadow-sm hover:border-[#025159]/20 transition-colors">
                                    {imp}
                                </div>
                            ))}
                        </div>

                        {/* Título do Eixo X */}
                        <div className="text-center mt-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Impacto / Severidade (X)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
