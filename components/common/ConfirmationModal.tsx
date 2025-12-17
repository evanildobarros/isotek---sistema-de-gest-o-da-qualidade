import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'success' | 'warning';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    const getColors = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: 'text-red-600 bg-red-100',
                    button: 'bg-red-600 hover:bg-red-700'
                };
            case 'success':
                return {
                    icon: 'text-green-600 bg-green-100',
                    button: 'bg-green-600 hover:bg-green-700'
                };
            default:
                return {
                    icon: 'text-amber-600 bg-amber-100',
                    button: 'bg-[#025159] hover:bg-[#025159]/90'
                };
        }
    };

    const colors = getColors();

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colors.icon}`}>
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm mb-6">{description}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm ${colors.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
