import React from 'react';
import { SwotCard } from './SwotCard';
import { Layers } from 'lucide-react';

export const SwotAnalysis: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-7 h-7 text-[#025159]" />
                    <h1 className="text-2xl font-bold text-[#025159]">Análise SWOT (Matriz FOFA)</h1>
                </div>
                <p className="text-gray-500 text-sm">
                    Identifique forças, fraquezas, oportunidades e ameaças para o contexto da organização.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths - Forças */}
                <SwotCard type="strength" />

                {/* Weaknesses - Fraquezas */}
                <SwotCard type="weakness" />

                {/* Opportunities - Oportunidades */}
                <SwotCard type="opportunity" />

                {/* Threats - Ameaças */}
                <SwotCard type="threat" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">💡 Dica</h3>
                <p className="text-sm text-blue-800">
                    A matriz SWOT é uma ferramenta estratégica essencial para ISO 9001:2015 (cláusula 4.1).
                    Use-a para entender o contexto interno (Forças e Fraquezas) e externo (Oportunidades e Ameaças)
                    da sua organização.
                </p>
            </div>
        </div>
    );
};
