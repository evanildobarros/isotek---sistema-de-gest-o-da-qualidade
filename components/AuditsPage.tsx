import React, { useState } from 'react';
import { Pencil, Trash2, PlayCircle, Calendar, User, CheckCircle, Clock, AlertTriangle, Plus, ClipboardCheck } from 'lucide-react';

interface Audit {
    id: number;
    scope: string;
    type: string;
    auditor: string;
    date: string;
    status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Atrasada';
    progress: number;
}

const MOCK_AUDITS: Audit[] = [
    { id: 1, scope: 'Vendas e Marketing', type: 'Auditoria Interna', auditor: 'Carlos Silva', date: '2024-03-10', status: 'Concluída', progress: 100 },
    { id: 2, scope: 'Produção - Linha 1', type: 'Auditoria de Processo', auditor: 'Evanildo Barros', date: '2024-11-25', status: 'Agendada', progress: 0 },
    { id: 3, scope: 'Compras', type: 'Auditoria Interna', auditor: 'Ana Souza', date: '2024-11-20', status: 'Em Andamento', progress: 45 },
];

export const AuditsPage: React.FC = () => {
    const [audits, setAudits] = useState<Audit[]>(MOCK_AUDITS);
    const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Função de cores para Status
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Concluída':
                return 'bg-green-100 text-green-700 border border-green-200';
            case 'Em Andamento':
                return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
            case 'Agendada':
                return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'Atrasada':
                return 'bg-red-100 text-red-700 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Concluída':
                return <CheckCircle size={16} className="text-green-600" />;
            case 'Em Andamento':
                return <Clock size={16} className="text-yellow-600" />;
            case 'Agendada':
                return <Calendar size={16} className="text-blue-600" />;
            case 'Atrasada':
                return <AlertTriangle size={16} className="text-red-600" />;
            default:
                return null;
        }
    };

    // 2. COMPORTAMENTO - Função de Exclusão
    const handleDelete = (id: number) => {
        const audit = audits.find(a => a.id === id);
        if (window.confirm(`Tem certeza que deseja excluir a auditoria "${audit?.scope}"?`)) {
            setAudits(prevAudits => prevAudits.filter(a => a.id !== id));
            console.log(`Auditoria ${id} excluída com sucesso`);
        }
    };

    // Função de Edição
    const handleEdit = (id: number) => {
        const audit = audits.find(a => a.id === id);
        if (audit) {
            setSelectedAudit(audit);
            setIsModalOpen(true);
            console.log('Editando auditoria:', audit);
        }
    };

    // Função de Play (Iniciar/Continuar)
    const handlePlay = (id: number) => {
        const audit = audits.find(a => a.id === id);
        if (audit?.status === 'Agendada') {
            console.log(`Iniciando auditoria ${id}...`);
            alert(`Iniciando auditoria: ${audit.scope}`);
        } else if (audit?.status === 'Em Andamento') {
            console.log(`Continuando auditoria ${id}...`);
            alert(`Continuando auditoria: ${audit.scope}`);
        }
    };

    // Função para criar nova auditoria
    const handleCreate = () => {
        const newAudit: Audit = {
            id: Math.max(...audits.map(a => a.id), 0) + 1,
            scope: '',
            type: 'Auditoria Interna',
            auditor: '',
            date: new Date().toISOString().split('T')[0],
            status: 'Agendada',
            progress: 0
        };
        setSelectedAudit(newAudit);
        setIsCreating(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAudit(null);
        setIsCreating(false);
    };

    const saveEdit = () => {
        if (selectedAudit) {
            if (isCreating) {
                // Adicionar nova auditoria
                setAudits(prevAudits => [...prevAudits, selectedAudit]);
                alert('Auditoria criada com sucesso!');
            } else {
                // Atualizar auditoria existente
                setAudits(prevAudits =>
                    prevAudits.map(a => a.id === selectedAudit.id ? selectedAudit : a)
                );
                alert('Auditoria atualizada com sucesso!');
            }
            closeModal();
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ClipboardCheck className="w-7 h-7 text-[#025159]" />
                        <h1 className="text-2xl font-bold text-[#025159]">Gestão de Auditorias</h1>
                    </div>
                    <p className="text-gray-600 text-sm">Planeje, execute e gerencie auditorias internas e externas.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-[#025159] text-white font-semibold rounded-lg hover:bg-[#025159]/90 transition-colors shadow-md hover:shadow-lg"
                >
                    <Plus size={20} />
                    Nova Auditoria
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Agendadas</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {audits.filter(a => a.status === 'Agendada').length}
                            </p>
                        </div>
                        <Calendar className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Em Andamento</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {audits.filter(a => a.status === 'Em Andamento').length}
                            </p>
                        </div>
                        <Clock className="text-yellow-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Concluídas</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {audits.filter(a => a.status === 'Concluída').length}
                            </p>
                        </div>
                        <CheckCircle className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-800">{audits.length}</p>
                        </div>
                        <AlertTriangle className="text-gray-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Rich Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escopo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progresso</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {audits.map((audit) => (
                                <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {audit.scope}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                            {audit.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            {audit.auditor}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {new Date(audit.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(audit.status)}`}>
                                            {getStatusIcon(audit.status)}
                                            {audit.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${audit.progress === 100
                                                        ? 'bg-green-500'
                                                        : audit.progress > 0
                                                            ? 'bg-yellow-500'
                                                            : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${audit.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-600">{audit.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                            {/* Botão Play (contextual) */}
                                            {(audit.status === 'Agendada' || audit.status === 'Em Andamento') && (
                                                <button
                                                    onClick={() => handlePlay(audit.id)}
                                                    className="p-2 text-[#BF7B54] hover:text-[#8C512E] hover:bg-orange-50 rounded-lg transition-colors"
                                                    title={audit.status === 'Agendada' ? 'Iniciar' : 'Continuar'}
                                                >
                                                    <PlayCircle size={18} />
                                                </button>
                                            )}

                                            {/* Botão Editar */}
                                            <button
                                                onClick={() => handleEdit(audit.id)}
                                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>

                                            {/* Botão Excluir */}
                                            <button
                                                onClick={() => handleDelete(audit.id)}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Edição */}
            {isModalOpen && selectedAudit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-2xl font-bold text-[#8C512E] mb-6">
                            {isCreating ? 'Nova Auditoria' : 'Editar Auditoria'}
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Escopo</label>
                                <input
                                    type="text"
                                    value={selectedAudit.scope}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, scope: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <input
                                    type="text"
                                    value={selectedAudit.type}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auditor</label>
                                <input
                                    type="text"
                                    value={selectedAudit.auditor}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, auditor: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    value={selectedAudit.date}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={selectedAudit.status}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, status: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                >
                                    <option value="Agendada">Agendada</option>
                                    <option value="Em Andamento">Em Andamento</option>
                                    <option value="Concluída">Concluída</option>
                                    <option value="Atrasada">Atrasada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Progresso (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={selectedAudit.progress}
                                    onChange={(e) => setSelectedAudit({ ...selectedAudit, progress: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BF7B54] focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveEdit}
                                className="flex-1 px-4 py-2 bg-[#BF7B54] text-white rounded-lg hover:bg-[#8C512E] transition-colors font-semibold"
                            >
                                {isCreating ? 'Criar Auditoria' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
