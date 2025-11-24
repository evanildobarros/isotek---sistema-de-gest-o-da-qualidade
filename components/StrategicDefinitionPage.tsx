import React, { useState, useEffect, useRef } from 'react';
import { Target, Telescope, Diamond, Save, Loader2, Upload, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const StrategicDefinitionPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        mission: '',
        vision: '',
        values: '',
        slogan: '',
        logo_url: ''
    });

    useEffect(() => {
        loadCompanyData();
    }, [user]);

    const loadCompanyData = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('company_info')
                .select('id, mission, vision, values, slogan, logo_url')
                .eq('owner_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading company data:', error);
            }

            if (data) {
                setCompanyId(data.id);
                setFormData({
                    mission: data.mission || '',
                    vision: data.vision || '',
                    values: data.values || '',
                    slogan: data.slogan || '',
                    logo_url: data.logo_url || ''
                });
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploadingLogo(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('logos').getPublicUrl(filePath);

            if (data) {
                setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
            }
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            alert('Erro ao fazer upload do logo: ' + error.message);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const payload = {
                owner_id: user.id,
                mission: formData.mission,
                vision: formData.vision,
                values: formData.values,
                slogan: formData.slogan,
                logo_url: formData.logo_url,
                ...(companyId ? { id: companyId } : { name: 'Minha Empresa' })
            };

            const { data, error } = await supabase
                .from('company_info')
                .upsert(payload)
                .select()
                .single();

            if (error) {
                throw error;
            }

            if (data) {
                setCompanyId(data.id);
                // Dispatch event to update avatar in Sidebar if needed
                if (formData.logo_url) {
                    localStorage.setItem('isotek_avatar', formData.logo_url);
                    window.dispatchEvent(new Event('avatarUpdated'));
                }
                alert('Identidade corporativa salva com sucesso!');
            }
        } catch (error: any) {
            console.error('Error saving strategy:', error);
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#BF7960]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header & Actions */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Identidade Corporativa</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Defina a marca e o direcionamento estratégico da sua organização (ISO 9001: 4.1)
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#BF7960] text-white px-6 py-2.5 rounded-lg hover:bg-[#A66850] transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Save size={20} />
                    )}
                    <span>Salvar Alterações</span>
                </button>
            </header>

            {/* Identity Section (Logo & Slogan) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Logo Upload */}
                    <div className="flex-shrink-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative w-32 h-32 rounded-2xl flex items-center justify-center cursor-pointer transition-all overflow-hidden border-2 border-dashed ${formData.logo_url ? 'border-transparent' : 'border-gray-300 hover:border-[#BF7960]'
                                } group bg-gray-50`}
                        >
                            {formData.logo_url ? (
                                <>
                                    <img
                                        src={formData.logo_url}
                                        alt="Company Logo"
                                        className="w-full h-full object-contain p-2"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={24} />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-[#BF7960] transition-colors">
                                    {uploadingLogo ? (
                                        <Loader2 className="animate-spin" size={32} />
                                    ) : (
                                        <>
                                            <Upload size={32} className="mb-2" />
                                            <span className="text-xs font-medium">Upload Logo</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Slogan Input */}
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Slogan ou Propósito Maior
                        </label>
                        <input
                            type="text"
                            value={formData.slogan}
                            onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                            placeholder="Ex: Transformando o futuro com qualidade e inovação..."
                            className="w-full text-2xl md:text-3xl font-light text-gray-800 placeholder-gray-300 border-0 border-b-2 border-gray-100 focus:border-[#BF7960] focus:ring-0 px-0 py-2 transition-colors bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Strategic Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Mission Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#BF7960] flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-[#BF7960]/10 text-[#BF7960]">
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Missão</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Por que existimos?</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={formData.mission}
                            onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                            placeholder="Ex: Oferecer soluções inovadoras em tecnologia que transformem a vida das pessoas, garantindo excelência e sustentabilidade."
                            className="w-full h-full min-h-[200px] p-4 rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-[#BF7960]/20 text-gray-700 resize-none placeholder-gray-400 leading-relaxed"
                        />
                    </div>
                </div>

                {/* Vision Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#734636] flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-[#734636]/10 text-[#734636]">
                            <Telescope size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Visão</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Onde queremos chegar?</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={formData.vision}
                            onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                            placeholder="Ex: Ser reconhecida mundialmente até 2030 como a principal referência em qualidade e inovação no nosso segmento."
                            className="w-full h-full min-h-[200px] p-4 rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-[#734636]/20 text-gray-700 resize-none placeholder-gray-400 leading-relaxed"
                        />
                    </div>
                </div>

                {/* Values Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-[#BF7960] flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-[#BF7960]/10 text-[#BF7960]">
                            <Diamond size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Valores</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">O que não negociamos.</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={formData.values}
                            onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                            placeholder="Ex:&#10;• Ética e Transparência&#10;• Foco no Cliente&#10;• Inovação Contínua&#10;• Valorização das Pessoas"
                            className="w-full h-full min-h-[200px] p-4 rounded-lg bg-gray-50 border-0 focus:ring-2 focus:ring-[#BF7960]/20 text-gray-700 resize-none placeholder-gray-400 leading-relaxed"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
