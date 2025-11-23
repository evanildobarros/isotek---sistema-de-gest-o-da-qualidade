import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Evidence {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    description: string | null;
    uploaded_at: string;
}

interface Props {
    actionId: string;
    evidence: Evidence[];
    onUploadComplete: () => void;
}

export const EvidenceUploader: React.FC<Props> = ({ actionId, evidence, onUploadComplete }) => {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

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

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleFiles = async (files: File[]) => {
        if (!user) {
            alert('Você precisa estar logado para fazer upload');
            return;
        }

        setUploading(true);

        for (const file of files) {
            try {
                // Validate file size (10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert(`${file.name}: Arquivo muito grande (máx 10MB)`);
                    continue;
                }

                // Upload to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${actionId}/${Date.now()}_${file.name}`;

                const { error: uploadError } = await supabase.storage
                    .from('action-evidence')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('action-evidence')
                    .getPublicUrl(fileName);

                // Insert metadata
                const { error: insertError } = await supabase
                    .from('action_evidence')
                    .insert([{
                        action_id: actionId,
                        file_url: publicUrl,
                        file_name: file.name,
                        file_type: file.type,
                        file_size: file.size,
                        uploaded_by: user.id
                    }]);

                if (insertError) throw insertError;

            } catch (error: any) {
                console.error('Upload error:', error);
                alert(`Erro ao fazer upload de ${file.name}: ${error.message}`);
            }
        }

        setUploading(false);
        onUploadComplete();
    };

    const handleDelete = async (evidenceId: string, fileUrl: string) => {
        if (!confirm('Tem certeza que deseja excluir esta evidência?')) return;

        try {
            // Extract file path from URL
            const urlParts = fileUrl.split('/');
            const filePath = urlParts.slice(-2).join('/'); // actionId/filename

            // Delete from storage
            await supabase.storage
                .from('action-evidence')
                .remove([filePath]);

            // Delete metadata
            await supabase
                .from('action_evidence')
                .delete()
                .eq('id', evidenceId);

            onUploadComplete();
        } catch (error: any) {
            console.error('Delete error:', error);
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = (fileType: string) => fileType.startsWith('image/');

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                        ? 'border-isotek-500 bg-isotek-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
            >
                <input
                    type="file"
                    id="evidence-upload"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={uploading}
                />
                <label htmlFor="evidence-upload" className="cursor-pointer">
                    <Upload size={40} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                        {uploading ? 'Fazendo upload...' : 'Arraste arquivos ou clique para selecionar'}
                    </p>
                    <p className="text-xs text-gray-500">Imagens, PDF, DOC até 10MB</p>
                </label>
            </div>

            {/* Evidence Gallery */}
            {evidence.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {evidence.map((item) => (
                        <div key={item.id} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                            {/* Preview */}
                            {isImage(item.file_type) ? (
                                <img
                                    src={item.file_url}
                                    alt={item.file_name}
                                    className="w-full h-32 object-cover"
                                />
                            ) : (
                                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                    <FileText size={40} className="text-gray-400" />
                                </div>
                            )}

                            {/* Info Overlay */}
                            <div className="p-2 bg-white">
                                <p className="text-xs text-gray-900 truncate font-medium">{item.file_name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(item.file_size)}</p>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(item.id, item.file_url)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                title="Excluir evidência"
                            >
                                <Trash2 size={14} />
                            </button>

                            {/* View Button */}
                            <a
                                href={item.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="text-white text-sm font-medium">Ver arquivo</span>
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {evidence.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    Nenhuma evidência anexada ainda
                </div>
            )}
        </div>
    );
};
