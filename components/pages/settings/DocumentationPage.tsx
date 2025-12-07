import React from 'react';
import { PageHeader } from '../../common/PageHeader';
import { BookOpen, Target, Shield, FileText, Settings, Users, BarChart3, Briefcase } from 'lucide-react';

interface DocCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    category: string;
}

const DocCard: React.FC<DocCardProps> = ({ title, description, icon: Icon, category }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${category === 'Estratégia' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                category === 'Execução' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#025159] transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
    </div>
);

export const DocumentationPage: React.FC = () => {
    const docs: DocCardProps[] = [
        // Estratégia
        {
            title: 'Como fazer a Análise SWOT',
            description: 'Guia passo a passo para identificar Forças, Fraquezas, Oportunidades e Ameaças.',
            icon: Target,
            category: 'Estratégia'
        },
        {
            title: 'Matriz de Riscos e Oportunidades',
            description: 'Aprenda a classificar e tratar riscos conforme a ISO 9001.',
            icon: Shield,
            category: 'Estratégia'
        },
        // Execução
        {
            title: 'Gestão de Documentos (GED)',
            description: 'Como criar, revisar e aprovar documentos controlados.',
            icon: FileText,
            category: 'Execução'
        },
        {
            title: 'Avaliação de Fornecedores',
            description: 'Critérios e fluxo para qualificação de fornecedores.',
            icon: Users,
            category: 'Execução'
        },
        // Melhoria
        {
            title: 'Registrando RNCs',
            description: 'Fluxo correto para registrar e tratar não conformidades.',
            icon: Settings,
            category: 'Melhoria'
        },
        {
            title: 'Realizando Auditorias',
            description: 'Planejamento e execução de auditorias internas.',
            icon: Briefcase,
            category: 'Melhoria'
        },
        {
            title: 'Indicadores de Desempenho',
            description: 'Como definir e monitorar seus KPIs no dashboard.',
            icon: BarChart3,
            category: 'Melhoria'
        }
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                icon={BookOpen}
                title="Documentação do Sistema"
                subtitle="Manuais e tutoriais de uso"
            />

            <div className="grid gap-8">
                {/* Seção Estratégia */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                        Estratégia e Planejamento
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docs.filter(d => d.category === 'Estratégia').map((doc, idx) => (
                            <DocCard key={idx} {...doc} />
                        ))}
                    </div>
                </section>

                {/* Seção Execução */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                        Execução e Operação
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docs.filter(d => d.category === 'Execução').map((doc, idx) => (
                            <DocCard key={idx} {...doc} />
                        ))}
                    </div>
                </section>

                {/* Seção Melhoria */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                        Avaliação e Melhoria
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docs.filter(d => d.category === 'Melhoria').map((doc, idx) => (
                            <DocCard key={idx} {...doc} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
