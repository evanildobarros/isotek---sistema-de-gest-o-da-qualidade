import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    ShieldAlert,
    MoreVertical,
    Search,
    Filter,
    Link as LinkIcon,
    Download,
    X,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

type RiskType = 'risk' | 'opportunity';

interface RiskItem {
    id: string;
    type: RiskType;
    origin: string;
    description: string;
    probability: number;
    impact: number;
    action_plan: string;
    company_id: string;
}

interface SwotItem {
    id: string;
    type: 'forca' | 'fraqueza' | 'oportunidade' | 'ameaca';
    description: string;
}

export const RiskMatrixPage: React.FC = () => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [risks, setRisks] = useState<RiskItem[]>([]);
    const [swotItems, setSwotItems] = useState<SwotItem[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedSwotItems, setSelectedSwotItems] = useState<string[]>([]);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Get Company
            const { data: company } = await supabase
                .from('company_info')
                .select('id')
                .eq('owner_id', user?.id)
                .single();

            if (company) {
                setCompanyId(company.id);

                // Get risks from database (including swot_id)
                const { data: risksData } = await supabase
                    .from('risks_opportunities')
                    .select('*')
                    .eq('company_id', company.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                setRisks(risksData || []);

                // Get imported SWOT IDs (for items with swot_id)
                const importedSwotIds = new Set(
                    (risksData || [])
                        .map(r => r.swot_id)
                        .filter((id): id is string => id !== null)
                );

                // Get imported descriptions (fallback for legacy items without swot_id)
                const importedDescriptions = new Set(
                    (risksData || [])
                        .filter(r => r.origin?.includes('SWOT'))
                        .map(r => r.description.replace(/\s*\(Origem:.*?\)$/, '').trim())
                );

                // Get SWOT items that haven't been imported yet
                const { data: swotData } = await supabase
                    .from('swot_analysis')
                    .select('id, description, type')
                    .eq('company_id', company.id)
                    .eq('is_active', true);

                // Filter out already imported items (by ID or description)
                const availableSwotItems = (swotData || []).filter(
                    item => !importedSwotIds.has(item.id) && !importedDescriptions.has(item.description.trim())
                );
                setSwotItems(availableSwotItems);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleImportSwot = async () => {
        if (!companyId) return;

        try {
            const newRisks = selectedSwotItems.map(id => {
                const item = swotItems.find(i => i.id === id);
                if (!item) return null;

                return {
                    company_id: companyId,
                    swot_id: item.id,
                    type: item.type === 'forca' || item.type === 'oportunidade' ? 'opportunity' : 'risk',
                    origin: `SWOT - ${item.type === 'forca' ? 'Força' : item.type === 'fraqueza' ? 'Fraqueza' : item.type === 'oportunidade' ? 'Oportunidade' : 'Ameaça'}`,
                    description: item.description,
                    probability: 1,
                    impact: 1,
                    action_plan: 'Definir plano de ação...',
                    status: 'active'
                };
            }).filter((r): r is any => r !== null);

            const { error } = await supabase
                .from('risks_opportunities')
                .insert(newRisks);

            if (error) throw error;

            setIsImportModalOpen(false);
            setSelectedSwotItems([]);
            await loadData(); // Reload to show new items and update available SWOT items
            alert(`${newRisks.length} itens importados com sucesso!`);
        } catch (error: any) {
            alert('Erro ao importar: ' + error.message);
        }
    };

    const toggleSwotSelection = (id: string) => {
        setSelectedSwotItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredRisks = risks.filter(risk =>
        risk.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.action_plan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#025159]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-7 h-7 text-[#025159]" />
                        <h1 className="text-2xl font-bold text-[#025159]">Matriz de Riscos e Oportunidades</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Gestão baseada em riscos (ISO 9001: 6.1)
                    </p>
                </div>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 bg-[#025159] text-white px-4 py-2.5 rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                >
                    <Download size={20} />
                    <span>Importar da SWOT</span>
                </button>
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
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
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
                                {swotItems.length > 0 ? swotItems.map(item => (
                                    <label
                                        key={item.id}
                                        className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedSwotItems.includes(item.id)
                                            ? 'border-[#025159] bg-[#025159]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSwotItems.includes(item.id)}
                                            onChange={() => toggleSwotSelection(item.id)}
                                            className="mt-1 w-5 h-5 text-[#025159] border-gray-300 rounded focus:ring-[#025159]"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${item.type === 'forca' ? 'bg-green-100 text-green-700' :
                                                    item.type === 'fraqueza' ? 'bg-orange-100 text-orange-700' :
                                                        item.type === 'oportunidade' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.type === 'forca' ? 'Força' :
                                                        item.type === 'fraqueza' ? 'Fraqueza' :
                                                            item.type === 'oportunidade' ? 'Oportunidade' : 'Ameaça'}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 font-medium">{item.description}</p>
                                        </div>
                                    </label>
                                )) : (
                                    <p className="text-center text-gray-500 py-8">Nenhum item SWOT encontrado. Adicione itens na Análise de Contexto primeiro.</p>
                                )}
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
                                className="px-6 py-2 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#3F858C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
