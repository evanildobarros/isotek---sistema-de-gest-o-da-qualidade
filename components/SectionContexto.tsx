import React, { useState } from 'react';
import { Plus, Trash2, MoreHorizontal, ArrowRight } from 'lucide-react';
import { SwotItem } from '../types';

const initialSwot: SwotItem[] = [
  { id: '1', type: 'strength', content: 'Equipe técnica altamente qualificada e certificada.', impact: 'High' },
  { id: '2', type: 'strength', content: 'Sistema de gestão da qualidade digitalizado.', impact: 'Medium' },
  { id: '3', type: 'weakness', content: 'Dependência de fornecedor único para matéria-prima X.', impact: 'High' },
  { id: '4', type: 'opportunity', content: 'Expansão para o mercado da América Latina.', impact: 'High' },
  { id: '5', type: 'threat', content: 'Instabilidade cambial afetando custos de importação.', impact: 'Medium' },
];

export const SectionContexto: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'swot' | 'stakeholders'>('swot');
  const [swotItems, setSwotItems] = useState<SwotItem[]>(initialSwot);

  const addItem = (type: SwotItem['type']) => {
    const newItem: SwotItem = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content: 'Novo item (editar)',
        impact: 'Medium'
    };
    setSwotItems([...swotItems, newItem]);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Contexto da Organização (4.1)</h2>
                <p className="text-sm text-gray-500 mt-1">Análise de fatores internos e externos que afetam o SGQ.</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('swot')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'swot' ? 'bg-white text-isotek-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    Matriz SWOT
                </button>
                <button 
                    onClick={() => setActiveTab('stakeholders')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stakeholders' ? 'bg-white text-isotek-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    Partes Interessadas
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'swot' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SwotCard 
                title="Forças (Strengths)" 
                type="strength" 
                items={swotItems.filter(i => i.type === 'strength')} 
                color="emerald"
                onAdd={() => addItem('strength')}
              />
              <SwotCard 
                title="Fraquezas (Weaknesses)" 
                type="weakness" 
                items={swotItems.filter(i => i.type === 'weakness')} 
                color="amber"
                onAdd={() => addItem('weakness')}
              />
              <SwotCard 
                title="Oportunidades (Opportunities)" 
                type="opportunity" 
                items={swotItems.filter(i => i.type === 'opportunity')} 
                color="blue"
                onAdd={() => addItem('opportunity')}
              />
              <SwotCard 
                title="Ameaças (Threats)" 
                type="threat" 
                items={swotItems.filter(i => i.type === 'threat')} 
                color="red"
                onAdd={() => addItem('threat')}
              />
          </div>
      )}

      {activeTab === 'stakeholders' && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UsersIcon className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Módulo de Partes Interessadas</h3>
                  <p className="text-gray-500 mt-2">Gerencie as necessidades e expectativas de clientes, fornecedores e colaboradores.</p>
                  <button className="mt-6 px-4 py-2 bg-isotek-600 text-white text-sm font-medium rounded-lg hover:bg-isotek-700 transition-colors">
                      Configurar Partes Interessadas
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper subcomponents
const UsersIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

interface SwotCardProps {
    title: string;
    type: string;
    items: SwotItem[];
    color: 'emerald' | 'amber' | 'blue' | 'red';
    onAdd: () => void;
}

const SwotCard: React.FC<SwotCardProps> = ({ title, items, color, onAdd }) => {
    const colorClasses = {
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        amber: 'border-amber-200 bg-amber-50 text-amber-800',
        blue: 'border-blue-200 bg-blue-50 text-blue-800',
        red: 'border-red-200 bg-red-50 text-red-800'
    };
    
    const badgeClasses = {
        emerald: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        blue: 'bg-blue-100 text-blue-700',
        red: 'bg-red-100 text-red-700'
    };

    return (
        <div className={`rounded-xl border ${colorClasses[color].split(' ')[0]} bg-white h-full flex flex-col shadow-sm overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ').slice(1).join(' ')} flex justify-between items-center`}>
                <h3 className="font-semibold">{title}</h3>
                <button onClick={onAdd} className="p-1 hover:bg-white/50 rounded transition-colors">
                    <Plus size={16} />
                </button>
            </div>
            <div className="p-4 flex-1 space-y-3">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm italic">Nenhum item registrado.</div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="group flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white transition-all">
                            <div className="flex-1">
                                <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${badgeClasses[color]}`}>
                                        {item.impact} Impact
                                    </span>
                                </div>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};