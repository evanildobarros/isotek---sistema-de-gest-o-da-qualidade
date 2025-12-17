import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen w-full bg-gray-50/50">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-[#025159] animate-spin" />
                <span className="text-sm text-gray-500 font-medium">Carregando...</span>
            </div>
        </div>
    );
};
