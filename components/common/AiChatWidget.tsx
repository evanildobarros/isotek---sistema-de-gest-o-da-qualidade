import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Minimize2, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const AiChatWidget: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Olá! 👋 Sou o **Isotek AI**, seu consultor especialista em ISO 9001:2015.\n\nComo posso ajudá-lo hoje?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

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

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build contextual system prompt
            let systemContext = `Você é o **Isotek AI**, um consultor sênior especialista em ISO 9001:2015 e Sistemas de Gestão da Qualidade (SGQ).

REGRAS:
- Responda SEMPRE em português brasileiro
- Seja CONCISO e DIRETO (máximo 3 parágrafos curtos)
- Use linguagem profissional mas acessível
- Quando aplicável, cite o requisito ISO específico (ex: "Conforme ISO 9001:2015 - 8.7...")
- Se não souber algo, admita e sugira consultar um especialista
- NÃO invente informações técnicas
- Formate sua resposta em Markdown quando útil (listas, negrito, etc.)`;

            const path = location.pathname;
            if (path.includes('/contexto-analise') || path.includes('/definicao-estrategica')) {
                systemContext += `\n\nCONTEXTO: Análise SWOT e Definição Estratégica (ISO 9001 - 4.1/4.2).`;
            } else if (path.includes('/saidas-nao-conformes') || path.includes('/acoes-corretivas')) {
                systemContext += `\n\nCONTEXTO: RNC/Ação Corretiva (ISO 9001 - 8.7/10.2).`;
            } else if (path.includes('/auditorias')) {
                systemContext += `\n\nCONTEXTO: Auditorias Internas (ISO 9001 - 9.2).`;
            } else if (path.includes('/matriz-riscos')) {
                systemContext += `\n\nCONTEXTO: Gestão de Riscos (ISO 9001 - 6.1).`;
            }

            const fullPrompt = `${systemContext}\n\n**PERGUNTA:** ${userMessage.content}`;

            // Get API key from environment variable (secure for production)
            const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

            console.log('🔑 API Key presente:', !!GEMINI_API_KEY);
            console.log('🔑 API Key (primeiros 10 chars):', GEMINI_API_KEY?.substring(0, 10) + '...');

            if (!GEMINI_API_KEY) {
                throw new Error('API Key não configurada. Adicione VITE_GEMINI_API_KEY ao .env e reinicie o servidor.');
            }

            console.log('📡 Enviando requisição para Gemini...');

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: fullPrompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024,
                        }
                    })
                }
            );

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Erro da API Gemini:', errorData);
                throw new Error(`Erro na API: ${response.status} - ${errorData?.error?.message || 'Erro desconhecido'}`);
            }

            const data = await response.json();
            console.log('✅ Resposta recebida:', data);

            const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
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
            const errorMessage = error?.message || 'Erro desconhecido';
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ ${errorMessage}`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick suggestions based on current page
    const getSuggestions = (): string[] => {
        const path = location.pathname;

        if (path.includes('/contexto-analise')) {
            return ['Como fazer uma análise SWOT?', 'Quais são as partes interessadas típicas?'];
        }
        if (path.includes('/saidas-nao-conformes') || path.includes('/acoes-corretivas')) {
            return ['Como usar os 5 Porquês?', 'O que é uma ação corretiva eficaz?'];
        }
        if (path.includes('/auditorias')) {
            return ['Como preparar uma auditoria interna?', 'Quais são os critérios de auditoria?'];
        }
        if (path.includes('/matriz-riscos')) {
            return ['Como avaliar riscos?', 'O que é matriz de probabilidade x impacto?'];
        }
        if (path.includes('/indicadores')) {
            return ['Como definir KPIs?', 'O que são metas SMART?'];
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
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#025159] to-[#3F858C] text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-[#025159]/30 transition-all duration-300 group hover:scale-105"
                title="Isotek AI Assistant"
            >
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                <span className="font-semibold">Isotek AI</span>
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${isMinimized ? 'w-80 h-14' : 'w-96 h-[600px] max-h-[80vh]'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#025159] to-[#3F858C] rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-white" />
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
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                                    }`}>
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

                    {/* Suggestions */}
                    {messages.length <= 2 && !isLoading && (
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

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Pergunte sobre ISO 9001..."
                                rows={1}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-[#025159] outline-none resize-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-[#025159] text-white rounded-xl hover:bg-[#3F858C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Powered by Google Gemini AI
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};
