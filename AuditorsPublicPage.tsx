import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    ShieldCheck,
    Search,
    FileText,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    ClipboardCheck,
    BarChart,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import logo from './assets/isotek-logo.png';

export const AuditorsPublicPage: React.FC = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white font-sans text-[#2D3773]">
            {/* HEADER / NAV */}
            <header
                className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <img
                                src={logo}
                                alt="Isotek Logo"
                                className={`h-8 w-auto transition-all ${!isScrolled ? 'brightness-0 invert' : ''}`}
                            />
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                            <button
                                onClick={() => navigate('/')}
                                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#2D3773] hover:text-[#0AADBF]' : 'text-white hover:text-[#4AD9D9]'}`}
                            >
                                Início
                            </button>

                            {/* Serviços Dropdown */}
                            <div className="relative group" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}>
                                <button
                                    className={`flex items-center gap-1 text-sm font-semibold transition-colors ${isScrolled ? 'text-[#2D3773] hover:text-[#0AADBF]' : 'text-white hover:text-[#4AD9D9]'}`}
                                >
                                    Serviços
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isServicesOpen && (
                                    <div className="absolute top-full -left-4 pt-4 w-48 animate-slide-up">
                                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2">
                                            <button
                                                onClick={() => { navigate('/'); setTimeout(() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' }), 100); setIsServicesOpen(false); }}
                                                className="w-full text-left px-5 py-3 text-sm font-bold text-[#2D3773] hover:bg-[#E0F7F9]/40 hover:text-[#0AADBF] transition-all"
                                            >
                                                Método
                                            </button>
                                            <button
                                                onClick={() => { setIsServicesOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className="w-full text-left px-5 py-3 text-sm font-bold text-[#0AADBF] bg-[#E0F7F9]/20"
                                            >
                                                Auditores
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={scrollToTop}
                                className={`px-6 py-2 border-2 text-sm font-bold rounded-full transition-all ${isScrolled
                                    ? 'border-[#2D3773] text-[#2D3773] hover:bg-[#2D3773] hover:text-white'
                                    : 'border-white text-white hover:bg-white hover:text-[#2D3773]'
                                    }`}
                            >
                                Entrar
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-[#2D3773] hover:bg-[#E0F7F9]/30' : 'text-white hover:bg-white/10'}`}
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
                            <button onClick={() => navigate('/')} className="block w-full text-left px-4 py-3 text-lg font-bold text-[#2D3773] hover:bg-[#E0F7F9]/40 rounded-xl transition-all">Início</button>

                            <div className="space-y-1">
                                <div className="px-4 py-2 text-xs font-black text-gray-400 uppercase tracking-widest">Serviços</div>
                                <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="block w-full text-left px-8 py-2 text-base font-bold text-[#2D3773] hover:text-[#0AADBF] transition-all">Método</button>
                                <button onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="block w-full text-left px-8 py-2 text-base font-bold text-[#0AADBF] transition-all">Página dos Auditores</button>
                            </div>

                            <div className="pt-4 px-2">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full px-6 py-4 bg-[#2D3773] text-white text-lg font-bold rounded-xl hover:bg-[#2D3773]/90 transition-all shadow-lg active:scale-95"
                                >
                                    Entrar na Plataforma
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[#2D3773] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D3773] via-[#16558C] to-[#0378A6] opacity-90"></div>
                <div className="absolute -right-20 -bottom-20 opacity-10">
                    <Search size={500} className="text-white" />
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center lg:text-left">
                    <div className="max-w-3xl">
                        <div className="inline-block px-4 py-1.5 bg-[#4AD9D9]/20 text-[#4AD9D9] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                            Especialistas em Qualidade
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-8">
                            Auditores: Os Guardiões da <span className="text-[#0AADBF]">Excelência</span>
                        </h1>
                        <p className="text-xl text-blue-100/80 mb-10 leading-relaxed">
                            Mais do que verificadores, os auditores são agentes de mudança. Conheça como a Isotek empodera esses profissionais para transformar conformidade em vantagem competitiva.
                        </p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-4 bg-[#0AADBF] text-white font-bold rounded-xl hover:bg-[#0AADBF]/90 transition-all shadow-xl hover:scale-105 active:scale-95"
                            >
                                Começar Agora
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* PERFIS DE AUDITORES */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-black mb-6">Perfís de Auditoria</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            Diferentes perspectivas que se unem para um único propósito: a evolução contínua da sua organização.
                        </p>
                        <div className="w-20 h-1.5 bg-[#0AADBF] mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Perfil 1: Interno */}
                        <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                            <div className="w-14 h-14 bg-[#2D3773]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#2D3773] transition-colors duration-500">
                                <Users size={28} className="text-[#2D3773] group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Auditor Interno</h3>
                            <p className="text-gray-500 mb-6 font-medium">
                                O multiplicador da cultura interna. Focado em identificar melhorias no dia a dia e preparar a casa para auditorias externas.
                            </p>
                            <ul className="space-y-3">
                                {['Mapeamento de Processos', 'Cultura da Qualidade', 'Auto-avaliação'].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-sm font-bold text-[#2D3773]/70">
                                        <CheckCircle2 size={16} className="text-[#0AADBF]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Perfil 2: Externo */}
                        <div className="p-8 bg-[#2D3773] text-white rounded-3xl shadow-xl md:scale-110 z-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 -translate-y-10"></div>
                            <div className="w-14 h-14 bg-[#0AADBF] rounded-2xl flex items-center justify-center mb-8">
                                <ShieldCheck size={28} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Auditor Externo</h3>
                            <p className="text-blue-100/70 mb-6 font-medium">
                                A voz da imparcialidade. Valida a conformidade normativa e garante a credibilidade das certificações internacionais.
                            </p>
                            <ul className="space-y-3">
                                {['Certificação ISO', 'Visão Imparcial', 'Validação Técnica'].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-sm font-bold text-[#4AD9D9]">
                                        <CheckCircle2 size={16} className="text-[#4AD9D9]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Perfil 3: Líder */}
                        <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                            <div className="w-14 h-14 bg-[#0378A6]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0378A6] transition-colors duration-500">
                                <BarChart size={28} className="text-[#0378A6] group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Líder de Auditoria</h3>
                            <p className="text-gray-500 mb-6 font-medium">
                                O arquiteto da conformidade. Planeja cronogramas, coordena equipes e traduz achados em decisões estratégicas.
                            </p>
                            <ul className="space-y-3">
                                {['Gestão de Equipes', 'Visão Estratégica', 'Relatórios Executivos'].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-sm font-bold text-[#2D3773]/70">
                                        <CheckCircle2 size={16} className="text-[#0AADBF]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* IMPORTANCIA PARA A EMPRESA */}
            <section className="py-24 bg-[#E0F7F9]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-4 py-1.5 bg-[#0AADBF]/10 text-[#0378A6] text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                                Relevância Estratégica
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
                                Por que Auditoria é o <span className="text-[#0AADBF]">Coração</span> do Sucesso?
                            </h2>
                            <div className="space-y-8">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center">
                                        <TrendingUp size={24} className="text-[#0AADBF]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Redução de Riscos</h4>
                                        <p className="text-gray-500">Identificação antecipada de falhas que poderiam causar prejuízos financeiros ou de imagem.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center">
                                        <Search size={24} className="text-[#2D3773]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Transparência Total</h4>
                                        <p className="text-gray-500">Processos claros e auditáveis que geram confiança entre stakeholders e investidores.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center">
                                        <ClipboardCheck size={24} className="text-[#0AADBF]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Melhoria Contínua</h4>
                                        <p className="text-gray-500">Transformação de conformidade passiva em uma cultura proativa de evolução de processos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-[#0AADBF] to-[#4AD9D9] rounded-3xl opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>
                            <img
                                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80"
                                alt="Auditor working with tablet"
                                className="relative rounded-3xl shadow-2xl z-10 w-full object-cover h-[500px]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ISOTEK PARA AUDITORES */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-5xl font-black mb-16">Ferramentas de <span className="text-[#0AADBF]">Ponta</span></h2>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <FileText className="text-[#2D3773]" />,
                                title: "Evidências Digitais",
                                desc: "Adeus papelada. Tudo centralizado e acessível em um clique."
                            },
                            {
                                icon: <ClipboardCheck className="text-[#0AADBF]" />,
                                title: "Relatórios de NC",
                                desc: "Geração automática de não conformidades com fotos e logs."
                            },
                            {
                                icon: <CheckCircle2 className="text-[#4AD9D9]" />,
                                title: "Planos de Ação",
                                desc: "Acompanhe a correção das falhas em tempo real e de forma visual."
                            },
                            {
                                icon: <Search className="text-[#16558C]" />,
                                title: "Histórico Completo",
                                desc: "Rastreabilidade total para auditorias passadas e futuras."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-gray-100">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                    {item.icon}
                                </div>
                                <h4 className="text-lg font-bold mb-3">{item.title}</h4>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-[#2D3773] rounded-[2rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                            <ShieldCheck size={400} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 relative z-10">
                            Pronto para elevar o nível da sua auditoria?
                        </h2>
                        <p className="text-blue-100/70 text-lg mb-12 max-w-2xl mx-auto relative z-10">
                            Simplifique o trabalho complexo e foque na excelência da sua gestão com as ferramentas que os melhores auditores recomendam.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-10 py-5 bg-[#0AADBF] text-white font-black rounded-2xl hover:bg-[#0AADBF]/90 transition-all text-lg uppercase tracking-widest shadow-xl"
                            >
                                Experimentar Isotek
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="px-10 py-5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white hover:text-[#2D3773] transition-all text-lg"
                            >
                                Ver Soluções
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER LIGHT */}
            <footer className="py-12 border-t border-gray-100 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Isotek" className="h-6 w-auto opacity-50" />
                        <span className="text-gray-400 font-bold text-sm tracking-widest uppercase">Auditors Focus</span>
                    </div>
                    <div className="flex gap-8 text-sm font-bold text-gray-400">
                        <button onClick={() => navigate('/')} className="hover:text-[#2D3773] transition-colors">Início</button>
                        <button onClick={() => navigate('/login')} className="hover:text-[#2D3773] transition-colors">Entrar</button>
                        <button onClick={scrollToTop} className="hover:text-[#2D3773] transition-colors">Voltar ao Topo</button>
                    </div>
                    <div className="text-xs text-gray-300 font-medium">
                        © 2024 Isotek Systems. Premium Quality Management.
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Sub-component for missing icon
const TrendingUp: React.FC<{ size?: number, className?: string }> = ({ size = 20, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);
