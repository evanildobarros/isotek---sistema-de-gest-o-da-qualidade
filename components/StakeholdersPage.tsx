
import React, { useEffect, useState } from 'react';
import { Plus, Users, Building, Briefcase, Globe, Shield, Edit2, Trash2, X, Target, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Stakeholder } from '../types';

export const StakeholdersPage: React.FC = () => {
    const { user } = useAuthContext();
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Stakeholder>>({
        name: '',
        type: 'Cliente',
        needs: '',
        expectations: '',
        monitor_frequency: 'Anual'
    });

    useEffect(() => {
        fetchStakeholders();
    }, [user]);

    const fetchStakeholders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('stakeholders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStakeholders(data || []);
        } catch (error) {
            console.error('Erro ao buscar partes interessadas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (stakeholder?: Stakeholder) => {
        if (stakeholder) {
            setEditingId(stakeholder.id);
            setFormData({
                name: stakeholder.name,
                type: stakeholder.type,
                needs: stakeholder.needs,
                expectations: stakeholder.expectations,
                monitor_frequency: stakeholder.monitor_frequency
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                type: 'Cliente',
                needs: '',
                expectations: '',
                monitor_frequency: 'Anual'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            // Fetch user profile to get company_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Perfil não encontrado');

            const payload = {
                ...formData,
                company_id: profile.company_id
            };

            if (editingId) {
                const { error } = await supabase
                    .from('stakeholders')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('stakeholders')
                    .insert([payload]);
                if (error) throw error;
            }

            fetchStakeholders();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar parte interessada');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta parte interessada?')) return;

        try {
            const { error } = await supabase
                .from('stakeholders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchStakeholders();
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    };

    const getIconByType = (type: string) => {
        switch (type) {
            case 'Cliente': return <Users className="w-5 h-5 text-blue-500" />;
            case 'Fornecedor': return <Briefcase className="w-5 h-5 text-orange-500" />;
            case 'Governo': return <Globe className="w-5 h-5 text-green-500" />;
            case 'Colaborador': return <Building className="w-5 h-5 text-purple-500" />;
            case 'Sociedade': return <Users className="w-5 h-5 text-teal-500" />;
            default: return <Target className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Partes Interessadas Pertinentes</h1>
                    <p className="text-gray-500 mt-1">Gestão de stakeholders e seus requisitos (ISO 9001:2015 - 4.2)</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Parte
                </button>
            </div>

            <div className="grid gap-4">
                {stakeholders.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-6">
                        {/* Esquerda: Ícone e Nome */}
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                {getIconByType(item.type)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{item.name}</h3>
                                <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                                    {item.type}
                                </span>
                            </div>
                        </div>

                        {/* Meio: Necessidades e Expectativas */}
                        <div className="flex-1 grid grid-cols-2 gap-8 border-l border-r border-gray-100 px-8">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Necessidades (Requisitos)</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.needs}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expectativas (Desejável)</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.expectations}</p>
                            </div>
                        </div>

                        {/* Direita: Monitoramento e Ações */}
                        <div className="flex items-center gap-6 min-w-[150px] justify-end">
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-400 mb-1">Revisão</span>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {item.monitor_frequency}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenModal(item)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {stakeholders.length === 0 && !loading && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma parte interessada cadastrada</h3>
                        <p className="text-gray-500">Comece adicionando quem influencia sua organização.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingId ? 'Editar Parte Interessada' : 'Nova Parte Interessada'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Quem é? (Nome)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Clientes, Anvisa, Acionistas"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                                    >
                                        <option value="Cliente">Cliente</option>
                                        <option value="Fornecedor">Fornecedor</option>
                                        <option value="Governo">Governo</option>
                                        <option value="Colaborador">Colaborador</option>
                                        <option value="Sociedade">Sociedade</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">O que eles precisam? (Necessidade - Requisito mandatório)</label>
                                <textarea
                                    rows={3}
                                    value={formData.needs}
                                    onChange={e => setFormData({ ...formData, needs: e.target.value })}
                                    placeholder="Ex: Produtos conformes, entrega no prazo..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">O que eles esperam? (Expectativa - Desejável)</label>
                                <textarea
                                    rows={3}
                                    value={formData.expectations}
                                    onChange={e => setFormData({ ...formData, expectations: e.target.value })}
                                    placeholder="Ex: Atendimento rápido, inovação..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Frequência de Revisão</label>
                                <select
                                    value={formData.monitor_frequency}
                                    onChange={e => setFormData({ ...formData, monitor_frequency: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                                >
                                    <option value="Mensal">Mensal</option>
                                    <option value="Trimestral">Trimestral</option>
                                    <option value="Semestral">Semestral</option>
                                    <option value="Anual">Anual</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
