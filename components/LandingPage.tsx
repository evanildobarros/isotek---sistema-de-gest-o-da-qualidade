import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    X,
    Quote,
    ArrowRight,
    CheckCircle
} from 'lucide-react';
import logo from '../assets/isotek-logo.png';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // 1. MENU FIXO (Sticky Navbar logic)
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLoginClick = () => {
        navigate('/login');
    };

    // 2. ROLAGEM SUAVE (Smooth Scroll logic)
    const scrollToSection = (id: string) => {
        setIsMenuOpen(false); // Close mobile menu if open
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-[#8C512E]">
            {/* NAVBAR */}
            <header
                className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('inicio')}>
                            <img src={logo} alt="Isotek Logo" className="h-10 w-auto" />
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <button
                                onClick={() => scrollToSection('inicio')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#8C512E] hover:text-[#BF7B54]' : 'text-white hover:text-[#F2AD85]'}`}
                            >
                                Início
                            </button>
                            <button
                                onClick={() => scrollToSection('sobre')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#8C512E] hover:text-[#BF7B54]' : 'text-white hover:text-[#F2AD85]'}`}
                            >
                                Sobre Nós
                            </button>
                            <button
                                onClick={() => scrollToSection('funcionalidades')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#8C512E] hover:text-[#BF7B54]' : 'text-white hover:text-[#F2AD85]'}`}
                            >
                                Funcionalidades
                            </button>
                            <button
                                onClick={() => scrollToSection('contato')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#8C512E] hover:text-[#BF7B54]' : 'text-white hover:text-[#F2AD85]'}`}
                            >
                                Contato
                            </button>
                            <button
                                onClick={handleLoginClick}
                                className={`px-6 py-2 border-2 text-sm font-bold rounded-lg transition-all ${isScrolled
                                    ? 'border-[#8C512E] text-[#8C512E] hover:bg-[#F2AD85]'
                                    : 'border-white text-white hover:bg-white hover:text-[#BF7B54]'
                                    }`}
                            >
                                Entrar
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className={`md:hidden p-2 ${isScrolled ? 'text-[#8C512E]' : 'text-white'}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-[#AED3F2] animate-fade-in absolute w-full shadow-lg">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <button onClick={() => scrollToSection('inicio')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#8C512E] hover:bg-[#AED3F2] rounded-md">Início</button>
                            <button onClick={() => scrollToSection('sobre')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#8C512E] hover:bg-[#AED3F2] rounded-md">Sobre Nós</button>
                            <button onClick={() => scrollToSection('funcionalidades')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#8C512E] hover:bg-[#AED3F2] rounded-md">Funcionalidades</button>
                            <button onClick={() => scrollToSection('contato')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#8C512E] hover:bg-[#AED3F2] rounded-md">Contato</button>
                            <button
                                onClick={handleLoginClick}
                                className="w-full mt-4 px-5 py-3 border-2 border-[#8C512E] text-[#8C512E] text-base font-bold rounded-lg hover:bg-[#F2AD85] transition-all"
                            >
                                Entrar
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* A. HERO SECTION */}
            <section id="inicio" className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-[#AED3F2] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <div className="text-white">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                                Gestão da Qualidade <br />
                                ISO 9001 Simplificada.
                            </h1>
                            <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed max-w-lg">
                                Descubra os segredos da certificação sem burocracia.
                            </p>
                            <button
                                onClick={() => scrollToSection('funcionalidades')}
                                className="px-8 py-4 bg-[#8C512E] text-white text-lg font-bold rounded-full hover:bg-white hover:text-[#8C512E] transition-all shadow-lg flex items-center gap-2"
                            >
                                Começar Agora
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        {/* Image */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#8C512E] rounded-2xl transform rotate-3 opacity-20"></div>
                            <img
                                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
                                alt="Business Strategy"
                                className="relative rounded-2xl shadow-2xl w-full object-cover h-[400px] md:h-[500px]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* B. SEÇÃO "SOBRE A ISOTEK" */}
            <section id="sobre" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Image (Left) */}
                        <div className="relative order-2 lg:order-1">
                            <div className="absolute -left-4 -bottom-4 w-2/3 h-2/3 bg-[#AED3F2] rounded-2xl -z-10"></div>
                            <img
                                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
                                alt="Quality Control"
                                className="rounded-2xl shadow-xl w-full object-cover h-[400px]"
                            />
                        </div>

                        {/* Text (Right) */}
                        <div className="order-1 lg:order-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#8C512E] mb-6">
                                Mais que um software, <br />
                                <span className="text-[#BF7B54]">seu parceiro de conformidade.</span>
                            </h2>
                            <p className="text-lg text-[#8C512E]/80 leading-relaxed mb-8">
                                A Isotek une tecnologia e expertise para guiar sua empresa rumo à excelência.
                                Eliminamos a complexidade para que você possa focar no que realmente importa:
                                a qualidade do seu produto e a satisfação do seu cliente.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[#8C512E] font-medium">
                                    <CheckCircle className="text-[#BF7B54]" size={20} />
                                    Auditorias Ágeis
                                </div>
                                <div className="flex items-center gap-2 text-[#8C512E] font-medium">
                                    <CheckCircle className="text-[#BF7B54]" size={20} />
                                    Risco Zero
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* C. O MÉTODO (01, 02, 03) */}
            <section id="funcionalidades" className="py-20 bg-[#FAF8F5]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-bold text-[#8C512E]">O Método Isotek</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="relative p-8 pt-16 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-b-4 border-[#BF7B54]">
                            <div className="absolute top-4 right-4 text-8xl font-black text-[#80BDF2] opacity-50 select-none leading-none">
                                01
                            </div>
                            <h3 className="text-2xl font-bold text-[#8C512E] mb-4 relative z-10">Diagnóstico</h3>
                            <p className="text-[#8C512E]/70 relative z-10">
                                Identifique gaps nos seus processos atuais com nossa ferramenta de análise inteligente.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative p-8 pt-16 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-b-4 border-[#BF7B54]">
                            <div className="absolute top-4 right-4 text-8xl font-black text-[#80BDF2] opacity-50 select-none leading-none">
                                02
                            </div>
                            <h3 className="text-2xl font-bold text-[#8C512E] mb-4 relative z-10">Implementação</h3>
                            <p className="text-[#8C512E]/70 relative z-10">
                                Digitalize documentos e treine sua equipe com nossa plataforma intuitiva e guiada.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative p-8 pt-16 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-b-4 border-[#BF7B54]">
                            <div className="absolute top-4 right-4 text-8xl font-black text-[#80BDF2] opacity-50 select-none leading-none">
                                03
                            </div>
                            <h3 className="text-2xl font-bold text-[#8C512E] mb-4 relative z-10">Certificação</h3>
                            <p className="text-[#8C512E]/70 relative z-10">
                                Receba auditores com confiança total e garanta seu selo de qualidade ISO 9001.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* D. DEPOIMENTO (Quote) */}
            <section className="py-24 bg-[#AED3F2] relative">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="mb-8 flex justify-center">
                        <Quote size={64} className="text-[#BF7B54] opacity-80" fill="currentColor" />
                    </div>
                    <blockquote className="text-3xl md:text-4xl font-bold text-[#8C512E] leading-tight mb-8">
                        "A Isotek transformou nossa auditoria num processo tranquilo e organizado."
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-[#8C512E] rounded-full flex items-center justify-center text-white font-bold">
                            JD
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-[#8C512E]">João Doria</div>
                            <div className="text-sm text-[#8C512E]/60">CEO, Indústria Tech</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* E. RODAPÉ PROFISSIONAL (Split Footer) */}
            <footer id="contato" className="flex flex-col md:flex-row">
                {/* Left Side (Dark) */}
                <div className="w-full md:w-1/2 bg-[#8C512E] text-white p-12 lg:p-20">
                    <div className="max-w-md mx-auto md:mx-0">
                        <div className="flex items-center gap-2 mb-6">
                            <img src={logo} alt="Isotek Logo" className="h-12 w-auto brightness-0 invert" />
                        </div>
                        <p className="text-[#F2AD85]/80 mb-10 leading-relaxed">
                            Elevando o padrão de qualidade da sua empresa com tecnologia de ponta e simplicidade.
                        </p>
                        <nav className="flex flex-wrap gap-6 mb-12 text-sm font-medium">
                            <button onClick={() => scrollToSection('inicio')} className="hover:text-[#F2AD85] transition-colors">Home</button>
                            <button onClick={() => scrollToSection('funcionalidades')} className="hover:text-[#F2AD85] transition-colors">Funcionalidades</button>
                            <button onClick={() => scrollToSection('contato')} className="hover:text-[#F2AD85] transition-colors">Contato</button>
                        </nav>
                        <div className="text-xs text-white/40">
                            © 2024 Isotek. Todos os direitos reservados.
                        </div>
                    </div>
                </div>

                {/* Right Side (Copper) */}
                <div className="w-full md:w-1/2 bg-[#BF7B54] text-white p-12 lg:p-20 relative overflow-hidden">
                    <div className="max-w-md mx-auto md:mx-0 relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Receba dicas de Gestão</h3>
                        <p className="text-white/80 mb-8">
                            Junte-se a mais de 5.000 gestores que recebem nossos conteúdos.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="Seu melhor e-mail"
                                className="flex-1 px-4 py-3 rounded-lg text-[#8C512E] focus:outline-none focus:ring-2 focus:ring-[#8C512E]"
                            />
                            <button className="px-6 py-3 bg-[#8C512E] text-white font-bold rounded-lg hover:bg-[#6d3e23] transition-colors">
                                Assinar
                            </button>
                        </div>
                    </div>

                    {/* Decorative Element */}
                    <div className="absolute -bottom-10 -right-10 opacity-10">
                        <CheckCircle size={200} fill="currentColor" />
                    </div>
                </div>
            </footer>
        </div>
    );
};
