import React from 'react';
import { BookOpen, Map, FileText, CheckCircle, Search, PlayCircle } from 'lucide-react';
import { PageHeader } from '../../common/PageHeader';

export const DocumentationPage: React.FC = () => {
    const sections = [
        {
            title: 'Planejamento Estratégico',
            icon: Map,
            color: 'bg-purple-100 text-purple-600',
            items: ['Como fazer a Análise SWOT', 'Definindo Partes Interessadas', 'Matriz de Riscos e Oportunidades']
        },
        {
            title: 'Execução e Operação',
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
            items: ['Gestão de Documentos (GED)', 'Controle de Fornecedores', 'Matriz de Competências']
        },
        {
            title: 'Melhoria Contínua',
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
            items: ['Registrando uma RNC', 'Realizando Auditorias', 'Ações Corretivas']
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Documentação do Sistema"
                subtitle="Manuais, tutoriais e guias de uso do Isotek."
            />

            {/* Search Bar Placeholder */}
            <div className="relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="O que você precisa aprender hoje?"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#025159]/20 transition-all shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${section.color}`}>
                                <section.icon size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        </div>
                        <div className="p-2">
                            {section.items.map((item, i) => (
                                <button key={i} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center justify-between group transition-colors">
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900">{item}</span>
                                    <PlayCircle size={16} className="text-gray-300 group-hover:text-[#025159]" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
