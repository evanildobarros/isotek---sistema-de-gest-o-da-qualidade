import React, { useState } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    ShieldAlert,
    MoreVertical,
    Plus,
    Search,
    Filter,
    Link as LinkIcon,
    Download,
    X
} from 'lucide-react';

type RiskType = 'risk' | 'opportunity';

interface RiskItem {
    id: number;
    type: RiskType;
    origin: string; // New field
    description: string;
    probability: number;
    impact: number;
    action_plan: string;
}

// Mock data for SWOT items to import
const MOCK_SWOT_ITEMS = [
    { id: 101, type: 'weakness', text: 'Baixa capacidade de investimento em marketing' },
    { id: 102, type: 'threat', text: 'Entrada de novos concorrentes internacionais' },
    { id: 103, type: 'strength', text: 'Equipe técnica altamente qualificada' },
];

const MOCK_DATA: RiskItem[] = [
    {
        id: 1,
        type: 'risk',
        origin: 'SWOT - Ameaça',
        description: 'Dependência de fornecedor único (Matéria Prima X)',
        probability: 5,
        impact: 5,
        action_plan: 'Homologar 2 novos fornecedores até Dez/24'
    },
    {
        id: 2,
        type: 'risk',
        origin: 'Manual',
        description: 'Falha no servidor local',
        probability: 2,
        impact: 5,
        action_plan: 'Migrar backup para nuvem'
    },
    {
        id: 3,
        type: 'opportunity',
        origin: 'SWOT - Oportunidade',
        description: 'Novo incentivo fiscal para exportação',
        probability: 4,
        impact: 4,
        action_plan: 'Consultar jurídico para adesão'
    },
    {
        id: 4,
        type: 'risk',
        origin: 'Manual',
        description: 'Rotatividade da equipe de vendas',
        probability: 3,
        impact: 3,
        action_plan: 'Revisar política de comissões'
    },
];

export const RiskMatrixPage: React.FC = () => {
    const [risks, setRisks] = useState<RiskItem[]>(MOCK_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedSwotItems, setSelectedSwotItems] = useState<number[]>([]);

    const calculateSeverity = (prob: number, imp: number) => prob * imp;

    const getSeverityLevel = (score: number, type: RiskType) => {
        if (type === 'opportunity') {
            if (score >= 15) return { label: 'Excelente', color: 'bg-green-100 text-green-800 border-green-200' };
            if (score >= 8) return { label: 'Bom', color: 'bg-blue-100 text-blue-800 border-blue-200' };
            return { label: 'Baixo', color: 'bg-gray-100 text-gray-800 border-gray-200' };
        } else {
            if (score >= 15) return { label: 'Crítico', color: 'bg-red-100 text-red-800 border-red-200' };
            if (score >= 8) return { label: 'Alto', color: 'bg-orange-100 text-orange-800 border-orange-200' };
            if (score >= 4) return { label: 'Médio', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            return { label: 'Baixo', color: 'bg-green-100 text-green-800 border-green-200' };
        }
    };

    const handleImportSwot = () => {
        const newRisks: RiskItem[] = selectedSwotItems.map(id => {
            const item = MOCK_SWOT_ITEMS.find(i => i.id === id);
            if (!item) return null;

            return {
                id: Date.now() + Math.random(), // Simple ID generation
                type: item.type === 'strength' || item.type === 'opportunity' ? 'opportunity' : 'risk',
                origin: `SWOT - ${item.type === 'strength' ? 'Força' : item.type === 'weakness' ? 'Fraqueza' : item.type === 'opportunity' ? 'Oportunidade' : 'Ameaça'}`,
                description: item.text,
                probability: 1, // Default
                impact: 1, // Default
                action_plan: 'Definir plano de ação...'
            };
        }).filter((r): r is RiskItem => r !== null);

        setRisks([...risks, ...newRisks]);
        setIsImportModalOpen(false);
        setSelectedSwotItems([]);
        alert(`${newRisks.length} itens importados com sucesso!`);
    };

    const toggleSwotSelection = (id: number) => {
        setSelectedSwotItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredRisks = risks.filter(risk =>
        risk.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.action_plan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Matriz de Riscos e Oportunidades</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestão baseada em riscos (ISO 9001: 6.1)
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                    >
                        <Download size={20} />
                        <span>Importar da SWOT</span>
                    </button>
                    <button className="flex items-center gap-2 bg-[#BF7960] text-white px-4 py-2.5 rounded-lg hover:bg-[#A66850] transition-colors shadow-sm font-medium">
                        <Plus size={20} />
                        <span>Novo Item</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar riscos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#BF7960]/20 focus:border-[#BF7960]"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Filter size={20} />
                    <span>Filtros</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4 w-1/3">Descrição do Risco/Oportunidade</th>
                                <th className="px-6 py-4 text-center">Prob.</th>
                                <th className="px-6 py-4 text-center">Imp.</th>
                                <th className="px-6 py-4 text-center">Nível (PxI)</th>
                                <th className="px-6 py-4 w-1/3">Plano de Ação</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRisks.map((risk) => {
                                const severity = calculateSeverity(risk.probability, risk.impact);
                                const level = getSeverityLevel(severity, risk.type);
                                const isSwot = risk.origin.toLowerCase().includes('swot') || risk.origin.toLowerCase().includes('contexto');

                                return (
                                    <tr key={risk.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {risk.type === 'risk' ? (
                                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2 py-1 rounded-md w-fit">
                                                        <AlertTriangle size={16} />
                                                        <span className="text-xs font-bold">Risco</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                                                        <TrendingUp size={16} />
                                                        <span className="text-xs font-bold">Oportunidade</span>
                                                    </div>
                                                )}

                                                {/* Origin Badge */}
                                                <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border w-fit ${isSwot
                                                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    <LinkIcon size={10} />
                                                    <span className="truncate max-w-[100px]" title={risk.origin}>{risk.origin}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900 font-medium line-clamp-2">{risk.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                                                {risk.probability}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                                                {risk.impact}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${level.color}`}>
                                                <span className="text-xs font-bold uppercase">{level.label}</span>
                                                <span className="text-xs font-black opacity-75">({severity})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <ShieldAlert size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-gray-600 line-clamp-2">{risk.action_plan}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredRisks.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <p>Nenhum item encontrado.</p>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Importar da Análise SWOT</h3>
                                <p className="text-sm text-gray-500">Selecione os itens do contexto para transformar em riscos/oportunidades</p>
                            </div>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-3">
                                {MOCK_SWOT_ITEMS.map(item => (
                                    <label
                                        key={item.id}
                                        className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedSwotItems.includes(item.id)
                                                ? 'border-[#BF7960] bg-[#BF7960]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSwotItems.includes(item.id)}
                                            onChange={() => toggleSwotSelection(item.id)}
                                            className="mt-1 w-5 h-5 text-[#BF7960] border-gray-300 rounded focus:ring-[#BF7960]"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${item.type === 'strength' ? 'bg-green-100 text-green-700' :
                                                        item.type === 'weakness' ? 'bg-orange-100 text-orange-700' :
                                                            item.type === 'opportunity' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.type === 'strength' ? 'Força' :
                                                        item.type === 'weakness' ? 'Fraqueza' :
                                                            item.type === 'opportunity' ? 'Oportunidade' : 'Ameaça'}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 font-medium">{item.text}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImportSwot}
                                disabled={selectedSwotItems.length === 0}
                                className="px-6 py-2 bg-[#BF7960] text-white font-medium rounded-lg hover:bg-[#A66850] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Importar {selectedSwotItems.length > 0 ? `(${selectedSwotItems.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
