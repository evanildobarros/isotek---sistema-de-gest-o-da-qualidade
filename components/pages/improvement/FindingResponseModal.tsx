import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface FindingResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    findingId: string;
    currentResponse?: string;
    onResponseSaved: () => void;
}

export const FindingResponseModal: React.FC<FindingResponseModalProps> = ({
    isOpen,
    onClose,
    findingId,
    currentResponse,
    onResponseSaved
}) => {
    const [response, setResponse] = useState(currentResponse || '');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!response.trim()) {
            toast.warning('Por favor, descreva as ações tomadas.');
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from('audit_findings')
                .update({
                    company_response: response,
                    status: 'waiting_validation', // Envia para validação do auditor
                    updated_at: new Date().toISOString()
                })
                .eq('id', findingId);

            if (error) throw error;

            toast.success('Resposta enviada com sucesso!');
            onResponseSaved();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar resposta:', error);
            toast.error('Erro ao enviar resposta: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Responder ao Auditor</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ação Tomada / Evidência
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Descreva as ações corretivas realizadas ou anexe links para as evidências.
                            Após o envio, o status mudará para "Aguardando Validação".
                        </p>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#025159] focus:border-transparent min-h-[150px] resize-y"
                            placeholder="Descreva aqui sua resposta..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#025159] text-white text-sm font-medium rounded-lg hover:bg-[#025159]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Enviar Resposta
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
