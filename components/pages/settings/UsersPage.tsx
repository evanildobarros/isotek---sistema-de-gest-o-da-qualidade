import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Shield, Trash2, Edit2, X, Check, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { PageHeader } from '../../common/PageHeader';
import { usePlanLimits } from '../../../hooks/usePlanLimits';
import { ConfirmModal } from '../../common/ConfirmModal';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
  company_id?: string;
  company_name?: string;
}

export const UsersPage: React.FC = () => {
  const { user: currentUser, company, isSuperAdmin } = useAuthContext();
  const { usage, canAddUser, refresh: refreshLimits, planName } = usePlanLimits();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'operator' as 'admin' | 'operator' | 'viewer' | 'auditor'
  });

  useEffect(() => {
    fetchUsers();
  }, [isSuperAdmin, company?.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Busca usuários via RPC para garantir acesso seguro e incluir e-mails
      const { data, error } = await supabase.rpc('get_users_with_emails');

      if (error) throw error;

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddUser) {
      toast.error('Limite de usuários do seu plano atingido.');
      return;
    }

    setInviteLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role
        }
      });

      if (error) {
        console.error('Invoke error details:', error);
        let errorMsg = error.message || 'Erro ao enviar convite.';

        // Supabase FunctionsHttpError costuma ter o corpo da resposta
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body && body.error) errorMsg = body.error;
          }
        } catch (e) {
          console.error('Error parsing error body:', e);
        }

        throw new Error(errorMsg);
      }

      toast.success('Convite enviado com sucesso!');
      setShowModal(false);
      setFormData({ email: '', fullName: '', role: 'operator' });
      fetchUsers();
      refreshLimits();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Erro ao convidar usuário.');
    } finally {
      setInviteLoading(false);
    }
  };

  const openDeleteModal = (user: UserProfile) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const id = userToDelete.id;
    setShowDeleteModal(false);
    setDeletingId(id);

    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: id }
      });

      if (error) {
        // Tentar extrair a mensagem do erro
        let errorMessage = error.message || 'Erro desconhecido';
        if (error.context) {
          try {
            const jsonData = await error.context.json();
            if (jsonData?.error) {
              errorMessage = jsonData.error;
            }
          } catch (e) {
            // Não conseguiu parsear o JSON
          }
        }
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Usuário removido com sucesso.');
      fetchUsers();
      refreshLimits();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao remover usuário.');
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setIsUpdatingRole(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Permissão atualizada com sucesso!');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar permissão.');
    } finally {
      setIsUpdatingRole(false);
    }
  };


  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">Administrador</span>;
      case 'operator':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">Operador</span>;
      case 'viewer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">Visualizador</span>;
      case 'auditor':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">Auditor</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">{role}</span>;
    }
  };

  const usersPercentage = Math.min((usage.usersUsed / usage.usersLimit) * 100, 100);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Gerenciamento de Equipe"
        subtitle="Gerencie seus colaboradores, permissões e convites."
        iconColor="blue"
      />

      {/* KPI Card - Plan Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Usuários da Empresa</p>
              <h3 className="text-2xl font-bold text-gray-800">{usage.usersUsed} <span className="text-gray-300 font-normal">/ {usage.usersLimit}</span></h3>
            </div>
            <div className={`p-2 rounded-xl ${usage.usersUsed >= usage.usersLimit ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${usage.usersUsed >= usage.usersLimit ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${usersPercentage}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Plano atual: <span className="font-bold text-gray-700">{planName}</span>
          </p>
        </div>

        {/* Placeholder for other KPIs if needed */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#025159] to-[#037380] p-6 rounded-2xl text-white flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="font-bold text-lg mb-1">Aumente sua produtividade hoje</h4>
            <p className="text-blue-100 text-sm max-w-sm">Dúvidas sobre permissões? Nossa IA Consultora pode te ajudar a configurar os acessos da sua equipe.</p>
          </div>
          <Shield className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 rotate-12" />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!canAddUser && (
            <div className="hidden lg:flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Limite atingido</span>
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            disabled={!canAddUser}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-all font-semibold shadow-sm hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Convidar Usuário
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-[3px] border-[#025159] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400 font-medium">Sincronizando equipe...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Permissão</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Acesso desde</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((profile) => {
                    const isSelf = profile.id === currentUser?.id;
                    const canDelete = !isSelf && (isSuperAdmin || (company?.id === profile.company_id && currentUser?.id !== profile.id));

                    return (
                      <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 uppercase">
                              {profile.full_name?.charAt(0) || profile.email?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{profile.full_name || 'Usuário em Convite'}</p>
                              <p className="text-xs text-gray-400 font-medium">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(profile.role)}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {new Date(profile.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">

                            {canDelete && (
                              <button
                                onClick={() => openDeleteModal(profile)}
                                disabled={deletingId === profile.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Remover usuário"
                              >
                                {deletingId === profile.id ? <div className="animate-spin w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => setEditingUser(profile)}
                              className="p-2 text-gray-400 hover:text-[#025159] hover:bg-teal-50 rounded-lg transition-all"
                              title="Editar permissões"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="max-w-[180px] mx-auto opacity-40 mb-3">
                        <Users className="w-12 h-12 mx-auto text-gray-300" />
                      </div>
                      <p className="text-gray-400 font-medium">Nenhum colaborador encontrado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Novo Convite</h3>
                  <p className="text-xs text-gray-500">Envie um convite para o e-mail do colaborador.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-medium"
                    placeholder="Ex: Pedro Henrique"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-medium"
                  placeholder="pedro.henrique@isotek.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo / Permissão</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="operator">Operador (Uso Padrão)</option>
                  <option value="admin">Administrador (Total)</option>
                  <option value="viewer">Visualizador (Apenas Leitura)</option>
                  <option value="auditor">Auditor (Especial)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 text-gray-500 rounded-xl hover:bg-gray-100 font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-[2] px-4 py-3 bg-[#025159] text-white rounded-xl hover:bg-[#3F858C] font-bold shadow-lg shadow-teal-900/10 disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                >
                  {inviteLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      <span>Enviando Convite...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Enviar Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteUser}
        title="Remover Usuário"
        message={`Tem certeza que deseja remover ${userToDelete?.full_name || userToDelete?.email || 'este usuário'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-[#025159] rounded-xl">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Editar Permissão</h3>
                  <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{editingUser.full_name || editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Novo Cargo / Permissão</label>
                <select
                  defaultValue={editingUser.role}
                  onChange={e => handleUpdateRole(editingUser.id, e.target.value)}
                  disabled={isUpdatingRole}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none cursor-pointer text-sm"
                >
                  <option value="operator">Operador (Uso Padrão)</option>
                  <option value="admin">Administrador (Total)</option>
                  <option value="viewer">Visualizador (Apenas Leitura)</option>
                  <option value="auditor">Auditor (Especial)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 text-gray-500 rounded-xl hover:bg-gray-100 font-bold transition-all text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

