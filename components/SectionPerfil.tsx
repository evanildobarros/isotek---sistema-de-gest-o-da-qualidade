import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Calendar, Shield, X, Camera, Lock, Upload } from 'lucide-react';

export const SectionPerfil: React.FC = () => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('Administrador Silva');
    const [email, setEmail] = useState('admin@isotek.com');
    const [phone, setPhone] = useState('(98) 98765-4321');
    const [role, setRole] = useState('Gerente da Qualidade');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Photo upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Load avatar from localStorage on mount
    useEffect(() => {
        const savedAvatar = localStorage.getItem('isotek_avatar');
        if (savedAvatar) {
            setAvatarUrl(savedAvatar);
        }
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, etc.)');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('O arquivo deve ter no máximo 5MB');
            return;
        }

        setSelectedFile(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSavePhoto = () => {
        if (!previewUrl) {
            alert('Por favor, selecione uma foto primeiro');
            return;
        }

        // Save to localStorage
        localStorage.setItem('isotek_avatar', previewUrl);
        setAvatarUrl(previewUrl);

        // Reset states
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsPhotoModalOpen(false);

        alert('Foto atualizada com sucesso!');

        // Trigger custom event to update avatar in other components
        window.dispatchEvent(new Event('avatarUpdated'));
    };

    const handleRemovePhoto = () => {
        localStorage.removeItem('isotek_avatar');
        setAvatarUrl(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        alert('Foto removida com sucesso!');
        window.dispatchEvent(new Event('avatarUpdated'));
    };

    const handleSaveProfile = () => {
        alert('Perfil atualizado com sucesso!');
        setIsEditModalOpen(false);
    };

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        if (newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres!');
            return;
        }
        alert('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordModalOpen(false);
    };

    const renderAvatar = (size: 'small' | 'large' = 'large') => {
        const sizeClasses = size === 'large' ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-2xl';

        if (avatarUrl) {
            return (
                <img
                    src={avatarUrl}
                    alt="Avatar"
                    className={`${sizeClasses} rounded-full object-cover shadow-lg`}
                />
            );
        }

        return (
            <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-isotek-500 to-isotek-600 flex items-center justify-center text-white font-bold shadow-lg`}>
                AD
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Meu Perfil</h2>

                {/* Avatar Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                    <div className="relative">
                        {renderAvatar('large')}
                        <button
                            onClick={() => setIsPhotoModalOpen(true)}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <Camera size={16} className="text-gray-600" />
                        </button>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Admin User</h3>
                        <p className="text-gray-500 mt-1">Administrador do Sistema</p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setIsPhotoModalOpen(true)}
                                className="px-4 py-2 bg-isotek-600 text-white text-sm font-medium rounded-lg hover:bg-isotek-700 transition-colors"
                            >
                                Alterar Foto
                            </button>
                            {avatarUrl && (
                                <button
                                    onClick={handleRemovePhoto}
                                    className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                                >
                                    Remover Foto
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Nome Completo</p>
                            <p className="font-semibold text-gray-900">{fullName}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Mail className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">E-mail</p>
                            <p className="font-semibold text-gray-900">{email}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Telefone</p>
                            <p className="font-semibold text-gray-900">{phone}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cargo</p>
                            <p className="font-semibold text-gray-900">{role}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="text-teal-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Data de Cadastro</p>
                            <p className="font-semibold text-gray-900">15 de Janeiro de 2024</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Nível de Acesso</p>
                            <p className="font-semibold text-gray-900">Administrador Total</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-6 py-2.5 bg-isotek-600 text-white font-medium rounded-lg hover:bg-isotek-700 transition-colors"
                    >
                        Editar Perfil
                    </button>
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Alterar Senha
                    </button>
                </div>
            </div>

            {/* Additional Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Configurações de Conta</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                            <p className="font-medium text-gray-900">Notificações por E-mail</p>
                            <p className="text-sm text-gray-500">Receber atualizações importantes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-isotek-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-isotek-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                            <p className="font-medium text-gray-900">Autenticação em Dois Fatores</p>
                            <p className="text-sm text-gray-500">Segurança adicional para sua conta</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-isotek-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-isotek-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Editar Perfil</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveProfile}
                                className="flex-1 px-4 py-2.5 bg-isotek-600 text-white font-medium rounded-lg hover:bg-isotek-700 transition-colors"
                            >
                                Salvar Alterações
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Photo Modal */}
            {isPhotoModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Alterar Foto de Perfil</h3>
                            <button
                                onClick={() => {
                                    setIsPhotoModalOpen(false);
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="text-center">
                            {/* Preview */}
                            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg mb-6 bg-gray-100">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : avatarUrl ? (
                                    <img src={avatarUrl} alt="Current" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-isotek-500 to-isotek-600 flex items-center justify-center text-white font-bold text-5xl">
                                        AD
                                    </div>
                                )}
                            </div>

                            {/* Upload Area */}
                            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 hover:border-isotek-500 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Upload size={48} className="text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-600 mb-2 font-medium">
                                    {selectedFile ? selectedFile.name : 'Clique para selecionar uma foto'}
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSavePhoto}
                                disabled={!previewUrl}
                                className="flex-1 px-4 py-2.5 bg-isotek-600 text-white font-medium rounded-lg hover:bg-isotek-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Salvar Foto
                            </button>
                            <button
                                onClick={() => {
                                    setIsPhotoModalOpen(false);
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Alterar Senha</h3>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                        placeholder="Digite sua senha atual"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                        placeholder="Digite a nova senha"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
                                        placeholder="Confirme a nova senha"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleChangePassword}
                                className="flex-1 px-4 py-2.5 bg-isotek-600 text-white font-medium rounded-lg hover:bg-isotek-700 transition-colors"
                            >
                                Alterar Senha
                            </button>
                            <button
                                onClick={() => {
                                    setIsPasswordModalOpen(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
