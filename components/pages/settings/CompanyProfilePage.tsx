import React, { useState, useEffect, useRef } from 'react';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Upload,
    Save,
    CheckCircle,
    ShieldCheck,
    CreditCard,
    Calendar
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { PageHeader } from '../../common/PageHeader';

export const CompanyProfilePage: React.FC = () => {
    const { company, refreshCompany } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        slogan: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        logo_url: ''
    });

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                slogan: company.slogan || '',
                cnpj: company.cnpj || '',
                email: company.email || '',
                phone: company.phone || '',
                address: company.address || '',
                logo_url: company.logo_url || ''
            });
        }
    }, [company]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${company?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            setLoading(true);

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            // 3. Update State
            setFormData(prev => ({ ...prev, logo_url: publicUrl }));

        } catch (error: any) {
            console.error('Error uploading logo:', error);
            alert('Erro ao fazer upload da logo: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!company) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from('company_info')
                .update({
                    name: formData.name,
                    slogan: formData.slogan,
                    cnpj: formData.cnpj,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    logo_url: formData.logo_url
                })
                .eq('id', company.id);

            if (error) throw error;

            await refreshCompany();
            alert('✅ Perfil atualizado com sucesso!');

        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert('Erro ao atualizar perfil: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Building2}
                title="Perfil da Empresa"
                subtitle="Gerencie as informações cadastrais e identidade visual da sua organização."
                iconColor="purple"
            />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Card 1: Identidade Visual */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Identidade Visual
                        </h3>

                        <div className="flex flex-col items-center space-y-4 mb-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-gray-100 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {formData.logo_url ? (
                                        <img
                                            src={formData.logo_url}
                                            alt="Logo da Empresa"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="w-12 h-12 text-gray-300" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                                    title="Alterar Logo"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Recomendado: 200x200px<br />PNG ou JPG
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ex: Isotek Soluções"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                                <textarea
                                    name="slogan"
                                    value={formData.slogan}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="Ex: Transformando qualidade em resultado."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Dados Cadastrais */}
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Dados Cadastrais e Contato
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                                <input
                                    type="text"
                                    name="name" // Using name for both for now, or add corporate_name if needed
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                <input
                                    type="text"
                                    name="cnpj"
                                    value={formData.cnpj}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="00.000.000/0001-91"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="contato@empresa.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Assinatura (Full Width) */}
                    <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Plano Atual: {company?.plan?.toUpperCase() || 'START'}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {company?.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Membro desde {company?.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium shadow-sm">
                                Gerenciar Assinatura
                            </button>
                        </div>
                    </div>

                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md font-medium disabled:opacity-70"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
