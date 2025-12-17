import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * CompanySwitcher - Link direto para o Portal do Auditor
 * Exibe um botão simples que leva ao portal do auditor, sem dropdown redundante
 */
interface CompanySwitcherProps {
    fullWidth?: boolean;
    variant?: 'default' | 'sidebar';
}

export const CompanySwitcher: React.FC<CompanySwitcherProps> = ({ fullWidth, variant = 'default' }) => {
    const { auditorAssignments } = useAuthContext();
    const navigate = useNavigate();

    // Se não há vínculos de auditor, não mostrar o componente
    if (auditorAssignments.length === 0) {
        return null;
    }

    const handleClick = () => {
        navigate('/app/portal-auditor');
    };

    if (variant === 'sidebar') {
        return (
            <button
                onClick={handleClick}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
            >
                <div className="p-2 rounded-lg bg-[#025159] dark:bg-[#025159]">
                    <LayoutGrid className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        Portal do Auditor
                    </h1>
                    <p className="text-xs text-gray-500">
                        Isotek SGQ
                    </p>
                </div>
            </button>
        );
    }

    // Default button style
    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all bg-white border-[#025159]/20 text-[#025159] hover:bg-[#025159]/5 ${fullWidth ? 'w-full justify-between' : ''}`}
        >
            <div className="flex items-center gap-2 truncate">
                <LayoutGrid size={16} className="text-[#025159] flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                    Portal do Auditor
                </span>
            </div>
        </button>
    );
};
