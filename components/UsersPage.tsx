import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, Edit2, Trash2, X, Save, Loader2, User as UserIcon } from 'lucide-react';

// Types
type UserRole = 'admin' | 'gestor' | 'auditor' | 'colaborador';

interface UserProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    department: string | null;
    role: UserRole;
    is_active: boolean;
}

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Users
    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handlers
    const handleEdit = (user: UserProfile) => {
        setEditingUser({ ...user });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            // Note: Deleting from auth.users is usually restricted to service_role. 
            // Here we might just set is_active to false or delete from profiles if allowed.
            // For this demo, we'll try to delete from profiles.
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== id));
            alert('Usuário removido com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir usuário.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingUser.full_name,
                    department: editingUser.department,
                    role: editingUser.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
            setIsModalOpen(false);
            alert('Usuário atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao atualizar usuário.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helpers
    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || '??';
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'gestor': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'auditor': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'colaborador': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
                    <p className="text-gray-600 mt-1">Gerencie os acessos e permissões dos colaboradores.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                    <UserPlus size={18} />
                    <span>Convidar Usuário</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou departamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Colaborador
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Departamento
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Função
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                                        <p className="mt-2 text-sm text-gray-500">Carregando usuários...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    {user.avatar_url ? (
                                                        <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url} alt="" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                            {getInitials(user.full_name || 'User')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{user.full_name || 'Sem nome'}</div>
                                                    <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.department || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Ativo
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Editar Usuário</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={editingUser.full_name || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                <input
                                    type="text"
                                    value={editingUser.department || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: Qualidade, Vendas..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Função (Role)</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="gestor">Gestor</option>
                                    <option value="auditor">Auditor</option>
                                    <option value="colaborador">Colaborador</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
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
