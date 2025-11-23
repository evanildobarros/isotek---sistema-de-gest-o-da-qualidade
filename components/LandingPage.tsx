import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileCheck,
    ShieldAlert,
    Award,
    Menu,
    X,
    Check,
    Star,
    ArrowRight
} from 'lucide-react';
import logo from '../assets/isotek-logo.png';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-[#734636]">
            {/* 1. NAVBAR */}
            <header className="fixed w-full bg-white/95 backdrop-blur-md z-50 border-b border-[#DCEEF2]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="Isotek Logo" className="h-10 w-auto" />
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#funcionalidades" className="text-sm font-medium text-[#734636] hover:text-[#BF7960] transition-colors">Funcionalidades</a>
                            <a href="#planos" className="text-sm font-medium text-[#734636] hover:text-[#BF7960] transition-colors">Planos</a>
                            <a href="#sobre" className="text-sm font-medium text-[#734636] hover:text-[#BF7960] transition-colors">Sobre Nós</a>
                            <button
                                onClick={handleLoginClick}
                                className="px-6 py-2 border-2 border-[#734636] text-[#734636] text-sm font-bold rounded-lg hover:bg-[#F2D5A0] transition-all"
                            >
                                Entrar
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-[#734636]"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-[#DCEEF2] animate-fade-in">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#funcionalidades" className="block px-3 py-2 text-base font-medium text-[#734636] hover:bg-[#DCEEF2] rounded-md">Funcionalidades</a>
                            <a href="#planos" className="block px-3 py-2 text-base font-medium text-[#734636] hover:bg-[#DCEEF2] rounded-md">Planos</a>
                            <a href="#sobre" className="block px-3 py-2 text-base font-medium text-[#734636] hover:bg-[#DCEEF2] rounded-md">Sobre Nós</a>
                            <button
                                onClick={handleLoginClick}
                                className="w-full mt-4 px-5 py-3 border-2 border-[#734636] text-[#734636] text-base font-bold rounded-lg hover:bg-[#F2D5A0] transition-all"
                            >
                                Entrar
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* 2. HERO SECTION */}
            <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-[#DCEEF2] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#734636] tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
                        Assuma o controle da <br />
                        <span className="text-[#BF7960]">Qualidade da sua empresa</span>
                    </h1>
                    <p className="text-lg md:text-xl text-[#734636]/80 mb-10 leading-relaxed max-w-2xl mx-auto">
                        A plataforma completa para gestão ISO 9001. Simplifique auditorias, documentos e riscos em um só lugar.
                    </p>
                    <button className="px-8 py-4 bg-[#BF7960] text-white text-lg font-bold rounded-full hover:bg-[#734636] hover:shadow-lg transition-all transform hover:-translate-y-1">
                        Começar Agora
                    </button>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-0 top-0 w-1/3 h-full bg-[#F2D5A0] blur-3xl rounded-l-full transform translate-x-1/2"></div>
                    <div className="absolute left-0 bottom-0 w-1/3 h-full bg-[#D99873] blur-3xl rounded-r-full transform -translate-x-1/2"></div>
                </div>
            </section>

            {/* 3. SEÇÃO "SUPERE OBSTÁCULOS" (Value Prop) */}
            <section id="funcionalidades" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Card 1 */}
                        <div className="text-center p-6 rounded-2xl hover:bg-[#DCEEF2]/30 transition-colors duration-300">
                            <div className="w-16 h-16 mx-auto bg-[#DCEEF2] rounded-full flex items-center justify-center mb-6 text-[#BF7960]">
                                <FileCheck size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[#734636] mb-3">Adeus Papelada</h3>
                            <p className="text-[#734636]/70 leading-relaxed">
                                Digitalize todo o seu sistema de gestão. Chega de pastas físicas e documentos perdidos.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="text-center p-6 rounded-2xl hover:bg-[#DCEEF2]/30 transition-colors duration-300">
                            <div className="w-16 h-16 mx-auto bg-[#DCEEF2] rounded-full flex items-center justify-center mb-6 text-[#BF7960]">
                                <ShieldAlert size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[#734636] mb-3">Gestão de Riscos</h3>
                            <p className="text-[#734636]/70 leading-relaxed">
                                Identifique e trate riscos antes que virem problemas reais. Mantenha sua operação segura.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="text-center p-6 rounded-2xl hover:bg-[#DCEEF2]/30 transition-colors duration-300">
                            <div className="w-16 h-16 mx-auto bg-[#DCEEF2] rounded-full flex items-center justify-center mb-6 text-[#BF7960]">
                                <Award size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[#734636] mb-3">Certificação Garantida</h3>
                            <p className="text-[#734636]/70 leading-relaxed">
                                Ferramentas desenhadas para atender 100% dos requisitos da ISO 9001 com facilidade.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. SEÇÃO DE PREÇOS */}
            <section id="planos" className="py-20 bg-[#DCEEF2]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#734636] mb-4">Escolha o plano ideal para sua certificação</h2>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                        {/* Card 1: Start */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-transparent hover:border-[#F2D5A0] transition-all">
                            <h3 className="text-xl font-bold text-[#734636] mb-2">Gratuito</h3>
                            <p className="text-sm text-[#734636]/60 mb-6">Ideal para conhecer</p>
                            <div className="text-3xl font-bold text-[#734636] mb-6">R$ 0<span className="text-base font-normal text-[#734636]/60">/mês</span></div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm text-[#734636]/80">
                                    <Check size={16} className="text-[#BF7960]" />
                                    Acesso ao Manual da Qualidade
                                </li>
                            </ul>
                            <button className="w-full py-3 border-2 border-[#734636] text-[#734636] font-bold rounded-xl hover:bg-[#DCEEF2] transition-colors">
                                Começar Grátis
                            </button>
                        </div>

                        {/* Card 2: Pro (Destaque) */}
                        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-[#BF7960] relative transform scale-105 z-10">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#BF7960] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Recomendado
                            </div>
                            <h3 className="text-xl font-bold text-[#734636] mb-2">Pro</h3>
                            <p className="text-sm text-[#734636]/60 mb-6">Para pequenas empresas</p>
                            <div className="text-4xl font-bold text-[#734636] mb-6">R$ 100<span className="text-base font-normal text-[#734636]/60">/mês</span></div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm text-[#734636]/80">
                                    <Check size={16} className="text-[#BF7960]" />
                                    Gestão de Documentos (GED)
                                </li>
                                <li className="flex items-center gap-2 text-sm text-[#734636]/80">
                                    <Check size={16} className="text-[#BF7960]" />
                                    Até 5 usuários
                                </li>
                                <li className="flex items-center gap-2 text-sm text-[#734636]/80">
                                    <Check size={16} className="text-[#BF7960]" />
                                    Suporte por e-mail
                                </li>
                            </ul>
                            <button className="w-full py-3 bg-[#BF7960] text-white font-bold rounded-xl hover:bg-[#734636] transition-colors shadow-lg hover:shadow-xl">
                                Assinar Agora
                            </button>
                        </div>

                        {/* Card 3: Enterprise */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-transparent hover:border-[#F2D5A0] transition-all">
                            <h3 className="text-xl font-bold text-[#734636] mb-2">Enterprise</h3>
                            <p className="text-sm text-[#734636]/60 mb-6">Para grandes operações</p>
                            <div className="text-3xl font-bold text-[#734636] mb-6">Sob Consulta</div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm text-[#734636]/80">
                                    <Check size={16} className="text-[#BF7960]" />
                                    Usuários ilimitados
                                </li>
                                <li className="flex items-center gap-2 text-sm text-[#734636]/80">
                                    <Check size={16} className="text-[#BF7960]" />
                                    Consultoria dedicada
                                </li>
                                <li className="flex items-center gap-2 text-sm text-[#734636]/80">
                                    <Check size={16} className="text-[#BF7960]" />
                                    API personalizada
                                </li>
                            </ul>
                            <button className="w-full py-3 border-2 border-[#734636] text-[#734636] font-bold rounded-xl hover:bg-[#DCEEF2] transition-colors">
                                Fale Conosco
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. DEPOIMENTOS */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#734636] mb-4">O que nossos clientes dizem</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Testimonial 1 */}
                        <div className="p-8 bg-[#DCEEF2]/30 rounded-2xl border border-[#DCEEF2]">
                            <div className="flex gap-1 mb-4 text-[#BF7960]">
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                            </div>
                            <p className="text-[#734636]/80 italic mb-6">
                                "A Isotek reduziu nosso tempo de auditoria em 50%. A interface é intuitiva e a equipe adorou usar desde o primeiro dia."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#F2D5A0] rounded-full flex items-center justify-center text-[#734636] font-bold text-lg">
                                    MS
                                </div>
                                <div>
                                    <div className="font-bold text-[#734636]">Mariana Silva</div>
                                    <div className="text-sm text-[#734636]/60">Gestora da Qualidade</div>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="p-8 bg-[#DCEEF2]/30 rounded-2xl border border-[#DCEEF2]">
                            <div className="flex gap-1 mb-4 text-[#BF7960]">
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                                <Star size={16} fill="currentColor" />
                            </div>
                            <p className="text-[#734636]/80 italic mb-6">
                                "Finalmente conseguimos organizar nossa documentação ISO. O suporte é excelente e o sistema não para de evoluir."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#D99873] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    RC
                                </div>
                                <div>
                                    <div className="font-bold text-[#734636]">Roberto Costa</div>
                                    <div className="text-sm text-[#734636]/60">Diretor Industrial</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. RODAPÉ */}
            <footer className="bg-[#734636] text-[#F2D5A0] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <span className="text-2xl font-bold text-white tracking-tight mb-4 block">Isotek</span>
                            <p className="text-[#F2D5A0]/80 max-w-xs">
                                Transformando a gestão da qualidade com tecnologia e simplicidade.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Links Rápidos</h4>
                            <ul className="space-y-2 text-sm text-[#F2D5A0]/80">
                                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                                <li><a href="#sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-[#F2D5A0]/80">
                                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-[#F2D5A0]/20 pt-8 text-center text-sm text-[#F2D5A0]/60">
                        © 2024 Isotek. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
