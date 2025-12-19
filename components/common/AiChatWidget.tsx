import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Minimize2, HelpCircle, RefreshCw, Image, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
    imageUrl?: string; // URL da imagem anexada
}

// Mensagens de erro amigáveis baseadas no código de erro
const getErrorMessage = (error: any): { message: string; canRetry: boolean } => {
    const code = error?.code || error?.data?.code;

    switch (code) {
        case 'RATE_LIMIT_EXCEEDED':
            return {
                message: '⏳ Você atingiu o limite de mensagens. Aguarde 1 minuto e tente novamente.',
                canRetry: false
            };
        case 'API_RATE_LIMIT':
            return {
                message: '🔄 Serviço temporariamente sobrecarregado. Tente novamente em alguns segundos.',
                canRetry: true
            };
        case 'API_NOT_CONFIGURED':
        case 'API_AUTH_ERROR':
            return {
                message: '⚙️ O assistente está temporariamente indisponível. Entre em contato com o suporte.',
                canRetry: false
            };
        case 'EMPTY_QUERY':
            return {
                message: '📝 Por favor, digite uma pergunta ou envie uma imagem.',
                canRetry: false
            };
        case 'INTERNAL_ERROR':
            return {
                message: '⚠️ Ocorreu um erro inesperado. Tente novamente.',
                canRetry: true
            };
        default:
            return {
                message: `❌ ${error?.message || error?.data?.error || 'Erro ao processar sua solicitação.'}`,
                canRetry: true
            };
    }
};

