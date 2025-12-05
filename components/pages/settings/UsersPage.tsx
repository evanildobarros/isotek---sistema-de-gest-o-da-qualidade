import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Shield, Trash2, Edit2, X, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { PageHeader } from '../../common/PageHeader';

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
  const { user, company, isSuperAdmin } = useAuthContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, [isSuperAdmin, company?.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('[UsersPage] Iniciando fetchUsers...');
      console.log('[UsersPage] isSuperAdmin:', isSuperAdmin);
      console.log('[UsersPage] company:', company);

      // Primeiro tenta a RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_with_emails');

      if (!rpcError && rpcData && rpcData.length > 0) {
        console.log('[UsersPage] RPC sucesso! Dados:', rpcData);
        let mappedUsers = rpcData.map((u: any) => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          company_id: u.company_id,
          company_name: u.company_name
        }));

        // Se não for Super Admin, filtra apenas usuários da mesma empresa
        if (!isSuperAdmin && company?.id) {
          console.log('[UsersPage] Filtrando por company_id:', company.id);
          mappedUsers = mappedUsers.filter((u: UserProfile) => u.company_id === company.id);
        }

        setUsers(mappedUsers);
        return;
      }

      console.warn('[UsersPage] RPC falhou ou vazio, tentando fallback. Erro:', rpcError);

      // Fallback: Query direta na tabela profiles
      let query = supabase
        .from('profiles')
        .select('id, full_name, role, created_at, company_id')
        .order('created_at', { ascending: false });

      // Se não for Super Admin, filtra por company_id diretamente na query
      if (!isSuperAdmin && company?.id) {
        query = query.eq('company_id', company.id);
      }

      const { data: profilesData, error: profilesError } = await query;

      console.log('[UsersPage] Fallback profiles. Dados:', profilesData, 'Erro:', profilesError);

      if (profilesError) {
        console.error('[UsersPage] Erro no fallback:', profilesError);
        return;
      }

      // Mapear dados do fallback (sem email, pois profiles não tem essa coluna)
      const usersFromProfiles = (profilesData || []).map((u: any) => ({
        id: u.id,
        email: 'Email via RPC', // Placeholder
        full_name: u.full_name || 'Sem nome',
        role: u.role || 'user',
        created_at: u.created_at,
        company_id: u.company_id,
        company_name: ''
      }));

      console.log('[UsersPage] Usuários mapeados:', usersFromProfiles);
      setUsers(usersFromProfiles);

    } catch (error) {
      console.error('[UsersPage] Erro geral:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      // Primeiro tentamos chamar o RPC padrão (requer backend configurado).
      // Se o RPC não existir, fazemos um fallback inserindo um registro em `profiles`.
      try {
        const { data, error } = await supabase.rpc('invite_user_to_company', {
          p_email: formData.email,
          p_full_name: formData.fullName,
          p_role: formData.role,
          p_company_id: company?.id
        });

        if (error) throw error;

        alert('Usuário convidado com sucesso!');
        setShowModal(false);
        setFormData({ email: '', fullName: '', role: 'user' });
        fetchUsers();
      } catch (rpcError: any) {
        console.warn('RPC invite failed, attempting fallback insert into profiles:', rpcError?.message || rpcError);

        // Fallback: tentar inserir na tabela `profiles` (caso o projeto permita).
        // Primeiro tentamos incluir o campo `invited: true` (se existir). Se falhar por coluna desconhecida, tentamos sem ele.
        try {
          // tentativa com invited
          const insertPayload: any = { email: formData.email, full_name: formData.fullName, role: formData.role, company_id: company?.id, invited: true };
          let { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert([insertPayload]);

          if (insertError) {
            // Se o erro indicar coluna desconhecida (fallback), refazer sem `invited`
            const msg = (insertError?.message || '').toString().toLowerCase();
            if (msg.includes('column') && msg.includes('invited')) {
              console.warn('Column `invited` not found in profiles, retrying insert without it.');
              const { data: insertData2, error: insertError2 } = await supabase
                .from('profiles')
                .insert([{ email: formData.email, full_name: formData.fullName, role: formData.role, company_id: company?.id }]);

              if (insertError2) throw insertError2;
              insertData = insertData2;
            } else {
              throw insertError;
            }
          }

          alert('Usuário registrado (fallback) em profiles. Se necessário, configure o envio de convite por backend.');
          setShowModal(false);
          setFormData({ email: '', fullName: '', role: 'user' });
          fetchUsers();
        } catch (insertErr: any) {
          console.error('Fallback insert into profiles failed:', insertErr);
          // Mantemos mensagem original para indicar que o RPC precisa ser configurado
          alert('Erro ao convidar usuário (Nota: Esta função requer configuração de backend/RPC): ' + (rpcError?.message || insertErr?.message || 'Erro desconhecido'));
        }
      }

    } catch (error: any) {
      console.error('Error inviting user:', error);
      alert('Erro ao convidar usuário (Nota: Esta função requer configuração de backend/RPC): ' + error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Gerenciamento de Usuários"
        subtitle="Gerencie os membros da sua equipe e suas permissões de acesso."
        iconColor="blue"
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Convidar Usuário
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando usuários...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Função</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data de Entrada</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((userProfile) => (
                      <tr key={userProfile.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {userProfile.full_name?.charAt(0).toUpperCase() || userProfile.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{userProfile.full_name || 'Sem nome'}</p>
                              <p className="text-xs text-gray-500">{userProfile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userProfile.role === 'admin' || userProfile.role === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {userProfile.role === 'owner' ? 'Proprietário' : userProfile.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm text-gray-900">{userProfile.company_name || company?.name || '-'}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Hidden on desktop */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((userProfile) => (
                <div key={userProfile.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                        {userProfile.full_name?.charAt(0).toUpperCase() || userProfile.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{userProfile.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-gray-500 truncate">{userProfile.email}</p>
                      </div>
                    </div>
                    {/* Empresa vinculada (substitui botão de edição) */}
                    <div className="text-sm text-gray-900 flex-shrink-0 -mr-2">{userProfile.company_name || company?.name || '-'}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Função:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userProfile.role === 'admin' || userProfile.role === 'owner'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {userProfile.role === 'owner' ? 'Proprietário' : userProfile.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Data de Entrada:</span>
                      <span className="text-gray-900">{new Date(userProfile.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </>
      )}

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Convidar Novo Usuário</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="maria@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="user">Usuário (Acesso Padrão)</option>
                  <option value="admin">Administrador (Acesso Total)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] font-medium disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {inviteLoading ? 'Enviando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
