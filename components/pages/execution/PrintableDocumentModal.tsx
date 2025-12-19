import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Modal } from '../../common/Modal';

interface PrintableDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    version?: string;
    code?: string | null;
}

export const PrintableDocumentModal: React.FC<PrintableDocumentModalProps> = ({
    isOpen,
    onClose,
    title,
    content,
    version,
    code
}) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="xl"
        >
            <div className="flex flex-col h-full bg-white">
                {/* Print Content Area */}
                <div className="print-area bg-white p-8 md:p-12">
                    {/* Header for Print */}
                    <div className="border-b-2 border-gray-900 pb-4 mb-8 hidden print:block">
                        <div className="flex justify-between items-start">
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            <div className="text-right text-sm text-gray-600">
                                {code && <p className="font-mono">Código: {code}</p>}
                                {version && <p>Versão: {version}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Markdown Content */}
                    <div className="prose prose-sm md:prose-base max-w-none text-gray-900 print:prose-black">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>

                    {/* Footer for Print */}
                    <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 hidden print:block">
                        <p>Documento controlado. A cópia impressa é considerada "NÃO CONTROLADA" salvo indicação em contrário.</p>
                        <p className="mt-1">Impresso em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>

                {/* Footer Actions (No Print) */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl no-print">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#025159]/90 transition-colors shadow-sm font-medium"
                    >
                        <Printer size={18} />
                        <span>Imprimir / Salvar PDF</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
