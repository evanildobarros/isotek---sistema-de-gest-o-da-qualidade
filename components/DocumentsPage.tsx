import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Download, History, Loader2, Filter, Plus } from 'lucide-react';
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
        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'image/png',
            'image/jpeg',
            'image/jpg'
        ];

        if (!allowedTypes.includes(file.type)) {
            alert('Tipo de arquivo não permitido. Use PDF, DOCX ou imagens (PNG/JPG).');
            return;
        }

        // Validate file size (10MB)
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
            // 1. Upload file to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}_${uploadTitle.replace(/\s+/g, '_')}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, selectedFile);

            if (uploadError) {
                throw new Error(`Erro no upload: ${uploadError.message}`);
            }

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // 3. Get company_id from context
            if (!company) {
                throw new Error('Usuário não vinculado a uma empresa');
            }

            // 4. Insert metadata into documents table
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

            // Reset form
            setUploadTitle('');
            setUploadCode('');
            setUploadVersion('1.0');
            setSelectedFile(null);
            setIsUploadModalOpen(false);

            // Refresh documents list
            fetchDocuments();
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(error.message || 'Erro ao fazer upload. Tente novamente.');
        } finally {
            setUploading(false);
        }
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Gestão de Documentos</h2>
                        <p className="text-sm text-gray-500 mt-1">Controle da Informação Documentada (ISO 9001: 7.5)</p>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-isotek-600 text-white font-medium rounded-lg hover:bg-isotek-700 transition-colors"
                    >
                        <Plus size={20} />
                        Novo Documento
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all'
                            ? 'bg-isotek-100 text-isotek-700'
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

            {/* Documents Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-isotek-600" />
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center p-12">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhum documento encontrado</p>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="mt-4 text-isotek-600 hover:text-isotek-700 font-medium text-sm"
                        >
                            Fazer primeiro upload
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Título
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Versão
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Data de Upload
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Tamanho
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                                                {doc.code || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FileText size={18} className="text-gray-400" />
                                                <span className="font-medium text-gray-900">{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {doc.version}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(doc.uploaded_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatFileSize(doc.file_size)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                                    title="Download"
                                                >
                                                    <Download size={18} className="text-gray-400 group-hover:text-blue-600" />
                                                </a>
                                                <button
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                                                    title="Histórico"
                                                >
                                                    <History size={18} className="text-gray-400 group-hover:text-gray-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-isotek-500 focus:border-transparent"
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
                                        ? 'border-isotek-500 bg-isotek-50'
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
                                className="flex-1 px-4 py-2.5 bg-isotek-600 text-white font-medium rounded-lg hover:bg-isotek-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
        </div>
    );
};
