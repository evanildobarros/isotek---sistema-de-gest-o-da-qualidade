import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload, X, FileText, Download, Loader2, Plus, Eye, CheckCircle, File, Image as ImageIcon, GitBranch, Send, XCircle, Search, Sparkles, BookOpen, FileCheck, Copy, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { useAuditFindings } from '../../../hooks/useAuditFindings';
import { AuditIndicator } from '../../common/AuditIndicator';
import { AuditActionPanel } from '../../auditor/AuditActionPanel';
import { useAuditor } from '../../../contexts/AuditorContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { PrintableDocumentModal } from './PrintableDocumentModal';
import { pdf } from '@react-pdf/renderer';
import { QualityManualTemplate } from '../../documents/QualityManualTemplate';
import { extractMermaidBlocks } from '../../../lib/mermaidRenderer';

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
    elaborated_by?: string;
    approved_by?: string;
    approved_at?: string;
    next_review_date?: string;
    // From view
    elaborated_by_name?: string;
    approved_by_name?: string;
}

export const DocumentsPage: React.FC = () => {
    const { user, company, effectiveCompanyId, isAuditorMode, viewingAsCompanyName } = useAuthContext();
    const location = useLocation();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
    const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Upload modal states
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadCode, setUploadCode] = useState('');
    const [uploadVersion, setUploadVersion] = useState('1.0');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [elaboratedBy, setElaboratedBy] = useState('');
    const [nextReviewDate, setNextReviewDate] = useState('');

    // Version control states
    const [isVersionMode, setIsVersionMode] = useState(false);
    const [versionBaseDocument, setVersionBaseDocument] = useState<Document | null>(null);

    // AI Generator states
    const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
    const [generatingDocument, setGeneratingDocument] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [selectedDocType, setSelectedDocType] = useState<'manual_qualidade' | 'procedimento' | 'politica_qualidade'>('manual_qualidade');

    const [showPreviewGenerated, setShowPreviewGenerated] = useState(false);

    // Confirm Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'primary' | 'warning';
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'primary'
    });

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    // Print Modal state
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printDocument, setPrintDocument] = useState<Document | null>(null);
    const [printContent, setPrintContent] = useState('');
    const [loadingPrintContent, setLoadingPrintContent] = useState(false);

    // Reject Modal state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectDocId, setRejectDocId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Audit findings hook - busca constatações pendentes para documentos

    // Edit mode states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<Document | null>(null);
    const [editContent, setEditContent] = useState('');
    const [loadingEditContent, setLoadingEditContent] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editPreviewMode, setEditPreviewMode] = useState(false);

    // Audit findings hook - busca constatações pendentes para documentos
    const { findingsMap, loading: loadingFindings } = useAuditFindings('document');

    // Auditor context para painel de ações
    const { isAuditorMode: auditorModeActive, targetCompany } = useAuditor();

    // Estado para armazenar o ID do audit_assignment ativo (quando em modo auditor)
    const [activeAuditAssignmentId, setActiveAuditAssignmentId] = useState<string | null>(null);

    // Buscar assignment ativo quando em modo auditor
    useEffect(() => {
        const fetchActiveAssignment = async () => {
            if (auditorModeActive && targetCompany && user) {
                const { data } = await supabase
                    .from('audit_assignments')
                    .select('id')
                    .eq('auditor_id', user.id)
                    .eq('company_id', targetCompany.id)
                    .in('status', ['active', 'em_andamento', 'agendada'])
                    .single();

                if (data) {
                    setActiveAuditAssignmentId(data.id);
                }
            } else {
                setActiveAuditAssignmentId(null);
            }
        };
        fetchActiveAssignment();
    }, [auditorModeActive, targetCompany, user]);


    useEffect(() => {
        fetchDocuments();
    }, []);

    // Handle navigation from global search
    useEffect(() => {
        if (location.state?.highlightCode) {
            setSearchTerm(location.state.highlightCode);
        } else if (location.state?.highlightId) {
            // Fallback if code is not available, though code is better for search
            // We might need to find the doc to get its title/code if we only have ID
            // But Header passes code now.
        }
    }, [location.state]);

    useEffect(() => {
        let filtered = documents;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(doc => doc.status === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.title.toLowerCase().includes(term) ||
                (doc.code && doc.code.toLowerCase().includes(term))
            );
        }

        setFilteredDocuments(filtered);
    }, [statusFilter, searchTerm, documents]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            if (!effectiveCompanyId) {
                setDocuments([]);
                return;
            }

            const { data, error } = await supabase
                .from('documents_with_responsibles')
                .select('id, title, code, version, status, file_url, file_name, file_size, uploaded_at, owner_id, elaborated_by, approved_by, approved_at, next_review_date, elaborated_by_name, approved_by_name')
                .eq('company_id', effectiveCompanyId)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Erro ao carregar documentos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Incrementa versão automaticamente (1.0 → 1.1 ou 2.0)
    const incrementVersion = (currentVersion: string): string => {
        const parts = currentVersion.split('.');
        if (parts.length === 2) {
            const [major, minor] = parts.map(Number);
            if (!isNaN(major) && !isNaN(minor)) {
                return `${major}.${minor + 1}`;
            }
        }
        // Fallback: apenas incrementa algo ao final
        return currentVersion + '.1';
    };

    // Abre modal para criar nova versão de um documento existente
    const handleCreateNewVersion = (doc: Document) => {
        setIsVersionMode(true);
        setVersionBaseDocument(doc);
        setUploadTitle(doc.title);
        setUploadCode(doc.code || '');
        setUploadVersion(incrementVersion(doc.version));
        setSelectedFile(null);
        setIsUploadModalOpen(true);
    };

    // Reseta estados do modal
    const resetModalStates = () => {
        setIsUploadModalOpen(false);
        setUploadTitle('');
        setUploadCode('');
        setUploadVersion('1.0');
        setSelectedFile(null);
        setIsVersionMode(false);
        setVersionBaseDocument(null);
        setElaboratedBy('');
        setNextReviewDate('');
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
            toast.error('Tipo de arquivo não permitido. Use PDF, DOCX ou imagens (PNG/JPG).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('O arquivo deve ter no máximo 10MB');
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
            toast.error('Preencha o título e selecione um arquivo');
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

            if (!publicUrl) {
                throw new Error('Erro ao gerar URL pública do arquivo');
            }

            if (!effectiveCompanyId) {
                throw new Error('Empresa não encontrada');
            }

            // Verifica se já existe documento com mesmo código (para log)
            if (uploadCode) {
                const { data: existingDocs } = await supabase
                    .from('documents')
                    .select('id, version')
                    .eq('company_id', effectiveCompanyId)
                    .eq('code', uploadCode);

                if (existingDocs && existingDocs.length > 0) {
                    // Logic to handle existing versions can go here
                }
            }

            // Sempre insere o novo documento como 'rascunho'
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
                        company_id: effectiveCompanyId, // Use effectiveCompanyId
                        elaborated_by: user.id,
                        next_review_date: nextReviewDate || null
                    }
                ]);

            if (insertError) {
                throw new Error(`Erro ao salvar metadados: ${insertError.message}`);
            }

            toast.success(isVersionMode
                ? 'Nova versão criada com sucesso! Aguardando aprovação.'
                : 'Documento enviado com sucesso!'
            );

            resetModalStates();
            fetchDocuments();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Erro ao fazer upload. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    // Solicitar aprovação (rascunho → em_aprovacao)
    const handleRequestApproval = (docId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Solicitar Aprovação',
            message: 'Deseja enviar este documento para aprovação?',
            confirmLabel: 'Enviar',
            variant: 'primary',
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('documents')
                        .update({ status: 'em_aprovacao' })
                        .eq('id', docId);

                    if (error) throw error;

                    toast.success('Documento enviado para análise!');
                    fetchDocuments();
                } catch (error: any) {
                    console.error('Erro ao solicitar aprovação:', error);
                    toast.error('Erro ao solicitar aprovação: ' + error.message);
                }
            }
        });
    };

    // Rejeitar documento (em_aprovacao → rascunho)
    const handleReject = (docId: string) => {
        setRejectDocId(docId);
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    const confirmReject = async () => {
        if (!rejectDocId) return;

        try {
            const { error } = await supabase
                .from('documents')
                .update({ status: 'obsoleto' })
                .eq('id', rejectDocId);

            if (error) throw error;

            const mensagem = rejectReason
                ? `❌ Documento rejeitado e obsoletado.\n\nMotivo: ${rejectReason}`
                : '❌ Documento rejeitado e marcado como obsoleto.';

            toast.info(mensagem);
            setIsRejectModalOpen(false);
            setRejectDocId(null);
            setRejectReason('');
            fetchDocuments();
        } catch (error: any) {
            console.error('Erro ao rejeitar:', error);
            toast.error('Erro ao rejeitar documento: ' + error.message);
        }
    };

    // Lógica inteligente de aprovação com gestão automática de obsolescência
    const handleApprove = (docId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Aprovar Documento',
            message: 'Deseja aprovar este documento? Ele ficará vigente e versões anteriores serão obsoletadas automaticamente.',
            confirmLabel: 'Aprovar',
            variant: 'primary', // Could be warning if it obsoletes others, but primary is fine
            onConfirm: async () => {
                try {
                    // 1. Buscar o documento que está sendo aprovado
                    const { data: docToApprove, error: fetchError } = await supabase
                        .from('documents')
                        .select('id, title, code, version, status')
                        .eq('id', docId)
                        .single();

                    if (fetchError || !docToApprove) {
                        throw new Error('Documento não encontrado');
                    }

                    if (!effectiveCompanyId) {
                        throw new Error('Empresa não encontrada');
                    }

                    // 2. Se o documento tem código, obsoletear versões antigas do mesmo código
                    if (docToApprove.code) {
                        const { error: obsoleteError } = await supabase
                            .from('documents')
                            .update({ status: 'obsoleto' })
                            .eq('company_id', effectiveCompanyId)
                            .eq('code', docToApprove.code)
                            .neq('id', docId);

                        if (obsoleteError) {
                            console.error('Erro ao obsoletear versões antigas:', obsoleteError);
                            throw new Error('Erro ao obsoletear versões antigas: ' + obsoleteError.message);
                        }
                    }

                    // 3. Aprovar o documento atual (registrando quem aprovou)
                    const { error: approveError } = await supabase
                        .from('documents')
                        .update({
                            status: 'vigente',
                            approved_by: user?.id,
                            approved_at: new Date().toISOString()
                        })
                        .eq('id', docId);

                    if (approveError) {
                        throw new Error('Erro ao aprovar documento: ' + approveError.message);
                    }

                    if (docToApprove.code) {
                        toast.success('Documento aprovado com sucesso! Versões anteriores foram automaticamente obsoletadas.');
                    } else {
                        toast.success('Documento aprovado com sucesso!');
                    }

                    fetchDocuments();
                } catch (error: any) {
                    console.error('Erro na aprovação:', error);
                    toast.error('Erro ao aprovar documento: ' + error.message);
                }
            }
        });
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
            em_aprovacao: { label: 'Em Aprovação', className: 'bg-slate-100 text-slate-700' }
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

    // AI Document Generator
    const handleGenerateDocument = async () => {
        if (!effectiveCompanyId) {
            toast.error('Empresa não encontrada');
            return;
        }

        const targetCompanyName = isAuditorMode ? (viewingAsCompanyName || 'Empresa Cliente') : company?.name;
        const targetCnpj = isAuditorMode ? '' : (company?.cnpj || ''); // Auditors rarely need CNPJ for generation content?

        setGeneratingDocument(true);
        setGeneratedContent('');

        try {
            const { data, error } = await supabase.functions.invoke('generate-manual', {
                body: {
                    companyName: targetCompanyName,
                    cnpj: targetCnpj,
                    documentType: selectedDocType
                }
            });

            if (error) throw error;

            if (data?.error) {
                throw new Error(data.error);
            }

            setGeneratedContent(data.content);
            setShowPreviewGenerated(true);
            toast.success('Documento gerado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao gerar documento:', error);
            toast.error('Erro ao gerar documento: ' + (error.message || 'Tente novamente'));
        } finally {
            setGeneratingDocument(false);
        }
    };

    const handleSaveGeneratedDocument = async () => {
        if (!generatedContent || !user || !effectiveCompanyId) return;

        try {
            const docTitles: Record<string, { title: string; code: string }> = {
                'manual_qualidade': { title: 'Manual da Qualidade', code: 'MQ-001' },
                'procedimento': { title: 'Procedimento Operacional Padrão', code: 'PQ-001' },
                'politica_qualidade': { title: 'Política da Qualidade', code: 'POL-001' }
            };

            const docInfo = docTitles[selectedDocType];
            const targetCompanyName = isAuditorMode ? (viewingAsCompanyName || '') : (company?.name || '');

            // Criar um Blob com o conteúdo Markdown
            const blob = new Blob([generatedContent], { type: 'text/markdown' });
            const fileName = `${docInfo.code}_${Date.now()}.md`;
            const filePath = `${user.id}/${fileName}`;

            // Upload para o Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // Inserir no banco
            const { error: insertError } = await supabase
                .from('documents')
                .insert([{
                    title: `${docInfo.title} - ${targetCompanyName}`,
                    code: docInfo.code,
                    version: '1.0',
                    status: 'rascunho',
                    file_url: publicUrl,
                    file_name: fileName,
                    file_size: blob.size,
                    owner_id: user.id,
                    company_id: effectiveCompanyId, // Use effectiveCompanyId
                    elaborated_by: user.id
                }]);

            if (insertError) throw insertError;

            toast.success('Documento salvo com sucesso!');
            setIsGeneratorModalOpen(false);
            setShowPreviewGenerated(false);
            setGeneratedContent('');
            fetchDocuments();
        } catch (error: any) {
            console.error('Erro ao salvar documento:', error);
            toast.error('Erro ao salvar: ' + error.message);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
        toast.success('Copiado para a área de transferência!');
    };

    // Função para abrir modal de edição
    const handleOpenEditModal = async (doc: Document) => {
        setEditingDocument(doc);
        setEditContent('');
        setEditPreviewMode(false);
        setNextReviewDate(doc.next_review_date || '');
        setIsEditModalOpen(true);
        setLoadingEditContent(true);

        try {
            // Carregar conteúdo do arquivo .md
            const response = await fetch(doc.file_url);
            if (!response.ok) throw new Error('Falha ao carregar arquivo');

            const content = await response.text();
            setEditContent(content);
        } catch (error) {
            console.error('Erro ao carregar conteúdo:', error);
            toast.error('Erro ao carregar conteúdo do documento');
            setIsEditModalOpen(false);
        } finally {
            setLoadingEditContent(false);
        }
    };

    // Função para salvar edição
    const handleSaveEdit = async () => {
        if (!editingDocument || !user || !effectiveCompanyId) return;

        setSavingEdit(true);

        try {
            // Criar novo blob com conteúdo editado
            const blob = new Blob([editContent], { type: 'text/markdown' });
            const fileName = editingDocument.file_name;
            const filePath = `${user.id}/${fileName}`;

            // Deletar arquivo antigo e fazer upload do novo
            await supabase.storage
                .from('documents')
                .remove([filePath]);

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, blob, { upsert: true });

            if (uploadError) throw uploadError;

            // Atualizar tamanho do arquivo no banco
            const { error: updateError } = await supabase
                .from('documents')
                .update({
                    file_size: blob.size,
                    next_review_date: nextReviewDate || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingDocument.id);

            if (updateError) throw updateError;

            toast.success('Documento salvo com sucesso!');
            setIsEditModalOpen(false);
            setEditingDocument(null);
            setEditContent('');
            fetchDocuments();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar: ' + error.message);
        } finally {
            setSavingEdit(false);
        }
    };

    // Função para imprimir documento (apenas Markdown)
    const handlePrintDocument = async (doc: Document) => {
        if (!doc.file_name.endsWith('.md')) {
            toast.error('Geração de PDF disponível apenas para documentos criados na plataforma (.md)');
            return;
        }

        setPrintDocument(doc);
        setPrintContent('');
        setIsPrintModalOpen(true);
        setLoadingPrintContent(true);

        try {
            const response = await fetch(doc.file_url);
            if (!response.ok) throw new Error('Falha ao carregar arquivo');
            const content = await response.text();
            setPrintContent(content);
        } catch (error) {
            console.error('Erro ao carregar conteúdo para impressão:', error);
            toast.error('Erro ao preparar documento para impressão');
            setIsPrintModalOpen(false);
        } finally {
            setLoadingPrintContent(false);
        }
    };

    // Função para baixar PDF profissional
    const handleDownloadProfessionalPDF = async (doc: Document) => {
        if (!doc.file_name.endsWith('.md')) {
            toast.error('Geração de PDF disponível apenas para documentos criados na plataforma (.md)');
            return;
        }

        const toastId = toast.loading('Gerando PDF profissional...');

        try {
            // 1. Obter conteúdo do arquivo
            const response = await fetch(doc.file_url);
            if (!response.ok) throw new Error('Falha ao carregar arquivo');
            const content = await response.text();

            // 2. Processar diagramas Mermaid (converte para descrição textual)
            toast.loading('Processando conteúdo...', { id: toastId });
            const { cleanContent } = extractMermaidBlocks(content);

            // 3. Gerar Blob do PDF
            toast.loading('Gerando PDF...', { id: toastId });
            const blob = await pdf(
                <QualityManualTemplate
                    content={cleanContent}
                    companyName={isAuditorMode ? (viewingAsCompanyName || 'Empresa Cliente') : (company?.name || 'Sua Empresa')}
                    companyLogo={isAuditorMode ? null : company?.logo_url}
                    cnpj={isAuditorMode ? 'N/A' : (company?.cnpj || '')}
                    docTitle={doc.title}
                    docVersion={doc.version}
                    docCode={doc.code || undefined}
                />
            ).toBlob();

            // 4. Criar link de download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${doc.title.replace(/\s+/g, '_')}_v${doc.version}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Erro ao gerar PDF', { id: toastId });
        }
    };
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                confirmLabel={confirmModal.confirmLabel}
            />

            <PrintableDocumentModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                title={printDocument?.title || 'Documento'}
                content={loadingPrintContent ? 'Carregando conteúdo...' : printContent}
                version={printDocument?.version}
                code={printDocument?.code}
            />

            {/* Reject Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejeitar Documento</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            O documento será retornado para rascunho. Você pode informar um motivo (opcional):
                        </p>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#025159] focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Motivo da rejeição (opcional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setIsRejectModalOpen(false);
                                    setRejectDocId(null);
                                    setRejectReason('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReject}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Rejeitar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-[#025159]">Gestão de Documentos</h1>
                    </div>
                    <p className="text-gray-500 text-sm">Controle da Informação Documentada (ISO 9001: 7.5)</p>
                </div>
                {/* Botões ocultos para auditores */}
                {!auditorModeActive && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setIsGeneratorModalOpen(true)}
                            className="group flex items-center gap-3 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-xl hover:bg-[#3F858C] hover:shadow-lg hover:scale-[1.02] transition-all duration-200 w-full md:w-auto"
                        >
                            <Sparkles size={20} className="group-hover:animate-pulse" />
                            <span>Gerar com IA</span>
                        </button>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#025159]/90 transition-colors w-full md:w-auto"
                        >
                            <Plus size={20} />
                            <span>Novo Documento</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Status Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="grid grid-cols-2 sm:flex gap-2 flex-wrap">
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

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por título ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#025159] focus:border-[#025159] sm:text-sm transition duration-150 ease-in-out"
                />
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
                <div className={auditorModeActive ? "flex flex-col gap-6" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"}>
                    {filteredDocuments.map((doc) => {
                        const { icon: Icon, colorClass, bgClass } = getFileIcon(doc.file_name);
                        const canCreateVersion = doc.status === 'vigente' || doc.status === 'obsoleto';

                        const finding = findingsMap[doc.id];
                        let borderClass = 'border-gray-100';

                        // Define cor da borda baseada na severidade da constatação
                        if (finding) {
                            switch (finding.severity) {
                                case 'nao_conformidade_maior':
                                    borderClass = 'border-red-400 ring-1 ring-red-400';
                                    break;
                                case 'nao_conformidade_menor':
                                    borderClass = 'border-orange-400 ring-1 ring-orange-400';
                                    break;
                                case 'oportunidade':
                                    borderClass = 'border-blue-400 ring-1 ring-blue-400';
                                    break;
                                case 'conforme':
                                    borderClass = 'border-green-400 ring-1 ring-green-400';
                                    break;
                            }
                        }

                        return (
                            <div
                                key={doc.id}
                                className={`bg-white rounded-xl shadow-sm hover:shadow-md border transition-all overflow-hidden group ${borderClass}`}
                            >
                                <div className={`flex flex-col ${auditorModeActive ? 'md:flex-row' : ''}`}>
                                    {/* Icon Area */}
                                    <div className={`${bgClass} ${auditorModeActive ? 'md:w-48 py-4 md:py-0' : 'py-8'} flex items-center justify-center transition-all border-r border-gray-50`}>
                                        <div className={`${bgClass} rounded-full p-4`}>
                                            <Icon size={auditorModeActive ? 40 : 48} className={colorClass} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className={`p-4 flex-1 ${auditorModeActive ? 'border-r border-gray-100' : ''}`}>
                                        {/* Code */}
                                        {doc.code && (
                                            <div className="flex items-center gap-1 mb-1">
                                                <GitBranch size={12} className="text-gray-400" />
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {doc.code}
                                                </span>
                                            </div>
                                        )}

                                        {/* Title with Audit Indicator */}
                                        <div className="flex items-start gap-2 mt-1 mb-3">
                                            <h3 className="font-medium text-gray-900 line-clamp-2 flex-1" title={doc.title}>
                                                {doc.title}
                                            </h3>
                                            <AuditIndicator entityId={doc.id} findingsMap={findingsMap} size="sm" />
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(doc.status)}
                                            <span
                                                className={`text-xs ${doc.status === 'obsoleto'
                                                    ? 'text-gray-400 line-through'
                                                    : 'text-gray-500'
                                                    }`}
                                            >
                                                v{doc.version}
                                            </span>
                                        </div>

                                        {/* Responsáveis */}
                                        {(doc.elaborated_by_name || doc.approved_by_name) && (
                                            <div className="text-xs text-gray-500 mt-2 space-y-1">
                                                {doc.elaborated_by_name && (
                                                    <p>📝 Elaborado: <span className="font-medium">{doc.elaborated_by_name}</span></p>
                                                )}
                                                {doc.approved_by_name && (
                                                    <p>✅ Aprovado: <span className="font-medium">{doc.approved_by_name}</span></p>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                                            {/* Sempre mostrar Visualizar (se aplicável) */}
                                            {canPreviewFile(doc.file_name) && (
                                                <button
                                                    onClick={() => {
                                                        if (!doc.file_url) return toast.error('Arquivo não disponível');
                                                        setPreviewDocument(doc);
                                                        setIsPreviewModalOpen(true);
                                                    }}
                                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={16} />
                                                    <span>Ver</span>
                                                </button>
                                            )}

                                            {/* RASCUNHO: Editar + Solicitar Aprovação (Apenas Empresa) */}
                                            {!auditorModeActive && doc.status === 'rascunho' && (
                                                <>
                                                    {doc.file_name.endsWith('.md') && (
                                                        <button
                                                            onClick={() => handleOpenEditModal(doc)}
                                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                                                            title="Editar Documento"
                                                        >
                                                            <Pencil size={16} />
                                                            <span>Editar</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRequestApproval(doc.id)}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                                        title="Solicitar Aprovação"
                                                    >
                                                        <Send size={16} />
                                                        <span>Solicitar Aprovação</span>
                                                    </button>
                                                </>
                                            )}

                                            {/* EM APROVAÇÃO: Aprovar + Rejeitar (Apenas Empresa) */}
                                            {!auditorModeActive && doc.status === 'em_aprovacao' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(doc.id)}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                                                        title="Aprovar Documento"
                                                    >
                                                        <CheckCircle size={16} />
                                                        <span>Aprovar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(doc.id)}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                                        title="Rejeitar Documento"
                                                    >
                                                        <XCircle size={16} />
                                                        <span>Rejeitar</span>
                                                    </button>
                                                </>
                                            )}

                                            {/* VIGENTE/OBSOLETO: Nova Versão (Apenas Empresa) */}
                                            {!auditorModeActive && canCreateVersion && (
                                                <button
                                                    onClick={() => handleCreateNewVersion(doc)}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                                    title="Criar Nova Versão"
                                                >
                                                    <GitBranch size={16} />
                                                    <span>Nova Versão</span>
                                                </button>
                                            )}

                                            {/* Sempre mostrar Download */}
                                            {doc.file_url && (
                                                <>
                                                    {/* Se for Markdown, oferece opção de gerar PDF via Print e Profissional */}
                                                    {doc.file_name.endsWith('.md') ? (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handlePrintDocument(doc)}
                                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Visualizar para Impressão"
                                                            >
                                                                <FileText size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadProfessionalPDF(doc)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Baixar PDF Profissional"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={doc.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 text-gray-400 hover:text-[#025159] hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Download Original"
                                                        >
                                                            <Download size={18} />
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bloco 2: Painel de Ações do Auditor - Posicionado à direita no modo horizontal */}
                                    {auditorModeActive && activeAuditAssignmentId && (
                                        <div className="md:w-1/2 lg:w-[600px] flex flex-col border-l border-amber-100 bg-amber-50/10">
                                            <AuditActionPanel
                                                entityId={doc.id}
                                                entityType="document"
                                                entityName={doc.title}
                                                auditAssignmentId={activeAuditAssignmentId}
                                                existingFinding={findingsMap[doc.id] ? {
                                                    id: findingsMap[doc.id].id,
                                                    severity: findingsMap[doc.id].severity as any,
                                                    auditor_notes: findingsMap[doc.id].auditor_notes,
                                                    status: findingsMap[doc.id].status
                                                } : null}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
                            <div className="flex-1 min-w-0 pr-4">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                                    {isVersionMode ? 'Nova Versão do Documento' : 'Novo Documento'}
                                </h3>
                                {isVersionMode && versionBaseDocument && (
                                    <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
                                        Baseado em: {versionBaseDocument.title} (v{versionBaseDocument.version})
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={resetModalStates}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Título do Documento *
                                </label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    placeholder="Ex: Procedimento de Inspeção de Entrada"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código {isVersionMode && <span className="text-gray-500">(herdado)</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadCode}
                                        onChange={(e) => setUploadCode(e.target.value)}
                                        disabled={isVersionMode}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] ${isVersionMode ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''
                                            }`}
                                        placeholder="PR-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Versão
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadVersion}
                                        onChange={(e) => setUploadVersion(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                        placeholder="1.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Próxima Revisão (Validade)
                                    </label>
                                    <input
                                        type="date"
                                        value={nextReviewDate}
                                        onChange={(e) => setNextReviewDate(e.target.value)}
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

                        <div className="p-4 md:p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                            <button
                                onClick={resetModalStates}
                                disabled={uploading}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile || !uploadTitle}
                                className="flex-1 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#025159]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    isVersionMode ? 'Criar Nova Versão' : 'Fazer Upload'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewModalOpen && previewDocument && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 md:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex-1 min-w-0 pr-3">
                                <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">{previewDocument.title}</h3>
                                <p className="text-xs md:text-sm text-gray-500">v{previewDocument.version}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPreviewModalOpen(false);
                                    setPreviewDocument(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                            >
                                <X size={20} className="text-gray-500" />
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

                        <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <a
                                href={previewDocument.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#025159]/90 transition-colors w-full sm:w-auto"
                            >
                                <Download size={18} />
                                <span>Baixar Arquivo</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Generator Modal */}
            {isGeneratorModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-[#025159]/5 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#025159] rounded-xl">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                                        Gerador de Documentos com IA
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Crie documentos ISO 9001 automaticamente
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsGeneratorModalOpen(false);
                                    setShowPreviewGenerated(false);
                                    setGeneratedContent('');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {!showPreviewGenerated ? (
                                <div className="space-y-6">
                                    {/* Document Type Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Selecione o tipo de documento:
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <button
                                                onClick={() => setSelectedDocType('manual_qualidade')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedDocType === 'manual_qualidade'
                                                    ? 'border-[#025159] bg-[#025159]/10'
                                                    : 'border-gray-200 hover:border-[#025159]/50'
                                                    }`}
                                            >
                                                <BookOpen className={`w-8 h-8 mb-2 ${selectedDocType === 'manual_qualidade' ? 'text-[#025159]' : 'text-gray-400'
                                                    }`} />
                                                <h4 className="font-semibold text-gray-900">Manual da Qualidade</h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Documento completo com todos os requisitos ISO 9001
                                                </p>
                                            </button>

                                            <button
                                                onClick={() => setSelectedDocType('procedimento')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedDocType === 'procedimento'
                                                    ? 'border-[#025159] bg-[#025159]/10'
                                                    : 'border-gray-200 hover:border-[#025159]/50'
                                                    }`}
                                            >
                                                <FileCheck className={`w-8 h-8 mb-2 ${selectedDocType === 'procedimento' ? 'text-[#025159]' : 'text-gray-400'
                                                    }`} />
                                                <h4 className="font-semibold text-gray-900">Procedimento (POP)</h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Procedimento Operacional Padrão estruturado
                                                </p>
                                            </button>

                                            <button
                                                onClick={() => setSelectedDocType('politica_qualidade')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedDocType === 'politica_qualidade'
                                                    ? 'border-[#025159] bg-[#025159]/10'
                                                    : 'border-gray-200 hover:border-[#025159]/50'
                                                    }`}
                                            >
                                                <FileText className={`w-8 h-8 mb-2 ${selectedDocType === 'politica_qualidade' ? 'text-[#025159]' : 'text-gray-400'
                                                    }`} />
                                                <h4 className="font-semibold text-gray-900">Política da Qualidade</h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Declaração de compromisso da direção
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Company Info */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            Documento será gerado para:
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#025159] rounded-lg flex items-center justify-center text-white font-bold">
                                                {company?.name?.charAt(0) || 'E'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{company?.name || 'Sua Empresa'}</p>
                                                {company?.cnpj && (
                                                    <p className="text-xs text-gray-500">CNPJ: {company.cnpj}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm text-blue-800">
                                            💡 A IA irá gerar um documento profissional baseado nos requisitos da ISO 9001:2015.
                                            Você poderá revisar e editar antes de salvar.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Preview Generated Content */
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900">Documento Gerado:</h4>
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <Copy size={14} />
                                            Copiar
                                        </button>
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 max-h-[50vh] overflow-y-auto prose prose-sm max-w-none">
                                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 md:p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0 bg-gray-50">
                            {!showPreviewGenerated ? (
                                <>
                                    <button
                                        onClick={() => setIsGeneratorModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleGenerateDocument}
                                        disabled={generatingDocument}
                                        className="flex-1 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#025159]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {generatingDocument ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Gerando documento...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={20} />
                                                <span>Gerar Documento</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowPreviewGenerated(false)}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        ← Voltar
                                    </button>
                                    <button
                                        onClick={handleGenerateDocument}
                                        disabled={generatingDocument}
                                        className="flex-1 px-4 py-2.5 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={18} />
                                        Gerar Novamente
                                    </button>
                                    <button
                                        onClick={handleSaveGeneratedDocument}
                                        className="flex-1 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#025159]/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        Salvar Documento
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Document Modal */}
            {isEditModalOpen && editingDocument && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                    <Pencil className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 truncate max-w-md">
                                        Editar: {editingDocument.title}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {editingDocument.code} • v{editingDocument.version}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditPreviewMode(!editPreviewMode)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${editPreviewMode
                                        ? 'bg-[#025159] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {editPreviewMode ? '✏️ Editar' : '👁️ Preview'}
                                </button>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Próxima Revisão</label>
                                    <input
                                        type="date"
                                        value={nextReviewDate}
                                        onChange={(e) => setNextReviewDate(e.target.value)}
                                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159] h-8"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingDocument(null);
                                        setEditContent('');
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors font-bold"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden p-4 md:p-6">
                            {loadingEditContent ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#025159]" />
                                </div>
                            ) : editPreviewMode ? (
                                <div className="h-full overflow-y-auto bg-white border border-gray-200 rounded-xl p-6 prose prose-sm max-w-none">
                                    <ReactMarkdown>{editContent}</ReactMarkdown>
                                </div>
                            ) : (
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full h-full p-4 border border-gray-300 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-[#025159]/20 focus:border-[#025159]"
                                    placeholder="Conteúdo do documento em Markdown..."
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 md:p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0 bg-gray-50">
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingDocument(null);
                                    setEditContent('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={savingEdit || !editContent.trim()}
                                className="flex-1 px-4 py-2.5 bg-[#025159] text-white font-medium rounded-lg hover:bg-[#025159]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {savingEdit ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Salvar Alterações</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};
