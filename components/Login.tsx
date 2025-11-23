import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, User, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { signIn, signUp, session } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);

    useEffect(() => {
        if (session) {
            navigate('/app/dashboard', { replace: true });
        }
    }, [session, navigate]);

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLoginMode) {
                // LOGIN LOGIC
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    console.error('Erro Login:', error.message);
                    alert(error.message);
                    setIsLoading(false);
                    return;
                }

                if (data.session) {
                    console.log('Login Sucesso:', data);
                    // Navigation handled by useEffect
                    return;
                }
            } else {
                // SIGN UP LOGIC
                const result = await signUp(email, password, {
                    data: {
                        full_name: fullName,
                        avatar_url: ''
                    }
                });

                if (result.success && result.data?.user) {
                    // Create Company Info
                    const { error: companyError } = await supabase
                        .from('company_info')
                        .insert([
                            {
                                name: companyName,
                                owner_id: result.data.user.id
                            }
                        ]);

                    if (companyError) {
                        console.error('Erro ao criar empresa:', companyError);
                        // Continue anyway, user is created
                    }

                    alert('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
                    setIsLoginMode(true); // Switch back to login
                } else {
                    alert('Erro ao criar conta: ' + (result.error?.message || 'Tente novamente'));
                }
            }
        } catch (error) {
            console.error('Erro inesperado:', error);
            alert('Ocorreu um erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="30" cy="20" r="15" fill="#2dd4bf" />
                        <path d="M15 40 H45 V85 C45 93.2843 38.2843 100 30 100 C21.7157 100 15 93.2843 15 85 V40 Z" fill="#2dd4bf" />
                        <path d="M40 60 L80 95 L95 80 L55 45 Z" fill="#0c4a6e" />
                        <path d="M5 70 L85 20 L95 35 L15 85 Z" fill="#86efac" />
                    </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLoginMode ? 'Entrar na Plataforma' : 'Crie sua conta Isotek'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {isLoginMode ? 'Acesse sua conta Isotek' : 'Comece a gerenciar a qualidade hoje'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLoginMode && (
                            <>
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                        Nome Completo
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            required={!isLoginMode}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="focus:ring-isotek-500 focus:border-isotek-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                            placeholder="Seu Nome"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                                        Nome da Empresa
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="companyName"
                                            name="companyName"
                                            type="text"
                                            required={!isLoginMode}
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="focus:ring-isotek-500 focus:border-isotek-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                            placeholder="Sua Empresa Ltda"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                E-mail corporativo
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="focus:ring-isotek-500 focus:border-isotek-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="focus:ring-isotek-500 focus:border-isotek-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-isotek-600 focus:ring-isotek-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Lembrar-me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-isotek-600 hover:text-isotek-500">
                                    Esqueceu sua senha?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-isotek-600 hover:bg-isotek-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-isotek-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {isLoginMode ? (isLoading ? 'Entrando...' : 'Entrar na Plataforma') : 'Criar Conta'} <ArrowRight size={16} />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            className="text-sm font-medium text-isotek-600 hover:text-isotek-500 focus:outline-none underline"
                        >
                            {isLoginMode
                                ? <>Ainda não tem uma conta? <strong>Cadastre-se gratuitamente</strong></>
                                : 'Já tem uma conta? Faça login'}
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Protegido por criptografia SSL
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