// Limite de tamanho de imagem (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const AiChatWidget: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Olá! 👋 Sou o **Isotek AI**, seu consultor especialista em ISO 9001:2015.\n\n📷 Você pode enviar **imagens** de documentos, produtos ou processos para análise!\n\nComo posso ajudá-lo hoje?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
    const [lastFailedImage, setLastFailedImage] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null); // Base64 da imagem selecionada
    const [imagePreview, setImagePreview] = useState<string | null>(null); // Preview visual
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

    // Prepara o histórico para enviar à API (últimas 6 mensagens, excluindo a mensagem de boas-vindas)
    const getHistoryForAPI = () => {
        return messages
            .filter(m => m.id !== '1' && !m.isError) // Exclui boas-vindas e erros
            .slice(-6) // Últimas 6 mensagens
            .map(m => ({ role: m.role, content: m.content }));
    };

    // Converter arquivo para base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    // Processar imagem (usado tanto para seleção quanto para paste)
    const processImageFile = async (file: File) => {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione apenas arquivos de imagem.');
            return false;
        }

        // Validar tamanho
        if (file.size > MAX_IMAGE_SIZE) {
            toast.error('A imagem é muito grande. O tamanho máximo é 5MB.');
            return false;
        }

        try {
            const base64 = await fileToBase64(file);
            setSelectedImage(base64);
            setImagePreview(base64);
            return true;
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            toast.error('Erro ao processar a imagem. Tente novamente.');
            return false;
        }
    };

    // Handler para seleção de imagem via input file
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await processImageFile(file);

        // Limpar input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
    };

    // Handler para colar (Ctrl+V) - suporta texto e imagens
    const handlePaste = async (e: React.ClipboardEvent) => {
        const clipboardData = e.clipboardData;

        // Verificar se há imagens no clipboard
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Se for uma imagem
            if (item.type.startsWith('image/')) {
                e.preventDefault(); // Prevenir paste padrão de texto
                const file = item.getAsFile();
                if (file) {
                    await processImageFile(file);
                }
                return; // Sair após processar a imagem
            }
        }

        // Se não for imagem, deixar o comportamento padrão de paste de texto
    };

    // Remover imagem selecionada
    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleSend = async (retryMessage?: string, retryImage?: string) => {
        const messageToSend = retryMessage || input.trim();
        const imageToSend = retryImage || selectedImage;

        // Precisa ter texto OU imagem
        if (!messageToSend && !imageToSend) return;
        if (isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageToSend || '📷 [Imagem enviada para análise]',
            timestamp: new Date(),
            imageUrl: imageToSend || undefined
        };

        // Só adiciona a mensagem do usuário se não for retry
        if (!retryMessage && !retryImage) {
            setMessages(prev => [...prev, userMessage]);
        }
        setInput('');
        setSelectedImage(null);
        setImagePreview(null);
        setIsLoading(true);
        setLastFailedMessage(null);
        setLastFailedImage(null);

        try {


            // Chamar a Edge Function do Supabase com histórico e imagem
            const response = await supabase.functions.invoke('ai-advisor', {
                body: {
                    query: messageToSend,
                    context: location.pathname,
                    history: getHistoryForAPI(),
                    image: imageToSend || undefined
                }
            });

            console.log('📡 Response:', response);

            // Verificar erros específicos
            if (response.error) {
                console.error('❌ Erro da Edge Function:', response.error);
                const { message, canRetry } = getErrorMessage(response.error);

                if (canRetry) {
                    setLastFailedMessage(messageToSend);
                    setLastFailedImage(imageToSend);
                }

                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: message,
                    timestamp: new Date(),
                    isError: true
                }]);
                return;
            }

            // Verificar erro no body da resposta
            if (response.data?.error) {
                const { message, canRetry } = getErrorMessage(response.data);

                if (canRetry) {
                    setLastFailedMessage(messageToSend);
                    setLastFailedImage(imageToSend);
                }

                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: message,
                    timestamp: new Date(),
                    isError: true
                }]);
                return;
            }

            const answer = response.data?.answer ||
                'Desculpe, não consegui processar sua solicitação.';

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: answer,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('❌ Erro ao chamar AI:', error);
            const { message, canRetry } = getErrorMessage(error);

            if (canRetry) {
                setLastFailedMessage(messageToSend);
                setLastFailedImage(imageToSend);
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: message,
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        if (lastFailedMessage || lastFailedImage) {
            handleSend(lastFailedMessage || undefined, lastFailedImage || undefined);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick suggestions based on current page - expandido
    const getSuggestions = (): string[] => {
        const path = location.pathname;

        if (path.includes('/contexto-analise') || path.includes('/definicao-estrategica')) {
            return ['Como fazer uma análise SWOT?', 'Quais são as partes interessadas?'];
        }
        if (path.includes('/saidas-nao-conformes')) {
            return ['Como descrever uma não conformidade?', 'Quais são as disposições possíveis?'];
        }
        if (path.includes('/acoes-corretivas')) {
            return ['Como usar os 5 Porquês?', 'O que é uma ação corretiva eficaz?'];
        }
        if (path.includes('/auditorias')) {
            return ['Como preparar uma auditoria interna?', 'Quais são os critérios de auditoria?'];
        }
        if (path.includes('/matriz-riscos')) {
            return ['Como avaliar riscos?', 'O que é matriz probabilidade x impacto?'];
        }
        if (path.includes('/indicadores')) {
            return ['Como definir KPIs?', 'O que são metas SMART?'];
        }
        if (path.includes('/documentos')) {
            return ['Como controlar versões de documentos?', 'O que é informação documentada?'];
        }
        if (path.includes('/fornecedores')) {
            return ['Como avaliar fornecedores?', 'Quais critérios de qualificação usar?'];
        }
        if (path.includes('/analise-critica')) {
            return ['O que incluir na análise crítica?', 'Quais são as entradas requeridas?'];
        }
        return ['O que é ISO 9001?', 'Quais são os requisitos principais?'];
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-3 bg-[#03A6A6] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#028f8f] transition-all duration-300 hover:scale-105"
                title="Isotek AI Assistant"
            >
                <HelpCircle className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${isMinimized ? 'w-72 h-14' : 'w-96 h-[600px] max-h-[85vh]'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#03A6A6] rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">Isotek AI</h3>
                        {!isMinimized && (
                            <p className="text-white/70 text-xs">Consultor ISO 9001</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title={isMinimized ? 'Expandir' : 'Minimizar'}
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                                    ? 'bg-[#025159] text-white'
                                    : message.isError
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                                    }`}>
                                    {message.role === 'user' ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                    ? 'bg-[#025159] text-white rounded-tr-sm'
                                    : message.isError
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-tl-sm'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                                    }`}>
                                    {/* Preview da imagem se existir */}
                                    {message.imageUrl && (
                                        <div className="mb-2">
                                            <img
                                                src={message.imageUrl}
                                                alt="Imagem anexada"
                                                className="max-w-full h-auto rounded-lg max-h-32 object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Retry button */}
                    {(lastFailedMessage || lastFailedImage) && !isLoading && (
                        <div className="px-4 pb-2">
                            <button
                                onClick={handleRetry}
                                className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {/* Suggestions */}
                    {messages.length <= 2 && !isLoading && !imagePreview && (
                        <div className="px-4 pb-2">
                            <p className="text-xs text-gray-500 mb-2">💡 Sugestões:</p>
                            <div className="flex flex-wrap gap-2">
                                {getSuggestions().map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="px-4 pb-2">
                            <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-16 w-auto rounded-lg border border-gray-300 dark:border-gray-600"
                                />
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    title="Remover imagem"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">📷 Imagem pronta para enviar</p>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />

                        <div className="flex gap-2">
                            {/* Image upload button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="p-2.5 text-gray-500 hover:text-[#03A6A6] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Anexar imagem"
                            >
                                <Image className="w-5 h-5" />
                            </button>

                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                placeholder={imagePreview ? "Adicione uma pergunta (opcional)..." : "Cole uma imagem ou pergunte..."}
                                rows={1}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-[#025159] outline-none resize-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={(!input.trim() && !selectedImage) || isLoading}
                                className="p-2.5 bg-[#025159] text-white rounded-xl hover:bg-[#3F858C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
