import React from 'react';
import { Filter, Download, Plus, MoreVertical, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { NonConformance } from '../types';

const mockNCs: NonConformance[] = [
    { id: '1', code: 'NC-2023-089', description: 'Falha na calibração do equipamento de medição XYZ-01.', source: 'Auditoria Interna', status: 'Open', dateOpened: '2023-10-15', severity: 'Major' },
    { id: '2', code: 'NC-2023-090', description: 'Documentação de projeto incompleta na fase 2.', source: 'Análise Crítica', status: 'Analysis', dateOpened: '2023-10-18', severity: 'Minor' },
    { id: '3', code: 'NC-2023-091', description: 'Matéria-prima fora da especificação (Lote 554).', source: 'Inspeção de Recebimento', status: 'Implementation', dateOpened: '2023-10-20', severity: 'Critical' },
    { id: '4', code: 'NC-2023-088', description: 'Atraso na entrega do relatório mensal.', source: 'Reclamação de Cliente', status: 'Closed', dateOpened: '2023-10-01', severity: 'Minor' },
];

export const SectionMelhoria: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-7 h-7 text-[#025159]" />
                        <h1 className="text-2xl font-bold text-[#025159]">Não Conformidades e Ações Corretivas (10.2)</h1>
                    </div>
                    <p className="text-gray-500 text-sm">Gestão de desvios e planos de ação para melhoria contínua.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <Filter size={16} />
                        Filtrar
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <Download size={16} />
                        Exportar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#025159] text-white text-sm font-medium rounded-lg hover:bg-[#025159]/90 transition-colors shadow-sm">
                        <Plus size={16} />
                        Nova RNC
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Código</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Descrição</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Origem</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Severidade</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockNCs.map((nc) => (
                                <tr key={nc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{nc.code}</td>
                                    <td className="px-6 py-4 text-gray-600 max-w-md truncate">{nc.description}</td>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{nc.source}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${nc.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                            nc.severity === 'Major' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {nc.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={nc.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Mostrando 4 de 28 registros</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">Anterior</button>
                        <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">Próximo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        Open: { icon: AlertCircle, color: 'text-red-700 bg-red-50 ring-red-600/20', label: 'Aberta' },
        Analysis: { icon: Clock, color: 'text-amber-700 bg-amber-50 ring-amber-600/20', label: 'Em Análise' },
        Implementation: { icon: Clock, color: 'text-blue-700 bg-blue-50 ring-blue-600/20', label: 'Implementação' },
        Closed: { icon: CheckCircle, color: 'text-green-700 bg-green-50 ring-green-600/20', label: 'Concluída' },
    };
    // @ts-ignore - basic index access
    const current = config[status] || config.Open;
    const Icon = current.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${current.color}`}>
            <Icon size={12} />
            {current.label}
        </span>
    );
};