import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface SwotItem {
    id: string;
    content: string;
    impact: 'Alto' | 'Médio' | 'Baixo';
}

interface SwotCardProps {
    type: 'strength' | 'weakness' | 'opportunity' | 'threat';
}

const typeConfig = {
    strength: {
        title: 'Forças',
        titleEn: 'Strengths',
        color: {
            border: 'border-green-300',
            bg: 'bg-green-50',
            text: 'text-green-800',
            badgeHigh: 'bg-green-700 text-white',
            badgeMedium: 'bg-green-500 text-white',
            badgeLow: 'bg-green-300 text-green-800'
        }
    },
    weakness: {
        title: 'Fraquezas',
        titleEn: 'Weaknesses',
        color: {
            border: 'border-orange-300',
            bg: 'bg-orange-50',
            text: 'text-orange-800',
            badgeHigh: 'bg-orange-700 text-white',
            badgeMedium: 'bg-orange-500 text-white',
            badgeLow: 'bg-orange-300 text-orange-800'
        }
    },
    opportunity: {
        title: 'Oportunidades',
        titleEn: 'Opportunities',
        color: {
            border: 'border-blue-300',
            bg: 'bg-blue-50',
            text: 'text-blue-800',
            badgeHigh: 'bg-blue-700 text-white',
            badgeMedium: 'bg-blue-500 text-white',
            badgeLow: 'bg-blue-300 text-blue-800'
        }
    },
    threat: {
        title: 'Ameaças',
        titleEn: 'Threats',
        color: {
            border: 'border-red-300',
            bg: 'bg-red-50',
            text: 'text-red-800',
            badgeHigh: 'bg-red-700 text-white',
            badgeMedium: 'bg-red-500 text-white',
            badgeLow: 'bg-red-300 text-red-800'
        }
    }
};

export const SwotCard: React.FC<SwotCardProps> = ({ type }) => {
    const config = typeConfig[type];

    const [items, setItems] = useState<SwotItem[]>([
        {
            id: '1',
            content: 'Equipe técnica altamente qualificada e certificada.',
            impact: 'Alto'
        },
        {
            id: '2',
            content: 'Sistema de gestão da qualidade digitalizado.',
            impact: 'Médio'
        }
    ]);

    const handleAdd = () => {
        const newItem: SwotItem = {
            id: Date.now().toString(),
            content: 'Novo item (clique para editar)',
            impact: 'Médio'
        };
        setItems([...items, newItem]);
    };

    const handleDelete = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const getImpactBadgeClass = (impact: SwotItem['impact']) => {
        switch (impact) {
            case 'Alto':
                return config.color.badgeHigh;
            case 'Médio':
                return config.color.badgeMedium;
            case 'Baixo':
                return config.color.badgeLow;
            default:
                return config.color.badgeMedium;
        }
    };

    const getImpactLabel = (impact: SwotItem['impact']) => {
        return `${impact.toUpperCase()} IMPACTO`;
    };

    return (
        <div className={`rounded-lg border ${config.color.border} bg-white shadow-sm overflow-hidden h-full flex flex-col`}>
            {/* Header */}
            <div className={`px-4 py-3 ${config.color.bg} ${config.color.text} flex justify-between items-center border-b ${config.color.border}`}>
                <h3 className="font-bold text-base">{config.title}</h3>
                <button
                    onClick={handleAdd}
                    className="p-1.5 hover:bg-white/50 rounded-md transition-colors"
                    title="Adicionar item"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Items List */}
            <div className="p-4 flex-1 space-y-3 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm italic">
                        Nenhum item registrado. Clique no + para adicionar.
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="group flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md bg-white transition-all duration-200"
                        >
                            <div className="flex-1">
                                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                                    {item.content}
                                </p>
                                <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${getImpactBadgeClass(item.impact)}`}>
                                    {getImpactLabel(item.impact)}
                                </span>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                }}
                                className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                title="Remover item"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
