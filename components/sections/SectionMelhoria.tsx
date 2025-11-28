import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SectionMelhoria: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirecionar para a página de Ações Corretivas (página funcional)
        navigate('/app/acoes-corretivas', { replace: true });
    }, [navigate]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Redirecionando...</p>
        </div>
    );
};