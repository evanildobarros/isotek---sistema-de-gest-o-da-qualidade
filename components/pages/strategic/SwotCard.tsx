import { AlertCircle, Plus, Trash2, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '../../../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { ConfirmModal } from '../../common/ConfirmModal';

interface SwotItem {
    id: string;
    description: string;
    impact: 'alto' | 'medio' | 'baixo';
    type: string;
    created_at?: string;
}

interface SwotCardProps {
    type: 'strength' | 'weakness' | 'opportunity' | 'threat';
}

const typeConfig = {
    strength: {
        title: 'Forças',
        dbValue: 'forca',
        color: {
            border: 'border-green-300',
            bg: 'bg-green-50',
            text: 'text-green-800',
            button: 'bg-green-600 hover:bg-green-700',
            badgeHigh: 'bg-green-700 text-white',
            badgeMedium: 'bg-green-500 text-white',
            badgeLow: 'bg-green-300 text-green-800'
        }
    },
    weakness: {
        title: 'Fraquezas',
        dbValue: 'fraqueza',
        color: {
            border: 'border-orange-300',
            bg: 'bg-orange-50',
            text: 'text-orange-800',
            button: 'bg-orange-600 hover:bg-orange-700',
            badgeHigh: 'bg-orange-700 text-white',
            badgeMedium: 'bg-orange-500 text-white',
            badgeLow: 'bg-orange-300 text-orange-800'
        }
    },
    opportunity: {
        title: 'Oportunidades',
        dbValue: 'oportunidade',
        color: {
            border: 'border-teal-300',
            bg: 'bg-teal-50',
            text: 'text-teal-800',
            button: 'bg-[#025159] hover:bg-[#3F858C]',
            badgeHigh: 'bg-[#025159] text-white',
            badgeMedium: 'bg-[#3F858C] text-white',
            badgeLow: 'bg-teal-300 text-teal-800'
        }
    },
    threat: {
        title: 'Ameaças',
        dbValue: 'ameaca',
        color: {
            border: 'border-red-300',
            bg: 'bg-red-50',
            text: 'text-red-800',
            button: 'bg-red-600 hover:bg-red-700',
            badgeHigh: 'bg-red-700 text-white',
            badgeMedium: 'bg-red-500 text-white',
            badgeLow: 'bg-red-300 text-red-800'
        }
    }
};

// Mock data for offline mode
const getMockData = (type: string): SwotItem[] => {
    if (type === 'strength') {
        return [
            {
                id: '1',
                description: 'Equipe técnica altamente qualificada e certificada.',
                impact: 'alto',
                type: 'forca'
            },
            {
                id: '2',
                description: 'Sistema de gestão da qualidade digitalizado.',
                impact: 'medio',
                type: 'forca'
            }
        ];
    }
    return [];
};

export const SwotCard: React.FC<SwotCardProps> = ({ type }) => {
    const config = typeConfig[type];
    const { user, effectiveCompanyId } = useAuthContext();

    const [items, setItems] = useState<SwotItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processedItems, setProcessedItems] = useState<Set<string>>(new Set());

    // Form state
    const [description, setDescription] = useState('');
    const [impact, setImpact] = useState<'alto' | 'medio' | 'baixo'>('medio');

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    // Load items
    useEffect(() => {
        if (isSupabaseConfigured) {
            loadItems();
        } else {
            // Use mock data in offline mode
            setItems(getMockData(config.dbValue));
        }
    }, [type]);

    const loadItems = async () => {
        try {
            // Verificar se temos o ID da empresa (seja do usuário ou via auditoria)
            if (!effectiveCompanyId) {
                console.warn('Empresa não identificada');
                setItems([]);
                return;
            }

            const { data, error } = await supabase
                .from('swot_analysis')
                .select('id, description, impact, type, is_active, company_id, created_at')
                .eq('type', config.dbValue)
                .eq('company_id', effectiveCompanyId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
            // Fallback to mock data
            setItems(getMockData(config.dbValue));
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsLoading(true);

        // Offline mode - add to local state only
        if (!isSupabaseConfigured) {
            const newItem: SwotItem = {
                id: Date.now().toString(),
                description: description.trim(),
                impact: impact,
                type: config.dbValue
            };
            setItems([newItem, ...items]);
            setDescription('');
            setImpact('medio');
            setIsModalOpen(false);
            setIsLoading(false);
            toast.warning('Modo Offline: Item adicionado apenas localmente.');
            return;
        }

        // Online mode - save to Supabase
        try {
            if (!user || !effectiveCompanyId) {
                toast.warning('Você precisa estar logado para adicionar itens.');
                setIsLoading(false);
                return;
            }

            // Check if item already exists (active or inactive)
            const { data: existingItems, error: searchError } = await supabase
                .from('swot_analysis')
                .select('id, description, type, is_active, company_id')
                .eq('company_id', effectiveCompanyId)
                .eq('type', config.dbValue)
                .ilike('description', description.trim()); // Case-insensitive match

            if (searchError) throw searchError;

            let data;
            let error;

            if (existingItems && existingItems.length > 0) {
                // Item exists - update it
                const existingItem = existingItems[0];
                const { data: updatedData, error: updateError } = await supabase
                    .from('swot_analysis')
                    .update({
                        impact: impact,
                        is_active: true,
                        created_at: new Date().toISOString() // Bring to top
                    })
                    .eq('id', existingItem.id)
                    .select()
                    .single();

                data = updatedData;
                error = updateError;
            } else {
                // Item does not exist - insert new
                const { data: newData, error: insertError } = await supabase
                    .from('swot_analysis')
                    .insert([
                        {
                            description: description.trim(),
                            impact: impact,
                            type: config.dbValue,
                            is_active: true,
                            user_id: user.id,
                            company_id: effectiveCompanyId
                        }
                    ])
                    .select()
                    .single();

                data = newData;
                error = insertError;
            }

            if (error) throw error;

            // Update local state
            // If it was an update, we need to remove the old version from the list if it was there (unlikely if it was inactive, but possible if active)
            // and add the new version to the top.
            setItems(prev => {
                const filtered = prev.filter(item => item.id !== data.id);
                return [data, ...filtered];
            });

            setDescription('');
            setImpact('medio');
            setIsModalOpen(false);
            toast.success('Item salvo com sucesso!');
        } catch (error: any) {
            console.error('Erro ao adicionar item:', error);
            toast.error(`Erro ao adicionar item: ${error.message || 'Verifique sua conexão.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;

        // Offline mode
        if (!isSupabaseConfigured) {
            setItems(items.filter(item => item.id !== deleteModal.id));
            toast.warning('Modo Offline: Item removido apenas localmente.');
            return;
        }

        // Online mode
        try {
            const { error } = await supabase
                .from('swot_analysis')
                .update({ is_active: false })
                .eq('id', deleteModal.id);

            if (error) throw error;
            setItems(items.filter(item => item.id !== deleteModal.id));
            toast.success('Item removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover item:', error);
            toast.error('Erro ao remover item.');
        }
    };

    const handlePromoteToRisk = async (item: SwotItem) => {
        if (!isSupabaseConfigured) {
            toast.warning('Funcionalidade disponível apenas no modo online.');
            return;
        }

        if (!user) {
            toast.warning('Você precisa estar logado para realizar esta ação.');
            return;
        }

        const isRisk = item.type === 'fraqueza' || item.type === 'ameaca';
        const targetType = isRisk ? 'risk' : 'opportunity';
        const targetDescription = `${item.description} (Origem: Análise SWOT)`;

        try {
            const { error } = await supabase
                .from('risks_opportunities')
                .insert([
                    {
                        company_id: effectiveCompanyId,
                        swot_id: item.id,
                        description: targetDescription,
                        type: targetType,
                        origin: 'SWOT - Análise de Contexto',
                        probability: 1,
                        impact: 1,
                        action_plan: 'Definir plano de ação...',
                        status: 'active'
                    }
                ]);

            if (error) throw error;

            setProcessedItems(prev => new Set(prev).add(item.id));
            toast.success('Registro criado no Módulo de Planejamento! Acesse a tela de Riscos.');

        } catch (error: any) {
            console.error('Erro ao promover item:', error);
            toast.error(`Erro ao criar registro: ${error.message || 'Tente novamente.'}`);
        }
    };

    const getImpactBadgeClass = (itemImpact: SwotItem['impact']) => {
        switch (itemImpact) {
            case 'alto':
                return config.color.badgeHigh;
            case 'medio':
                return config.color.badgeMedium;
            case 'baixo':
                return config.color.badgeLow;
            default:
                return config.color.badgeMedium;
        }
    };

    const getImpactLabel = (itemImpact: SwotItem['impact']) => {
        const labels = {
            alto: 'ALTO IMPACTO',
            medio: 'MÉDIO IMPACTO',
            baixo: 'BAIXO IMPACTO'
        };
        return labels[itemImpact] || 'MÉDIO IMPACTO';
    };

    return (
        <>
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Remover Item"
                message="Deseja realmente remover este item?"
                confirmLabel="Remover"
                variant="danger"
            />

            <div className={`rounded-lg border ${config.color.border} bg-white shadow-sm overflow-hidden h-full flex flex-col`}>
                {/* Header */}
                <div className={`px-4 py-3 ${config.color.bg} ${config.color.text} flex justify-between items-center border-b ${config.color.border}`}>
                    <h3 className="font-bold text-base">{config.title}</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-1.5 hover:bg-white/50 rounded-md transition-colors"
                        title="Adicionar item"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {/* Offline Warning */}
                {!isSupabaseConfigured && (
                    <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2 text-xs text-yellow-800">
                        <AlertCircle size={14} />
                        <span>Modo Offline - Configure o Supabase para persistir dados</span>
                    </div>
                )}

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
                                        {item.description}
                                    </p>
                                    <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${getImpactBadgeClass(item.impact)}`}>
                                        {getImpactLabel(item.impact)}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePromoteToRisk(item);
                                        }}
                                        disabled={processedItems.has(item.id)}
                                        className={`flex-shrink-0 p-2 rounded-md transition-all ${processedItems.has(item.id)
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                            }`}
                                        title={processedItems.has(item.id) ? "Já processado" : "Gerar Risco/Oportunidade Associado"}
                                    >
                                        <Zap size={16} />
                                    </button>

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
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Adicionar {config.title.slice(0, -1)}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAddItem} className="space-y-4">
                            {/* Description Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descrição do Item *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Ex: Equipe técnica altamente qualificada..."
                                    required
                                />
                            </div>

                            {/* Impact Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nível de Impacto *
                                </label>
                                <select
                                    value={impact}
                                    onChange={(e) => setImpact(e.target.value as 'alto' | 'medio' | 'baixo')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="alto">Alto Impacto</option>
                                    <option value="medio">Médio Impacto</option>
                                    <option value="baixo">Baixo Impacto</option>
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-2.5 ${config.color.button} text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isLoading ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
