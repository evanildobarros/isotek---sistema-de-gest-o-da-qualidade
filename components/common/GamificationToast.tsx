import React from 'react';
import { toast } from 'sonner';
import { Sparkles, TrendingUp, TrendingDown, Crown } from 'lucide-react';

interface GamificationToastProps {
    xpAmount: number;
    message: string;
    type?: 'success' | 'penalty' | 'levelup';
}

/**
 * Componente visual para Toast de Gamificação.
 * Uso: toast.custom((t) => <GamificationToast xpAmount={500} message="Auditoria Concluída" />)
 */
export const GamificationToast: React.FC<GamificationToastProps> = ({
    xpAmount,
    message,
    type = xpAmount >= 0 ? 'success' : 'penalty'
}) => {
    const isSuccess = type === 'success' || type === 'levelup';
    const isLevelUp = type === 'levelup';

    return (
        <div className={`
            relative overflow-hidden rounded-xl shadow-2xl p-4 min-w-[320px] 
            border-2 backdrop-blur-md transform transition-all duration-500
            ${isLevelUp
                ? 'bg-gradient-to-r from-amber-500/90 to-yellow-600/90 border-yellow-300 text-white'
                : isSuccess
                    ? 'bg-white/95 border-emerald-400'
                    : 'bg-white/95 border-red-400'
            }
        `}>
            {/* Efeitos de Fundo */}
            {isSuccess && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent" />
            )}

            <div className="flex items-center gap-4 relative z-10">
                {/* Ícone Animado */}
                <div className={`
                    p-3 rounded-full shadow-lg flex items-center justify-center
                    ${isLevelUp ? 'bg-white/20' : isSuccess ? 'bg-emerald-100' : 'bg-red-100'}
                `}>
                    {isLevelUp ? (
                        <Crown className="w-8 h-8 text-white animate-bounce" />
                    ) : isSuccess ? (
                        <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
                    ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                    <h4 className={`text-2xl font-black tracking-tight ${isLevelUp ? 'text-white' : isSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
                        {xpAmount > 0 ? '+' : ''}{xpAmount} XP
                    </h4>
                    <p className={`text-sm font-medium ${isLevelUp ? 'text-yellow-50' : 'text-gray-600'}`}>
                        {message}
                    </p>
                </div>
            </div>

            {/* Partículas (Simulação Visual Simples) */}
            {isLevelUp && (
                <>
                    <div className="absolute top-2 right-4 text-yellow-200 animate-ping">✦</div>
                    <div className="absolute bottom-2 left-10 text-yellow-200 animate-bounce delay-75">✦</div>
                </>
            )}
        </div>
    );
};

// Helper function para chamar o toast facilmente
export const showGamificationToast = (amount: number, message: string, type?: 'success' | 'penalty' | 'levelup') => {
    toast.custom((t) => (
        <GamificationToast xpAmount={amount} message={message} type={type} />
    ), {
        duration: 5000,
        position: 'top-center', // Mais visível para gamificação
    });
};
