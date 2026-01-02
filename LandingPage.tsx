import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Shield, BarChart3, Users, CheckCircle2, FileText, TrendingUp, ChevronDown, Search } from 'lucide-react';
import logo from './assets/isotek-logo.png';
import aboutImg from './assets/about-executive.png';
import heroNewImg from './assets/hero-new-design.png';
import { supabase } from './lib/supabase';

interface CompanyLogo {
    id: string;
    name: string;
    logo_url: string | null;
}

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [companyLogos, setCompanyLogos] = useState<CompanyLogo[]>([]);

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

    // Buscar logos das empresas cadastradas
    useEffect(() => {
        const fetchCompanyLogos = async () => {
            try {
                const { data, error } = await supabase
                    .from('company_info')
                    .select('id, name, logo_url')
                    .neq('logo_url', '')
                    .not('logo_url', 'is', null)
                    .limit(6);

                if (error) {
                    console.error('❌ Erro ao buscar logos:', error);
                } else if (data && data.length > 0) {
                    setCompanyLogos(data);
                }
            } catch (err) {
                console.error('Erro ao buscar logos:', err);
            }
        };
        fetchCompanyLogos();
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
        <div className="min-h-screen bg-white font-sans text-[#2D3773]">

            {/* NAVBAR */}
            <header
                className={`fixed w-full z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg py-3'
                    : 'bg-transparent py-5'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('inicio')}>
                            <img
                                src={logo}
                                alt="Isotek Logo"
                                className="h-8 sm:h-9 w-auto transition-all duration-300"
                            />
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                            <button
                                onClick={() => scrollToSection('inicio')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#2D3773] hover:text-[#4AD9D9]' : 'text-[#2D3773]/70 hover:text-[#2D3773]'}`}
                            >
                                Início
                            </button>
                            <button
                                onClick={() => scrollToSection('sobre')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#2D3773] hover:text-[#4AD9D9]' : 'text-[#2D3773]/70 hover:text-[#2D3773]'}`}
                            >
                                Sobre Nós
                            </button>

                            {/* Serviços Dropdown */}
                            <div className="relative group" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}>
                                <button
                                    className={`flex items-center gap-1 text-sm font-semibold transition-colors ${isScrolled ? 'text-[#2D3773] hover:text-[#4AD9D9]' : 'text-[#2D3773]/70 hover:text-[#2D3773]'}`}
                                >
                                    Serviços
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isServicesOpen && (
                                    <div className="absolute top-full -left-4 pt-4 w-48 animate-slide-up">
                                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2">
                                            <button
                                                onClick={() => { scrollToSection('funcionalidades'); setIsServicesOpen(false); }}
                                                className="w-full text-left px-5 py-3 text-sm font-bold text-[#2D3773] hover:bg-[#E0F7F9]/40 hover:text-[#0AADBF] transition-all"
                                            >
                                                Método
                                            </button>
                                            <button
                                                onClick={() => { navigate('/foco-auditores'); setIsServicesOpen(false); }}
                                                className="w-full text-left px-5 py-3 text-sm font-bold text-[#2D3773] hover:bg-[#E0F7F9]/40 hover:text-[#0AADBF] transition-all"
                                            >
                                                Auditores
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => scrollToSection('contato')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#2D3773] hover:text-[#4AD9D9]' : 'text-[#2D3773]/70 hover:text-[#2D3773]'}`}
                            >
                                Contato
                            </button>
                            <button
                                onClick={handleLoginClick}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isScrolled
                                    ? 'bg-[#2D3773] text-white hover:bg-[#0AADBF] hover:shadow-lg'
                                    : 'bg-[#2D3773]/5 text-[#2D3773] border border-[#2D3773]/10 hover:bg-[#2D3773] hover:text-white'
                                    }`}
                            >
                                Entrar
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-[#2D3773] hover:bg-[#E0F7F9]/30' : 'text-blue-50 hover:bg-white/10'}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-[#4AD9D9]/30 animate-fade-in absolute w-full shadow-2xl overflow-hidden">
                        <div className="px-4 pt-4 pb-8 space-y-3">
                            <button onClick={() => scrollToSection('inicio')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#2D3773] hover:bg-[#E0F7F9]/40 rounded-xl transition-all">Início</button>
                            <button onClick={() => scrollToSection('sobre')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#2D3773] hover:bg-[#E0F7F9]/40 rounded-xl transition-all">Sobre Nós</button>

                            <div className="space-y-1">
                                <div className="px-4 py-2 text-xs font-black text-gray-400 uppercase tracking-widest">Serviços</div>
                                <button onClick={() => scrollToSection('funcionalidades')} className="block w-full text-left px-8 py-2 text-base font-bold text-[#2D3773] hover:text-[#0AADBF] transition-all">Método</button>
                                <button onClick={() => navigate('/foco-auditores')} className="block w-full text-left px-8 py-2 text-base font-bold text-[#2D3773] hover:text-[#0AADBF] transition-all">Página dos Auditores</button>
                            </div>

                            <button onClick={() => scrollToSection('contato')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#2D3773] hover:bg-[#E0F7F9]/40 rounded-xl transition-all">Contato</button>

                            <div className="pt-4 px-2">
                                <button
                                    onClick={handleLoginClick}
                                    className="w-full px-6 py-4 bg-[#2D3773] text-white text-lg font-bold rounded-xl hover:bg-[#2D3773]/90 transition-all shadow-lg active:scale-95"
                                >
                                    Entrar na Plataforma
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* A. HERO SECTION */}
            <section id="inicio" className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden min-h-screen flex items-center bg-[#F9FAFB]">
                {/* Subtle Geometric Background Patterns */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                    <svg className="absolute top-0 right-0 w-1/2 h-full" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M800 0L400 400L800 800V0Z" fill="#2D3773" />
                        <circle cx="600" cy="200" r="150" stroke="#0AADBF" strokeWidth="2" />
                        <rect x="500" y="500" width="200" height="200" transform="rotate(45 600 600)" stroke="#2D3773" strokeWidth="2" />
                    </svg>
                    <svg className="absolute bottom-0 left-0 w-1/3 h-1/2" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 400L200 200L0 0V400Z" fill="#0AADBF" />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full animate-slide-up">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Text Content */}
                        <div className="max-w-2xl">
                            <div className="inline-block px-4 py-1.5 mb-6 bg-[#0AADBF]/10 text-[#0AADBF] rounded-full text-sm font-bold tracking-wide uppercase">
                                Inteligência em Qualidade
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8 text-[#2D3773]">
                                # Isotek: <br />
                                Qualidade Inteligente. <br />
                                <span className="text-[#0AADBF]">Resultados Reais.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-xl">
                                Transforme a gestão da qualidade da sua empresa com nossa plataforma intuitiva e a assistente de IA exclusiva para SGQ.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5">
                                <button
                                    onClick={handleLoginClick}
                                    className="px-10 py-5 bg-[#0AADBF] text-white font-bold rounded-xl hover:bg-[#0AADBF]/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#0AADBF]/20 text-center"
                                >
                                    Agendar Demonstração Gratuita
                                </button>
                                <button
                                    className="px-10 py-5 border-2 border-[#2D3773]/10 text-[#2D3773] text-lg font-bold rounded-xl hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
                                >
                                    <span>Ver Video de 1 Minuto</span>
                                    <div className="w-8 h-8 rounded-full bg-[#2D3773]/5 flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-[#2D3773] border-b-[5px] border-b-transparent ml-1"></div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Professional Team Image (Unsplash placeholder matching reference) */}
                        <div className="relative group lg:block hidden">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-[#0AADBF]/10 to-transparent rounded-[3rem] -z-10 transform rotate-3"></div>
                            <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-white">
                                <img
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                                    alt="Equipe Isotek analisando dados"
                                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                                />
                                {/* Dashboard Overlay Element */}
                                <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 animate-slide-up">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#0AADBF] flex items-center justify-center text-white">
                                            <BarChart3 size={24} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-[#2D3773]">Performance Global</div>
                                            <div className="text-xs text-gray-500">Aumentou 24% este mês</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* B. SEÇÃO "SOBRE A ISOTEK" */}
            <section id="sobre" className="py-24 bg-white min-h-[80vh] flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Image (Left) */}
                        <div className="relative order-2 lg:order-1 group">
                            <div className="absolute -left-4 -bottom-4 w-full h-full bg-[#4AD9D9]/20 rounded-3xl -z-10 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform duration-500"></div>
                            <div className="overflow-hidden rounded-3xl shadow-2xl">
                                <img
                                    src={aboutImg}
                                    alt="Auditória Executiva"
                                    className="w-full object-cover h-[350px] md:h-[450px] transform group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -top-6 -right-6 bg-[#0AADBF] text-white p-6 rounded-2xl shadow-xl hidden md:block animate-reveal">
                                <div className="text-3xl font-black">10+</div>
                                <div className="text-xs uppercase tracking-widest font-bold opacity-80">Anos de <br />Experiência</div>
                            </div>
                        </div>

                        {/* Text (Right) */}
                        <div className="order-1 lg:order-2">
                            <div className="inline-block px-4 py-1.5 bg-[#E0F7F9] text-[#2D3773] text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                                Quem Somos
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#2D3773] mb-8 leading-tight">
                                Mais que um software, <br className="hidden md:block" />
                                <span className="text-[#0378A6]">seu parceiro de conformidade.</span>
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed mb-10">
                                A Isotek une tecnologia de ponta e expertise normativa para guiar sua empresa rumo à excelência.
                                Eliminamos a complexidade para que você possa focar no que realmente importa:
                                a qualidade do seu produto e a satisfação do seu cliente.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#4AD9D9] transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <CheckCircle2 className="text-[#0378A6]" size={22} />
                                    </div>
                                    <span className="text-[#2D3773] font-bold">Auditorias Ágeis</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#4AD9D9] transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <CheckCircle2 className="text-[#0378A6]" size={22} />
                                    </div>
                                    <span className="text-[#2D3773] font-bold">Risco Zero</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEÇÃO AUDITORES (NOVA) */}
            <section id="auditores" className="relative py-24 lg:py-32 bg-[#2D3773] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D3773] via-[#16558C] to-[#0378A6] opacity-90"></div>
                <div className="absolute -right-20 -bottom-20 opacity-10">
                    <Search size={500} className="text-white" />
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center lg:text-left">
                    <div className="max-w-3xl">
                        <div className="inline-block px-4 py-1.5 bg-[#4AD9D9]/20 text-[#4AD9D9] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                            Especialistas em Qualidade
                        </div>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-8">
                            Auditores: Os Guardiões da <span className="text-[#0AADBF]">Excelência</span>
                        </h2>
                        <p className="text-xl text-blue-100/80 mb-10 leading-relaxed">
                            Mais do que verificadores, os auditores são agentes de mudança. Conheça como a Isotek empodera esses profissionais para transformar conformidade em vantagem competitiva.
                        </p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            <button
                                onClick={handleLoginClick}
                                className="px-8 py-4 bg-[#0AADBF] text-white font-bold rounded-xl hover:bg-[#0AADBF]/90 transition-all shadow-xl hover:scale-105 active:scale-95"
                            >
                                Começar Agora
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* C. O MÉTODO (01, 02, 03) */}
            <section id="funcionalidades" className="py-24 bg-[#E0F7F9] relative overflow-hidden">
                {/* Decorative Pattern Background */}
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                    <div className="absolute top-20 left-20">
                        <BarChart3 size={400} />
                    </div>
                    <div className="absolute bottom-20 right-20">
                        <Users size={400} />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <div className="inline-block px-4 py-1.5 bg-[#0AADBF]/10 text-[#0378A6] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                            Metodologia
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-[#2D3773]">O Método Isotek</h2>
                        <div className="w-20 h-1.5 bg-[#0AADBF] mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {/* Step 1 */}
                        <div className="group relative p-10 pt-16 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#0AADBF]/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="absolute top-8 right-8 text-7xl font-black text-[#0378A6]/10 select-none leading-none group-hover:text-[#0378A6]/20 transition-colors">
                                01
                            </div>
                            <h3 className="text-2xl font-bold text-[#2D3773] mb-6 relative z-10 group-hover:text-[#0378A6] transition-colors">Diagnóstico</h3>
                            <p className="text-gray-500 leading-relaxed relative z-10">
                                Identifique gaps nos seus processos atuais com nossa ferramenta de análise inteligente e mapeamento de riscos automático.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="group relative p-10 pt-16 bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden md:scale-105 z-10">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#2D3773]/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="absolute top-8 right-8 text-7xl font-black text-[#0378A6]/10 select-none leading-none group-hover:text-[#0378A6]/20 transition-colors">
                                02
                            </div>
                            <h3 className="text-2xl font-bold text-[#2D3773] mb-6 relative z-10 group-hover:text-[#0378A6] transition-colors">Implementação</h3>
                            <p className="text-gray-500 leading-relaxed relative z-10">
                                Digitalize documentos, centralize indicadores e treine sua equipe com nossa plataforma intuitiva e trilhas de aprendizado.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="group relative p-10 pt-16 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#4AD9D9]/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="absolute top-8 right-8 text-7xl font-black text-[#0378A6]/10 select-none leading-none group-hover:text-[#0378A6]/20 transition-colors">
                                03
                            </div>
                            <h3 className="text-2xl font-bold text-[#2D3773] mb-6 relative z-10 group-hover:text-[#0378A6] transition-colors">Certificação</h3>
                            <p className="text-gray-500 leading-relaxed relative z-10">
                                Receba auditores com confiança total, acesso rápido a evidências e garanta seu selo de qualidade ISO 9001 de forma simplificada.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* D. DEPOIMENTO */}
            <section className="py-24 bg-[#2D3773] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#4AD9D9]/10 skew-x-12 translate-x-20"></div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <div className="mb-10 flex justify-center">
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                            <FileText size={48} className="text-[#E8FAF5]" />
                        </div>
                    </div>
                    <blockquote className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-tight mb-12 italic">
                        "A Isotek transformou nossa auditoria interna, que antes era um pesadelo de planilhas, em um processo fluido, transparente e totalmente organizado."
                    </blockquote>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-[#0378A6] rounded-full border-4 border-white/20 flex items-center justify-center text-white text-xl font-black shadow-2xl">
                            JD
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-white text-lg">João Doria</div>
                            <div className="text-[#E8FAF5]/70 text-sm uppercase tracking-widest font-bold">CEO, Indústria Tech</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* EMPRESAS QUE CONFIAM NA ISOTEK */}
            {companyLogos.length > 0 && (
                <section className="py-24 bg-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Título da seção */}
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2D3773] mb-4">
                                Empresas que Confiam na Isotek
                            </h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                                Junte-se a organizações que já elevaram seus padrões de qualidade.
                            </p>
                        </div>

                        {/* Grid de logos */}
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                            {companyLogos.map((company) => (
                                <div
                                    key={company.id}
                                    className="group relative transition-all duration-300 transform hover:scale-110"
                                    title={company.name}
                                >
                                    {company.logo_url ? (
                                        <div className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-gray-100">
                                            <img
                                                src={company.logo_url}
                                                alt={company.name}
                                                className="h-10 md:h-14 w-auto object-contain grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100 transition-all duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="px-8 py-4 bg-gray-50 rounded-xl font-bold text-gray-400 group-hover:text-[#2D3773] group-hover:bg-[#E0F7F9]/30 transition-all">
                                            {company.name}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* E. RODAPÉ PROFISSIONAL (Split Footer) */}
            <footer id="contato" className="flex flex-col md:flex-row min-h-[500px]">
                {/* Left Side (Dark) */}
                <div className="w-full md:w-1/2 bg-[#2D3773] text-white p-12 lg:p-24 flex flex-col justify-between">
                    <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-10">
                            <img src={logo} alt="Isotek Logo" className="h-12 w-auto brightness-0 invert" />
                        </div>
                        <p className="text-[#E8FAF5]/70 mb-12 text-lg leading-relaxed">
                            Elevando o padrão de qualidade da sua empresa com tecnologia de ponta, processos simplificados e foco total na excelência operacional.
                        </p>
                        <nav className="grid grid-cols-2 gap-y-4 gap-x-8 mb-16">
                            <button onClick={() => scrollToSection('inicio')} className="text-left text-sm font-bold hover:text-[#E8FAF5] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#0AADBF] rounded-full"></span> Home
                            </button>
                            <button onClick={() => scrollToSection('sobre')} className="text-left text-sm font-bold hover:text-[#E8FAF5] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#0AADBF] rounded-full"></span> Sobre Nós
                            </button>
                            <button onClick={() => scrollToSection('funcionalidades')} className="text-left text-sm font-bold hover:text-[#E8FAF5] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#0AADBF] rounded-full"></span> Serviços
                            </button>
                            <button onClick={() => scrollToSection('contato')} className="text-left text-sm font-bold hover:text-[#E8FAF5] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#0AADBF] rounded-full"></span> Contato
                            </button>
                            <button onClick={() => navigate('/foco-auditores')} className="text-left text-sm font-bold text-[#4AD9D9] hover:text-white transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#4AD9D9] rounded-full"></span> Para Auditores
                            </button>
                        </nav>
                    </div>
                    <div className="text-xs text-white/30 font-medium tracking-widest uppercase mt-8 md:mt-0">
                        © 2024 Isotek Systems. Premium Quality Management.
                    </div>
                </div>

                {/* Right Side (Terracotta) */}
                <div className="w-full md:w-1/2 bg-[#0378A6] text-white p-12 lg:p-24 relative overflow-hidden flex flex-col justify-center">
                    <div className="max-w-md relative z-10 w-full">
                        <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                            Newsletter
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Mantenha a sua <br />excelência em dia.</h3>
                        <p className="text-white/80 mb-10 text-lg">
                            Junte-se a mais de 5.000 líderes que já recebem nossas estratégias exclusivas de gestão.
                        </p>

                        <div className="space-y-4 w-full">
                            <input
                                type="email"
                                placeholder="Seu melhor e-mail corporativo"
                                className="w-full px-6 py-5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm transition-all text-lg"
                            />
                            <button className="w-full px-8 py-5 bg-[#2D3773] text-white font-black rounded-2xl hover:bg-[#2D3773]/90 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl text-lg uppercase tracking-widest">
                                Assinar Agora
                            </button>
                        </div>
                    </div>

                    {/* Decorative Element */}
                    <div className="absolute -bottom-20 -right-20 opacity-5 pointer-events-none">
                        <CheckCircle2 size={400} fill="currentColor" />
                    </div>
                </div>
            </footer>
        </div>
    );
};
