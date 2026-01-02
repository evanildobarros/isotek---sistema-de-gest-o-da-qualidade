import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { session, role } = useAuth();

    useEffect(() => {
        if (session && role) {
            if (role === 'auditor') {
                navigate('/app/auditor-portal', { replace: true });
            } else {
                navigate('/app/dashboard', { replace: true });
            }
        }
    }, [session, role, navigate]);

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // LOGIN LOGIC
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Erro Login:', error.message);
                if (error.message.includes('Email not confirmed')) {
                    toast.error('Seu email ainda não foi confirmado. Entre em contato com o administrador.');
                } else {
                    toast.error(`Falha no login: ${error.message}`);
                }
                setIsLoading(false);
                return;
            }

            if (data.session && data.user) {
                // Fetch user role from profiles
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                // Redirect based on role
                if (profileData?.role === 'auditor') {
                    navigate('/app/auditor-portal', { replace: true });
                } else {
                    navigate('/app/dashboard', { replace: true });
                }
                return;
            }
        } catch (error) {
            console.error('Erro inesperado:', error);
            toast.error('Ocorreu um erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat relative overflow-hidden"
            style={{
                backgroundImage: "url('/assets/login-background-new.png')",
                backgroundColor: '#f8fafc'
            }}
        >
            {/* Subtle overlay for better contrast */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="transform hover:scale-105 transition-transform duration-300" title="Voltar para Home">
                        <div className="p-4 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center">
                            <img src="/logo_isotek.svg" alt="Isotek Logo" className="w-20 h-20 object-contain" />
                        </div>
                    </Link>
                </div>
                <h2 className="text-center text-4xl font-extrabold text-gray-900 tracking-tight">
                    Entrar na Plataforma
                </h2>
                <p className="mt-3 text-center text-lg text-gray-600 font-medium">
                    Acesse sua conta Isotek
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/70 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-12 border border-white/60">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                                E-mail corporativo
                            </label>
                            <div className="mt-1 relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-isotek-500 transition-colors" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-isotek-500/20 focus:border-isotek-500 transition-all sm:text-sm"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                                Senha
                            </label>
                            <div className="mt-1 relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-isotek-500 transition-colors" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-isotek-500/20 focus:border-isotek-500 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-isotek-500 focus:outline-none transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-isotek-600 focus:ring-isotek-500/30 border-gray-300 rounded-md cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 font-medium cursor-pointer hover:text-gray-900">
                                    Lembrar-me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-semibold text-isotek-600 hover:text-isotek-700 transition-colors">
                                    Esqueceu sua senha?
                                </a>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-[#03A6A6] hover:bg-[#028a8a] focus:outline-none focus:ring-4 focus:ring-[#03A6A6]/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <span className="flex items-center gap-2 relative z-10 text-white">
                                        Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
                                <span className="px-4 bg-white/80 rounded-full text-gray-400">
                                    Segurança Isotek
                                </span>
                            </div>
                        </div>
                        <p className="text-center mt-4 text-[10px] text-gray-400 font-medium">
                            Protegido por criptografia SSL de 256 bits
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
