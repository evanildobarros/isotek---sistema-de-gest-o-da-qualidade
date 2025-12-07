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
                console.log('🔍 Buscando logos das empresas...');
                const { data, error } = await supabase
                    .from('company_info')
                    .select('id, name, logo_url')
                    .neq('logo_url', '')
                    .not('logo_url', 'is', null)
                    .limit(6);

                console.log('📦 Dados retornados:', data);
                console.log('❌ Erro:', error);

                if (!error && data && data.length > 0) {
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
                    ? 'bg-white/95 backdrop-blur-sm shadow-md py-3'
                    : 'bg-transparent py-5'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('inicio')}>
                            <img
                                src={logo}
                                alt="Isotek Logo"
                                className={`h-8 w-auto transition-all duration-300 ${!isScrolled ? 'brightness-0 invert' : ''
                                    }`}
                            />
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <button
                                onClick={() => scrollToSection('inicio')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Início
                            </button>
                            <button
                                onClick={() => scrollToSection('sobre')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Sobre Nós
                            </button>
                            <button
                                onClick={() => scrollToSection('funcionalidades')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Funcionalidades
                            </button>
                            <button
                                onClick={() => scrollToSection('contato')}
                                className={`text-sm font-medium transition-colors ${isScrolled ? 'text-[#025159] hover:text-[#7AB8BF]' : 'text-blue-50 hover:text-blue-300'}`}
                            >
                                Contato
                            </button>
                            <button
                                onClick={handleLoginClick}
                                className={`px-6 py-2 border-2 text-sm font-bold rounded-lg transition-all ${isScrolled
                                    ? 'border-[#025159] text-[#025159] hover:bg-[#C4EEF2]'
                                    : 'border-blue-50 text-blue-50 hover:bg-blue-50 hover:text-[#0B1121]'
                                    }`}
                            >
                                Entrar
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className={`md:hidden p-2 ${isScrolled ? 'text-[#025159]' : 'text-blue-50'}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-[#7AB8BF] animate-fade-in absolute w-full shadow-lg">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <button onClick={() => scrollToSection('inicio')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#025159] hover:bg-[#7AB8BF]/20 rounded-md">Início</button>
                            <button onClick={() => scrollToSection('sobre')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#025159] hover:bg-[#7AB8BF]/20 rounded-md">Sobre Nós</button>
                            <button onClick={() => scrollToSection('funcionalidades')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#025159] hover:bg-[#7AB8BF]/20 rounded-md">Funcionalidades</button>
                            <button onClick={() => scrollToSection('contato')} className="block w-full text-left px-3 py-2 text-base font-medium text-[#025159] hover:bg-[#7AB8BF]/20 rounded-md">Contato</button>
                            <button
                                onClick={handleLoginClick}
                                className="w-full mt-4 px-5 py-3 border-2 border-[#025159] text-[#025159] text-base font-bold rounded-lg hover:bg-[#C4EEF2] transition-all"
                            >
                                Entrar
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* A. HERO SECTION */}
            <section id="inicio" className="pt-32 pb-20 lg:pt-40 lg:pb-28 relative overflow-hidden min-h-screen flex items-center bg-cover bg-center" style={{ backgroundImage: "url('/assets/hero-background.jpg')" }}>
                {/* Dark Overlay for better text readability */}
                <div className="absolute inset-0 bg-[#0B1121]/70 z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    {/* Text Content */}
                    <div className="text-white">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                            Isotek: O Futuro do <br />
                            seu SGQ Começa <br />
                            Aqui.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
                            Transforme a gestão da qualidade da sua empresa com uma plataforma inteligente, integrada e pronta para escalar. Simplifique processos, garanta conformidade e tome decisões estratégicas com dados em tempo real.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleLoginClick}
                                className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg text-center"
                            >
                                Comece Agora
                            </button>
                            <a
                                href="#contato"
                                className="px-8 py-4 border-2 border-white text-white text-lg font-bold rounded-full hover:bg-white hover:text-[#0B1121] transition-all text-center"
                            >
                                Fale com Vendas
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* B. SEÇÃO "SOBRE A ISOTEK" */}
            <section id="sobre" className="py-20 bg-white min-h-screen flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Image (Left) */}
                        <div className="relative order-2 lg:order-1">
                            <div className="absolute -left-4 -bottom-4 w-2/3 h-2/3 bg-[#7AB8BF] rounded-2xl -z-10"></div>
                            <img
                                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
                                alt="Quality Control"
                                className="rounded-2xl shadow-xl w-full object-cover h-[400px]"
                            />
                        </div>

                        {/* Text (Right) */}
                        <div className="order-1 lg:order-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#025159] mb-6">
                                Mais que um software, <br />
                                <span className="text-[#A67458]">seu parceiro de conformidade.</span>
                            </h2>
                            <p className="text-lg text-[#025159]/80 leading-relaxed mb-8">
                                A Isotek une tecnologia e expertise para guiar sua empresa rumo à excelência.
                                Eliminamos a complexidade para que você possa focar no que realmente importa:
                                a qualidade do seu produto e a satisfação do seu cliente.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[#025159] font-medium">
                                    <CheckCircle2 className="text-[#A67458]" size={20} />
                                    Auditorias Ágeis
                                </div>
                                <div className="flex items-center gap-2 text-[#025159] font-medium">
                                    <CheckCircle2 className="text-[#A67458]" size={20} />
                                    Risco Zero
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* C. O MÉTODO (01, 02, 03) */}
            <section id="funcionalidades" className="py-20 bg-[#F0F9FA] min-h-screen flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-bold text-[#025159]">O Método Isotek</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="relative p-8 pt-16 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-b-4 border-[#A67458]">
                            <div className="absolute top-4 right-4 text-8xl font-black text-[#A67458]/25 select-none leading-none">
                                01
                            </div>
                            <h3 className="text-2xl font-bold text-[#025159] mb-4 relative z-10">Diagnóstico</h3>
                            <p className="text-[#025159]/70 relative z-10">
                                Identifique gaps nos seus processos atuais com nossa ferramenta de análise inteligente.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative p-8 pt-16 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-b-4 border-[#A67458]">
                            <div className="absolute top-4 right-4 text-8xl font-black text-[#A67458]/25 select-none leading-none">
                                02
                            </div>
                            <h3 className="text-2xl font-bold text-[#025159] mb-4 relative z-10">Implementação</h3>
                            <p className="text-[#025159]/70 relative z-10">
                                Digitalize documentos e treine sua equipe com nossa plataforma intuitiva e guiada.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative p-8 pt-16 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-b-4 border-[#A67458]">
                            <div className="absolute top-4 right-4 text-8xl font-black text-[#A67458]/25 select-none leading-none">
                                03
                            </div>
                            <h3 className="text-2xl font-bold text-[#025159] mb-4 relative z-10">Certificação</h3>
                            <p className="text-[#025159]/70 relative z-10">
                                Receba auditores com confiança total e garanta seu selo de qualidade ISO 9001.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* D. DEPOIMENTO (FileText) */}
            <section className="py-16 bg-[#7AB8BF] relative flex items-center">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="mb-8 flex justify-center">
                        <FileText size={64} className="text-[#A67458] opacity-80" fill="currentColor" />
                    </div>
                    <blockquote className="text-3xl md:text-4xl font-bold text-[#025159] leading-tight mb-8">
                        "A Isotek transformou nossa auditoria num processo tranquilo e organizado."
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-[#025159] rounded-full flex items-center justify-center text-white font-bold">
                            JD
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-[#025159]">João Doria</div>
                            <div className="text-sm text-[#025159]/60">CEO, Indústria Tech</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* EMPRESAS QUE CONFIAM NA ISOTEK */}
            {companyLogos.length > 0 && (
                <section className="py-20 bg-gradient-to-b from-white to-gray-50">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Título da seção */}
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#025159] mb-3">
                                Empresas que Confiam na Isotek
                            </h2>
                            <p className="text-gray-500 text-base max-w-xl mx-auto">
                                Organizações de diversos setores utilizam nossa plataforma para alcançar a excelência em gestão da qualidade
                            </p>
                        </div>

                        {/* Grid de logos */}
                        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
                            {companyLogos.map((company) => (
                                <div
                                    key={company.id}
                                    className="group p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
                                    title={company.name}
                                >
                                    {company.logo_url ? (
                                        <img
                                            src={company.logo_url}
                                            alt={company.name}
                                            style={{ height: '5rem' }}
                                            className="w-auto object-contain grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-300"
                                        />
                                    ) : (
                                        <span className="text-xl font-bold text-gray-600 group-hover:text-[#025159]">
                                            {company.name}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* E. RODAPÉ PROFISSIONAL (Split Footer) */}
            <footer id="contato" className="flex flex-col md:flex-row">
                {/* Left Side (Dark) */}
                <div className="w-full md:w-1/2 bg-[#025159] text-white p-12 lg:p-20">
                    <div className="max-w-md mx-auto md:mx-0">
                        <div className="flex items-center gap-2 mb-6">
                            <img src={logo} alt="Isotek Logo" className="h-12 w-auto brightness-0 invert" />
                        </div>
                        <p className="text-[#C4EEF2]/80 mb-10 leading-relaxed">
                            Elevando o padrão de qualidade da sua empresa com tecnologia de ponta e simplicidade.
                        </p>
                        <nav className="flex flex-wrap gap-6 mb-12 text-sm font-medium">
                            <button onClick={() => scrollToSection('inicio')} className="hover:text-[#C4EEF2] transition-colors">Home</button>
                            <button onClick={() => scrollToSection('funcionalidades')} className="hover:text-[#C4EEF2] transition-colors">Funcionalidades</button>
                            <button onClick={() => scrollToSection('contato')} className="hover:text-[#C4EEF2] transition-colors">Contato</button>
                        </nav>
                        <div className="text-xs text-white/40">
                            © 2024 Isotek. Todos os direitos reservados.
                        </div>
                    </div>
                </div>

                {/* Right Side (Terracotta) */}
                <div className="w-full md:w-1/2 bg-[#A67458] text-white p-12 lg:p-20 relative overflow-hidden">
                    <div className="max-w-md mx-auto md:mx-0 relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Receba dicas de Gestão</h3>
                        <p className="text-white/90 mb-8">
                            Junte-se a mais de 5.000 gestores que recebem nossos conteúdos.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="Seu melhor e-mail"
                                className="flex-1 px-4 py-3 rounded-lg text-[#025159] focus:outline-none focus:ring-2 focus:ring-[#025159]"
                            />
                            <button className="px-6 py-3 bg-[#025159] text-white font-bold rounded-lg hover:bg-[#3F858C] transition-colors">
                                Assinar
                            </button>
                        </div>
                    </div>

                    {/* Decorative Element */}
                    <div className="absolute -bottom-10 -right-10 opacity-10">
                        <CheckCircle2 size={200} fill="currentColor" />
                    </div>
                </div>
            </footer>
        </div>
    );
};
