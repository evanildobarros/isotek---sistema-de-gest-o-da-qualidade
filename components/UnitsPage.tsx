import React, { useState, useEffect } from 'react';
import { Check, EyeOff, Plus, X, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Unit } from '../types';

export const UnitsPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_headquarters: false,
    cnpj: '',
    address: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    initializeCompany();
  }, [user]);

  const initializeCompany = async () => {
    if (!user) return;

    // First, try to find existing company where user is owner
    let { data: existingCompany, error: fetchError } = await supabase
      .from('company_info')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error fetching company:', fetchError);
    }

    // If no company exists, create one
    if (!existingCompany) {
      const { data: newCompany, error: createError } = await supabase
        .from('company_info')
        .insert([
          {
            name: 'Minha Empresa',
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating company:', createError);
        alert(`Erro ao criar empresa: ${createError.message || JSON.stringify(createError)}`);
        return;
      }

      existingCompany = newCompany;
    }

    if (existingCompany) {
      setCompanyId(existingCompany.id);
      loadUnits(existingCompany.id);
    }
  };

  const loadUnits = async (targetCompanyId?: string) => {
    const idToUse = targetCompanyId || companyId;
    if (!idToUse) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('company_id', idToUse)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading units:', error);
      alert('Erro ao carregar unidades');
    } else {
      setUnits(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code || '',
      is_headquarters: unit.is_headquarters,
      cnpj: unit.cnpj || '',
      address: unit.address || '',
      city: unit.city || '',
      state: unit.state || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setFormData({
      name: '',
      code: '',
      is_headquarters: false,
      cnpj: '',
      address: '',
      city: '',
      state: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      alert('ID da empresa não encontrado. Recarregue a página.');
      return;
    }

    let error;

    if (editingUnit) {
      const { error: updateError } = await supabase
        .from('units')
        .update({
          ...formData,
        })
        .eq('id', editingUnit.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('units')
        .insert([
          {
            ...formData,
            company_id: companyId,
          },
        ]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving unit:', error);
      alert('Erro ao salvar unidade: ' + error.message);
    } else {
      alert(editingUnit ? 'Unidade atualizada com sucesso!' : 'Unidade criada com sucesso!');
      handleCloseModal();
      loadUnits();
    }
  };

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Unidades</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie suas unidades (matriz e filiais)
        </p>
      </header>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar unidades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#BF7960] focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {search ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade cadastrada'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${unit.is_headquarters
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-blue-100 text-blue-600'
                    }`}
                >
                  <Building2 size={24} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-lg">
                      {unit.name}
                    </span>
                    {unit.is_headquarters && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Matriz
                      </span>
                    )}
                    {unit.code && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {unit.code}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {unit.address}
                    {unit.city && `, ${unit.city}`}
                    {unit.state && ` - ${unit.state}`}
                  </p>
                  {unit.cnpj && (
                    <p className="text-xs text-gray-500 mt-1">
                      CNPJ: {unit.cnpj}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleEdit(unit)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setEditingUnit(null);
          setFormData({
            name: '',
            code: '',
            is_headquarters: false,
            cnpj: '',
            address: '',
            city: '',
            state: '',
          });
          setShowModal(true);
        }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-xl hover:bg-slate-800 transition-all hover:shadow-2xl flex items-center gap-2"
      >
        <Plus size={20} />
        Nova Unidade
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Unidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Matriz São Luís"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BF7960] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="Ex: UNI-01"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BF7960] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                    placeholder="00.000.000/0000-00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BF7960] focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Rua, número, bairro"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BF7960] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Ex: São Luís"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BF7960] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="Ex: MA"
                    maxLength={2}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BF7960] focus:border-transparent uppercase"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_headquarters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_headquarters: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#BF7960] border-gray-300 rounded focus:ring-[#BF7960]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Esta é a Matriz
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#BF7960] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A66850] transition-colors"
                >
                  {editingUnit ? 'Salvar Alterações' : 'Salvar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
