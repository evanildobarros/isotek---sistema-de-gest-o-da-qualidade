import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Download, Loader2, Plus, Eye, CheckCircle, File, Image as ImageIcon } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type DocumentStatus = 'vigente' | 'rascunho' | 'obsoleto' | 'em_aprovacao';

interface Document {
    id: string;
    title: string;
    code: string | null;
    version: string;
    status: DocumentStatus;
    file_url: string;
    file_name: string;
    file_size: number;
    uploaded_at: string;
    owner_id: string;
}

export const DocumentsPage: React.FC = () => {
    const { user, company } = useAuthContext();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
    const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');

    // Upload modal states
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadCode, setUploadCode] = useState('');
    const [uploadVersion, setUploadVersion] = useState('1.0');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredDocuments(documents);
        } else {
            setFilteredDocuments(documents.filter(doc => doc.status === statusFilter));
        }
    }, [statusFilter, documents]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            if (!company) {
                console.warn('Usuário não vinculado a uma empresa');
                setDocuments([]);
                return;
            }

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('company_id', company.id)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            alert('Erro ao carregar documentos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (file: File) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/png',
            'image/jpeg',
            'image/jpg'
        ];

        if (!allowedTypes.includes(file.type)) {
            alert('Tipo de arquivo não permitido. Use PDF, DOCX ou imagens (PNG/ JPG).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('O arquivo deve ter no máximo 10MB');
            return;
        }

        setSelectedFile(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !uploadTitle || !user) {
            alert('Preencha o título e selecione um arquivo');
            return;
        }

        setUploading(true);
        try {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}_${uploadTitle.replace(/\s+/g, '_')}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, selectedFile);

            if (uploadError) {
                throw new Error(`Erro no upload: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            if (!company) {
                throw new Error('Usuário não vinculado a uma empresa');
            }

            const { error: insertError } = await supabase
                .from('documents')
                .insert([
                    {
                        title: uploadTitle,
                        code: uploadCode || null,
                        version: uploadVersion,
                        status: 'rascunho',
                        file_url: publicUrl,
                        file_name: selectedFile.name,
                        file_size: selectedFile.size,
                        owner_id: user.id,
                        company_id: company.id
                    }
                ]);

            if (insertError) {
                throw new Error(`Erro ao salvar metadados: ${insertError.message}`);
            }

            alert('Documento enviado com sucesso!');

            setUploadTitle('');
            setUploadCode('');
            setUploadVersion('1.0');
            setSelectedFile(null);
            setIsUploadModalOpen(false);

            fetchDocuments();
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(error.message || 'Erro ao fazer upload. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = async (docId: string) => {
        if (!confirm('Deseja aprovar este documento? Ele ficará vigente.')) return;

        try {
            const { error } = await supabase
                .from('documents')
                .update({ status: 'vigente' })
                .eq('id', docId);

            if (error) throw error;

            alert('✅ Documento aprovado com sucesso!');
            fetchDocuments();
        } catch (error: any) {
            alert('❌ Erro ao aprovar: ' + error.message);
        }
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();

        if (!ext) return {
            icon: FileText,
            colorClass: 'text-gray-500',
            bgClass: 'bg-gray-100'
        };

        const iconMap: Record<string, { icon: any; colorClass: string; bgClass: string }> = {
            'pdf': { icon: File, colorClass: 'text-red-500', bgClass: 'bg-red-50' },
            'doc': { icon: FileText, colorClass: 'text-blue-500', bgClass: 'bg-blue-50' },
            'docx': { icon: FileText, colorClass: 'text-blue-500', bgClass: 'bg-blue-50' },
            'png': { icon: ImageIcon, colorClass: 'text-purple-500', bgClass: 'bg-purple-50' },
            'jpg': { icon: ImageIcon, colorClass: 'text-purple-500', bgClass: 'bg-purple-50' },
            'jpeg': { icon: ImageIcon, colorClass: 'text-purple-500', bgClass: 'bg-purple-50' }
        };

        return iconMap[ext] || { icon: FileText, colorClass: 'text-gray-500', bgClass: 'bg-gray-100' };
    };

    const getStatusBadge = (status: DocumentStatus) => {
        const statusConfig = {
            vigente: { label: 'Vigente', className: 'bg-green-100 text-green-700' },
            rascunho: { label: 'Rascunho', className: 'bg-yellow-100 text-yellow-700' },
            obsoleto: { label: 'Obsoleto', className: 'bg-gray-100 text-gray-700' },
            em_aprovacao: { label: 'Em Aprovação', className: 'bg-blue-100 text-blue-700' }
        };

        const config = statusConfig[status];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const canPreviewFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-7 h-7 text-[#025159]" />
                        <h1 className="text-2xl font-bold text-[#025159]">Gestão de Documentos</h1>
                    </div>
                    <p className="text-gray-500 text-sm">Controle da Informação Documentada (ISO 9001: 7.5)</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#025159]/90 transition-colors"
                >
                    <Plus size={20} />
                    Novo Documento
                </button>
            </div>

            {/* Status Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all'
                            ? 'bg-[#025159] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setStatusFilter('vigente')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'vigente'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Vigentes
                    </button>
                    <button
                        onClick={() => setStatusFilter('rascunho')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'rascunho'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Rascunhos
                    </button>
                    <button
                        onClick={() => setStatusFilter('em_aprovacao')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'em_aprovacao'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Em Aprovação
                    </button>
                    <button
                        onClick={() => setStatusFilter('obsoleto')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'obsoleto'
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Obsoletos
                    </button>
                </div>
            </div>

            {/* Documents Grid */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#025159]" />
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Nenhum documento encontrado</p>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="text-[#025159] hover:text-[#025159]/80 font-medium text-sm"
                    >
                        Fazer primeiro upload
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredDocuments.map((doc) => {
                        const { icon: Icon, colorClass, bgClass } = getFileIcon(doc.file_name);

                        return (
                            <div
                                key={doc.id}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all overflow-hidden group"
                            >
                                {/* Icon Area */}
                                <div className={`${bgClass} py-8 flex items-center justify-center`}>
                                    <div className={`${bgClass} rounded-full p-4`}>
                                        <Icon size={48} className={colorClass} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Code */}
                                    {doc.code && (
                                        <span className="text-xs text-gray-500 font-mono">
                                            {doc.code}
                                        </span>
                                    )}

                                    {/* Title */}
                                    <h3 className="font-medium text-gray-900 mt-1 mb-3 line-clamp-2" title={doc.title}>
                                        {doc.title}
                                    </h3>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between">
                                        {getStatusBadge(doc.status)}
                                        <span className="text-xs text-gray-500">v{doc.version}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                        {canPreviewFile(doc.file_name) && (
                                            <button
                                                onClick={() => {
                                                    setPreviewDocument(doc);
                                                    setIsPreviewModalOpen(true);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                                title="Visualizar"
                                            >
                                                <Eye size={16} />
                                                <span>Visualizar</span>
                                            </button>
                                        )}

                                        {doc.status === 'rascunho' && (
                                            <button
                                                onClick={() => handleApprove(doc.id)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                                                title="Aprovar Documento"
                                            >
                                                <CheckCircle size={16} />
                                                <span>Aprovar</span>
                                            </button>
                                        )}

                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:text-[#025159] hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download size={18} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Novo Documento</h3>
                            <button
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setUploadTitle('');
                                    setUploadCode('');
                                    setUploadVersion('1.0');
                                    setSelectedFile(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Título do Documento *
                                </label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    placeholder="Ex: Procedimento de Inspeção de Entrada"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadCode}
                                        onChange={(e) => setUploadCode(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                        placeholder="PR-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Versão Inicial
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadVersion}
                                        onChange={(e) => setUploadVersion(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    />
                                </div>
                            </div>

                            {/* File Upload Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Arquivo *
                                </label>
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                        ? 'border-[#025159] bg-[#025159]/5'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        id="file-upload"
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                        className="hidden"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload size={48} className="text-gray-400 mx-auto mb-3" />
                                        {selectedFile ? (
                                            <div>
                                                <p className="text-sm text-gray-900 font-medium mb-1">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2 font-medium">
                                                    Arraste um arquivo ou clique para selecionar
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PDF, DOCX ou Imagens até 10MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile || !uploadTitle}
                                className="flex-1 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#025159]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Fazer Upload'
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setUploadTitle('');
                                    setUploadCode('');
                                    setUploadVersion('1.0');
                                    setSelectedFile(null);
                                }}
                                disabled={uploading}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewModalOpen && previewDocument && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{previewDocument.title}</h3>
                                <p className="text-sm text-gray-500">v{previewDocument.version}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPreviewModalOpen(false);
                                    setPreviewDocument(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {previewDocument.file_name.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={previewDocument.file_url}
                                    className="w-full h-full"
                                    title="Document Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
                                    <img
                                        src={previewDocument.file_url}
                                        alt={previewDocument.title}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <a
                                href={previewDocument.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#025159]/90 transition-colors"
                            >
                                <Download size={18} />
                                Baixar Arquivo
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
