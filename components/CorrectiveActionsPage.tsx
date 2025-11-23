import React, { useState } from 'react';
import { ClipboardList, X, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

type ActionStatus = 'Planejamento' | 'Em Andamento' | 'Verificar Eficácia' | 'Concluída';

interface CorrectiveAction {
    id: string;
    origin: string;
    issue: string;
    root_cause: string;
    responsible: string;
    deadline: string;
    status: ActionStatus;
    tasks?: { id: number; description: string; completed: boolean }[];
    effectiveness_check?: { problem_recurred: boolean | null; notes: string };
}

const MOCK_ACTIONS: CorrectiveAction[] = [
    {
        id: 'AC-01',
        origin: 'Auditoria Interna',
        issue: 'Documento obsoleto na produção',
        root_cause: 'Falha na comunicação de novas versões',
        responsible: 'João Silva',
        deadline: '2024-02-20',
        status: 'Verificar Eficácia'
    },
    {
        id: 'AC-02',
        origin: 'Reclamação Cliente',
        issue: 'Produto entregue com defeito',
        root_cause: 'Matéria prima de baixa qualidade',
        responsible: 'Maria Souza',
        deadline: '2023-12-10',
        status: 'Em Andamento'
    },
    {
        id: 'AC-03',
        origin: 'Não Conformidade NC-15',
        issue: 'Falha na calibração do equipamento X',
        root_cause: 'Falta de procedimento preventivo',
        responsible: 'Carlos Lima',
        deadline: '2024-12-30',
        status: 'Planejamento'
    }
];

export const CorrectiveActionsPage: React.FC = () => {
    const [actions] = useState<CorrectiveAction[]>(MOCK_ACTIONS);
    const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'pending'>('all');

    const getStatusBadge = (status: ActionStatus) => {
        const statusConfig = {
            'Planejamento': { className: 'bg-gray-100 text-gray-700', icon: Clock },
            'Em Andamento': { className: 'bg-blue-100 text-blue-700', icon: Clock },
            'Verificar Eficácia': { className: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
            'Concluída': { className: 'bg-green-100 text-green-700', icon: CheckCircle }
        };

        const config = statusConfig[status];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                <Icon size={14} />
                {status}
            </span>
        );
    };

    const isOverdue = (deadline: string) => {
        return new Date(deadline) < new Date();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleManageAction = (action: CorrectiveAction) => {
        setSelectedAction(action);
        setIsModalOpen(true);
    };

    const filteredActions = actions.filter(action => {
        if (filterTab === 'mine') {
            // TODO: Filter by current user
            return true;
        }
        if (filterTab === 'pending') {
            return action.status === 'Verificar Eficácia';
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Ações Corretivas</h2>
                    <p className="text-sm text-gray-500 mt-1">Investigação de causas raízes e planos de ação (ISO 9001: 10.2)</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterTab === 'all'
                                ? 'bg-isotek-100 text-isotek-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilterTab('mine')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterTab === 'mine'
                                ? 'bg-isotek-100 text-isotek-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Minhas Ações
                    </button>
                    <button
                        onClick={() => setFilterTab('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterTab === 'pending'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Pendentes de Eficácia
                    </button>
                </div>
            </div>

            {/* Actions Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ID / Origem
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Descrição do Problema
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Causa Raiz
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Responsável
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Prazo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredActions.map((action) => (
                                <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">{action.id}</div>
                                            <div className="text-xs text-gray-500">{action.origin}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {action.issue}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 max-w-xs truncate">
                                            {action.root_cause}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-isotek-500 to-isotek-600 flex items-center justify-center text-white font-bold text-xs">
                                                {getInitials(action.responsible)}
                                            </div>
                                            <span className="text-sm text-gray-900">{action.responsible}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className={`text-sm font-medium ${isOverdue(action.deadline)
                                                    ? 'text-red-600'
                                                    : 'text-gray-600'
                                                }`}
                                        >
                                            {formatDate(action.deadline)}
                                            {isOverdue(action.deadline) && (
                                                <span className="ml-2 text-xs">(Atrasado)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(action.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleManageAction(action)}
                                            className="flex items-center gap-2 px-3 py-2 bg-isotek-600 text-white text-sm font-medium rounded-lg hover:bg-isotek-700 transition-colors"
                                        >
                                            <ClipboardList size={16} />
                                            Gerenciar Plano
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Plan Management Modal */}
            {isModalOpen && selectedAction && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Plano de Ação: {selectedAction.id}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedAction.issue}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Step 1: Root Cause Analysis */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                        1
                                    </div>
                                    <h4 className="font-semibold text-gray-900">Análise de Causa Raiz</h4>
                                </div>
                                <div className="ml-10">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Por que o problema ocorreu? (5 Porquês / Ishikawa)
                                    </label>
                                    <textarea
                                        defaultValue={selectedAction.root_cause}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                        rows={4}
                                        placeholder="Descreva a análise de causa raiz..."
                                    />
                                </div>
                            </div>

                            {/* Step 2: Action Plan */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                        2
                                    </div>
                                    <h4 className="font-semibold text-gray-900">O que será feito?</h4>
                                </div>
                                <div className="ml-10 space-y-2">
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            defaultChecked={false}
                                            className="mt-1 w-4 h-4 text-isotek-600 border-gray-300 rounded focus:ring-isotek-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">Revisar e atualizar o procedimento operacional</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            defaultChecked={false}
                                            className="mt-1 w-4 h-4 text-isotek-600 border-gray-300 rounded focus:ring-isotek-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">Treinar equipe sobre nova versão do documento</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            defaultChecked={false}
                                            className="mt-1 w-4 h-4 text-isotek-600 border-gray-300 rounded focus:ring-isotek-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">Implementar sistema de notificação de mudanças documentais</p>
                                        </div>
                                    </div>
                                    <button className="text-sm text-isotek-600 hover:text-isotek-700 font-medium mt-2">
                                        + Adicionar nova tarefa
                                    </button>
                                </div>
                            </div>

                            {/* Step 3: Effectiveness Verification */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                                        3
                                    </div>
                                    <h4 className="font-semibold text-gray-900">Verificação de Eficácia</h4>
                                </div>
                                <div className="ml-10 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            O problema voltou a ocorrer após as ações implementadas?
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="recurred"
                                                    value="yes"
                                                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                                />
                                                <span className="text-sm text-gray-700">Sim (Ação ineficaz)</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="recurred"
                                                    value="no"
                                                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                                />
                                                <span className="text-sm text-gray-700">Não (Ação eficaz)</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Observações da Auditoria
                                        </label>
                                        <textarea
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                            rows={3}
                                            placeholder="Descreva as evidências da verificação..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
                            <button
                                onClick={() => {
                                    alert('Ação salva com sucesso!');
                                    setIsModalOpen(false);
                                }}
                                className="flex-1 px-4 py-2.5 bg-isotek-600 text-white font-medium rounded-lg hover:bg-isotek-700 transition-colors"
                            >
                                Salvar Alterações
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Tem certeza que deseja encerrar esta ação corretiva?')) {
                                        alert('Ação encerrada!');
                                        setIsModalOpen(false);
                                    }
                                }}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Encerrar Ação
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
