import React, { useState } from 'react';
import { Crown, Zap, Check, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

interface UpgradeRequiredStateProps {
    featureName: string;
    requiredPlan?: 'pro' | 'enterprise';
    description?: string;
    whatsappLink?: string;
}

export const UpgradeRequiredState: React.FC<UpgradeRequiredStateProps> = ({
    featureName,
    requiredPlan = 'pro',
    description,
    whatsappLink = 'https://wa.me/5527999806456' // Número padrão para o WhatsApp
}) => {
    const navigate = useNavigate();
    const { company } = useAuthContext();

    const defaultDescription = requiredPlan === 'enterprise'
        ? 'Este recurso está disponível apenas para clientes Enterprise com necessidades avançadas.'
        : 'Este recurso está disponível para clientes Pro e Enterprise.';

    const benefits = requiredPlan === 'pro' ? [
        'Auditorias ilimitadas',
        'Gestão completa de fornecedores',
        'Relatórios avançados',
        'Controle de produção',
        'Análise de riscos',
        'Suporte prioritário'
    ] : [
        'Usuários ilimitados',
        'Armazenamento ilimitado',
        'SSO / SAML',
        'SLA garantido',
        'Gerente de conta dedicado',
        'Customizações personalizadas'
    ];

    return (
        <div className="min-h-[600px] flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-2xl w-full">
                {/* Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white mb-4 shadow-lg">
                        <Lock className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        {featureName}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-lg mx-auto">
                        {description || defaultDescription}
                    </p>
                </div>

                {/* Plan Badge */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold shadow-md">
                        <Crown className="w-5 h-5" />
                        Disponível no plano {requiredPlan === 'pro' ? 'PRO' : 'ENTERPRISE'}
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-600" />
                        O que você ganha com o upgrade:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                    <Check className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="text-gray-700">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => {
                            const companyName = company?.name || 'sua empresa';
                            const message = `Olá, sou da empresa ${companyName} e quero fazer upgrade para o Plano PRO da Isotek.`;
                            window.open(`${whatsappLink}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                        <Crown className="w-5 h-5" />
                        Fazer Upgrade Agora
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => window.open(whatsappLink, '_blank')}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:border-purple-300 transition-all"
                    >
                        Falar com Vendas
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    Precisa de mais informações? Entre em contato com nossa equipe de vendas.
                </p>
            </div>
        </div>
    );
};
