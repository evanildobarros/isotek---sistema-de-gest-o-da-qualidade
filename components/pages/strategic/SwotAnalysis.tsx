import React from 'react';
import { SwotCard } from './SwotCard';
import { Layers } from 'lucide-react';

export const SwotAnalysis: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
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


        </div>
    );
};
