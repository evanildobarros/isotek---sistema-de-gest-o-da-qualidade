import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Shield, BarChart3, Users, CheckCircle2, FileText, TrendingUp } from 'lucide-react';
import logo from './assets/isotek-logo.png';
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
        <div className="min-h-screen bg-white font-sans text-[#025159]">

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
                                className={`h-8 sm:h-9 w-auto transition-all duration-300 ${!isScrolled ? 'brightness-0 invert' : ''
                                    }`}
                            />
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                            <button
                                onClick={() => scrollToSection('inicio')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Início
                            </button>
                            <button
                                onClick={() => scrollToSection('sobre')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Sobre Nós
                            </button>
                            <button
                                onClick={() => scrollToSection('funcionalidades')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Funcionalidades
                            </button>
                            <button
                                onClick={() => scrollToSection('contato')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Contato
                            </button>
                            <button
                                onClick={handleLoginClick}
                                className={`px-6 py-2 border-2 text-sm font-bold rounded-full transition-all ${isScrolled
                                    ? 'border-[#025159] text-[#025159] hover:bg-[#025159] hover:text-white'
                                    : 'border-blue-50 text-blue-50 hover:bg-blue-50 hover:text-[#0B1121]'
                                    }`}
                            >
                                Entrar
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-[#025159] hover:bg-[#C4EEF2]/30' : 'text-blue-50 hover:bg-white/10'}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-[#7AB8BF]/30 animate-fade-in absolute w-full shadow-2xl overflow-hidden">
                        <div className="px-4 pt-4 pb-8 space-y-3">
                            <button onClick={() => scrollToSection('inicio')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#025159] hover:bg-[#C4EEF2]/40 rounded-xl transition-all">Início</button>
                            <button onClick={() => scrollToSection('sobre')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#025159] hover:bg-[#C4EEF2]/40 rounded-xl transition-all">Sobre Nós</button>
                            <button onClick={() => scrollToSection('funcionalidades')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#025159] hover:bg-[#C4EEF2]/40 rounded-xl transition-all">Funcionalidades</button>
                            <button onClick={() => scrollToSection('contato')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#025159] hover:bg-[#C4EEF2]/40 rounded-xl transition-all">Contato</button>
                            <div className="pt-4 px-2">
                                <button
                                    onClick={handleLoginClick}
                                    className="w-full px-6 py-4 bg-[#025159] text-white text-lg font-bold rounded-xl hover:bg-[#025159]/90 transition-all shadow-lg active:scale-95"
                                >
                                    Entrar na Plataforma
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* A. HERO SECTION */}
            <section id="inicio" className="pt-32 pb-20 lg:pt-40 lg:pb-28 relative overflow-hidden min-h-screen flex items-center bg-cover bg-center" style={{ backgroundImage: "url('/assets/hero-background.jpg')" }}>
                {/* Dark Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B1121]/90 to-[#0B1121]/60 z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full animate-slide-up">
                    {/* Text Content */}
                    <div className="text-white max-w-3xl">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
                            Isotek: O Futuro do <br />
                            seu <span className="text-blue-400">SGQ</span> Começa <br className="hidden sm:block" />
                            Aqui.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-200 mb-12 leading-relaxed max-w-2xl opacity-90">
                            Transforme a gestão da qualidade da sua empresa com uma plataforma inteligente, integrada e pronta para escalar. Simplifique processos, garanta conformidade e tome decisões estratégicas com dados em tempo real.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5">
                            <button
                                onClick={handleLoginClick}
                                className="px-10 py-5 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-2xl text-center group"
                            >
                                Comece Agora
                                <TrendingUp className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </button>
                            <a
                                href="#contato"
                                className="px-10 py-5 border-2 border-white/30 backdrop-blur-sm text-white text-lg font-bold rounded-full hover:bg-white hover:text-[#0B1121] transition-all text-center"
                            >
                                Fale com Vendas
                            </a>
                        </div>
                    </div>
                </div>

                {/* Subtle Floating Decorative Elements */}
                <div className="absolute bottom-10 right-10 opacity-20 hidden lg:block animate-reveal">
                    <Shield size={300} className="text-blue-400" />
                </div>
            </section>

            {/* B. SEÇÃO "SOBRE A ISOTEK" */}
            <section id="sobre" className="py-24 bg-white min-h-[80vh] flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Image (Left) */}
                        <div className="relative order-2 lg:order-1 group">
                            <div className="absolute -left-4 -bottom-4 w-full h-full bg-[#7AB8BF]/20 rounded-3xl -z-10 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform duration-500"></div>
                            <div className="overflow-hidden rounded-3xl shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
                                    alt="Quality Control"
                                    className="w-full object-cover h-[350px] md:h-[450px] transform group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -top-6 -right-6 bg-[#A67458] text-white p-6 rounded-2xl shadow-xl hidden md:block animate-reveal">
                                <div className="text-3xl font-black">10+</div>
                                <div className="text-xs uppercase tracking-widest font-bold opacity-80">Anos de <br />Experiência</div>
                            </div>
                        </div>

                        {/* Text (Right) */}
                        <div className="order-1 lg:order-2">
                            <div className="inline-block px-4 py-1.5 bg-[#C4EEF2] text-[#025159] text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                                Quem Somos
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#025159] mb-8 leading-tight">
                                Mais que um software, <br className="hidden md:block" />
                                <span className="text-[#A67458]">seu parceiro de conformidade.</span>
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed mb-10">
                                A Isotek une tecnologia de ponta e expertise normativa para guiar sua empresa rumo à excelência.
                                Eliminamos a complexidade para que você possa focar no que realmente importa:
                                a qualidade do seu product e a satisfação do seu cliente.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#7AB8BF] transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <CheckCircle2 className="text-[#A67458]" size={22} />
                                    </div>
                                    <span className="text-[#025159] font-bold">Auditorias Ágeis</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#7AB8BF] transition-colors">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <CheckCircle2 className="text-[#A67458]" size={22} />
                                    </div>
                                    <span className="text-[#025159] font-bold">Risco Zero</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* C. O MÉTODO (01, 02, 03) */}
            <section id="funcionalidades" className="py-24 bg-[#F0F9FA] relative overflow-hidden">
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
                        <div className="inline-block px-4 py-1.5 bg-[#A67458]/10 text-[#A67458] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                            Metodologia
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-[#025159]">O Método Isotek</h2>
                        <div className="w-20 h-1.5 bg-[#A67458] mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {/* Step 1 */}
                        <div className="group relative p-10 pt-16 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#A67458]/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="absolute top-8 right-8 text-7xl font-black text-[#A67458]/10 select-none leading-none group-hover:text-[#A67458]/20 transition-colors">
                                01
                            </div>
                            <h3 className="text-2xl font-bold text-[#025159] mb-6 relative z-10 group-hover:text-[#A67458] transition-colors">Diagnóstico</h3>
                            <p className="text-gray-500 leading-relaxed relative z-10">
                                Identifique gaps nos seus processos atuais com nossa ferramenta de análise inteligente e mapeamento de riscos automático.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="group relative p-10 pt-16 bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden md:scale-105 z-10">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#025159]/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="absolute top-8 right-8 text-7xl font-black text-[#A67458]/10 select-none leading-none group-hover:text-[#A67458]/20 transition-colors">
                                02
                            </div>
                            <h3 className="text-2xl font-bold text-[#025159] mb-6 relative z-10 group-hover:text-[#A67458] transition-colors">Implementação</h3>
                            <p className="text-gray-500 leading-relaxed relative z-10">
                                Digitalize documentos, centralize indicadores e treine sua equipe com nossa plataforma intuitiva e trilhas de aprendizado.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="group relative p-10 pt-16 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#7AB8BF]/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="absolute top-8 right-8 text-7xl font-black text-[#A67458]/10 select-none leading-none group-hover:text-[#A67458]/20 transition-colors">
                                03
                            </div>
                            <h3 className="text-2xl font-bold text-[#025159] mb-6 relative z-10 group-hover:text-[#A67458] transition-colors">Certificação</h3>
                            <p className="text-gray-500 leading-relaxed relative z-10">
                                Receba auditores com confiança total, acesso rápido a evidências e garanta seu selo de qualidade ISO 9001 de forma simplificada.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* D. DEPOIMENTO */}
            <section className="py-24 bg-[#025159] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#7AB8BF]/10 skew-x-12 translate-x-20"></div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <div className="mb-10 flex justify-center">
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                            <FileText size={48} className="text-[#C4EEF2]" />
                        </div>
                    </div>
                    <blockquote className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-tight mb-12 italic">
                        "A Isotek transformou nossa auditoria interna, que antes era um pesadelo de planilhas, em um processo fluido, transparente e totalmente organizado."
                    </blockquote>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-tr from-[#A67458] to-[#D9966C] rounded-full border-4 border-white/20 flex items-center justify-center text-white text-xl font-black shadow-2xl">
                            JD
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-white text-lg">João Doria</div>
                            <div className="text-[#C4EEF2]/70 text-sm uppercase tracking-widest font-bold">CEO, Indústria Tech</div>
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
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#025159] mb-4">
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
                                        <div className="px-8 py-4 bg-gray-50 rounded-xl font-bold text-gray-400 group-hover:text-[#025159] group-hover:bg-[#C4EEF2]/30 transition-all">
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
                <div className="w-full md:w-1/2 bg-[#025159] text-white p-12 lg:p-24 flex flex-col justify-between">
                    <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-10">
                            <img src={logo} alt="Isotek Logo" className="h-12 w-auto brightness-0 invert" />
                        </div>
                        <p className="text-[#C4EEF2]/70 mb-12 text-lg leading-relaxed">
                            Elevando o padrão de qualidade da sua empresa com tecnologia de ponta, processos simplificados e foco total na excelência operacional.
                        </p>
                        <nav className="grid grid-cols-2 gap-y-4 gap-x-8 mb-16">
                            <button onClick={() => scrollToSection('inicio')} className="text-left text-sm font-bold hover:text-[#C4EEF2] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#A67458] rounded-full"></span> Home
                            </button>
                            <button onClick={() => scrollToSection('sobre')} className="text-left text-sm font-bold hover:text-[#C4EEF2] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#A67458] rounded-full"></span> Sobre Nós
                            </button>
                            <button onClick={() => scrollToSection('funcionalidades')} className="text-left text-sm font-bold hover:text-[#C4EEF2] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#A67458] rounded-full"></span> Soluções
                            </button>
                            <button onClick={() => scrollToSection('contato')} className="text-left text-sm font-bold hover:text-[#C4EEF2] transition-colors flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#A67458] rounded-full"></span> Contato
                            </button>
                        </nav>
                    </div>
                    <div className="text-xs text-white/30 font-medium tracking-widest uppercase mt-8 md:mt-0">
                        © 2024 Isotek Systems. Premium Quality Management.
                    </div>
                </div>

                {/* Right Side (Terracotta) */}
                <div className="w-full md:w-1/2 bg-[#A67458] text-white p-12 lg:p-24 relative overflow-hidden flex flex-col justify-center">
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
                            <button className="w-full px-8 py-5 bg-[#025159] text-white font-black rounded-2xl hover:bg-[#025159]/90 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl text-lg uppercase tracking-widest">
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
