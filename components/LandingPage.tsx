import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    ArrowRight,
    Target,
    Lightbulb,
    ShieldCheck,
    Users,
    TrendingUp,
    Award,
    Zap,
    Menu,
    X
} from 'lucide-react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* HEADER */}
            <header className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="30" cy="20" r="15" fill="#2dd4bf" />
                                <path d="M15 40 H45 V85 C45 93.2843 38.2843 100 30 100 C21.7157 100 15 93.2843 15 85 V40 Z" fill="#2dd4bf" />
                                <path d="M40 60 L80 95 L95 80 L55 45 Z" fill="#0c4a6e" />
                                <path d="M5 70 L85 20 L95 35 L15 85 Z" fill="#86efac" />
                            </svg>
                            <span className="text-2xl font-bold tracking-tight text-gray-900">Isotek</span>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#inicio" className="text-sm font-medium text-gray-600 hover:text-isotek-600 transition-colors">Início</a>
                            <a href="#sobre" className="text-sm font-medium text-gray-600 hover:text-isotek-600 transition-colors">Sobre</a>
                            <a href="#funcionalidades" className="text-sm font-medium text-gray-600 hover:text-isotek-600 transition-colors">Funcionalidades</a>
                            <a href="#contato" className="text-sm font-medium text-gray-600 hover:text-isotek-600 transition-colors">Contato</a>
                            <button
                                onClick={handleLoginClick}
                                className="px-5 py-2.5 bg-isotek-600 text-white text-sm font-semibold rounded-lg hover:bg-isotek-700 transition-all shadow-sm hover:shadow-md"
                            >
                                Acessar Sistema
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-gray-600"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 animate-fade-in">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#inicio" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Início</a>
                            <a href="#sobre" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Sobre</a>
                            <a href="#funcionalidades" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Funcionalidades</a>
                            <a href="#contato" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">Contato</a>
                            <button
                                onClick={handleLoginClick}
                                className="w-full mt-4 px-5 py-3 bg-isotek-600 text-white text-base font-semibold rounded-lg hover:bg-isotek-700"
                            >
                                Acessar Sistema
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO SECTION */}
            <section id="inicio" className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-isotek-50 text-isotek-700 text-xs font-semibold uppercase tracking-wide mb-6">
                            <span className="w-2 h-2 rounded-full bg-isotek-500 animate-pulse"></span>
                            Plataforma de Gestão da Qualidade
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                            Excelência e Inovação em <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-isotek-600 to-cyan-500">Gestão da Qualidade ISO 9001</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Capacitando empresas a alcançarem o máximo potencial operacional com processos eficientes, confiáveis e 100% digitais.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button className="w-full sm:w-auto px-8 py-4 bg-isotek-600 text-white text-base font-bold rounded-xl hover:bg-isotek-700 transition-all shadow-lg hover:shadow-isotek-500/25 flex items-center justify-center gap-2">
                                Solicitar Demonstração
                                <ArrowRight size={20} />
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 text-base font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                Conheça os Planos
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* QUEM SOMOS */}
            <section id="sobre" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Nossa Identidade</h2>
                        <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
                            Comprometidos com a transformação da qualidade no Maranhão e no Brasil.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Target className="text-blue-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Missão</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Capacitar empresas maranhenses com uma plataforma inovadora, simplificando a gestão da qualidade e impulsionando sua competitividade no mercado.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Lightbulb className="text-purple-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Visão</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Ser referência como a plataforma líder e inovadora em gestão da qualidade, reconhecida pela excelência e impacto positivo nos negócios.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <TrendingUp className="text-emerald-600" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Propósito</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Fomentar uma cultura de aprendizado e adaptação contínua, onde a qualidade é o motor do crescimento sustentável.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* VALORES */}
            <section className="py-20 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white">Nossos Valores</h2>
                        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
                            Os pilares que sustentam cada linha de código e cada decisão estratégica.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Award className="text-isotek-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Excelência</h3>
                            <p className="text-gray-400 text-sm">Soluções de alta qualidade que superem expectativas.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Zap className="text-isotek-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Inovação</h3>
                            <p className="text-gray-400 text-sm">Novas tecnologias e abordagens para aprimorar produtos.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="text-isotek-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Integridade</h3>
                            <p className="text-gray-400 text-sm">Ética, transparência e responsabilidade em tudo.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Users className="text-isotek-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Foco no Cliente</h3>
                            <p className="text-gray-400 text-sm">O cliente no centro de nossas decisões.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* DIFERENCIAIS */}
            <section id="funcionalidades" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Por que escolher a Isotek?
                            </h2>
                            <p className="text-lg text-gray-600 mb-8">
                                Transformamos os desafios da gestão da qualidade em vantagens competitivas para o seu negócio.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Automatização de Tarefas</h4>
                                        <p className="text-gray-600">Diga adeus às planilhas manuais e erros humanos.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <CheckCircle className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Conformidade ISO 9001</h4>
                                        <p className="text-gray-600">Sistema desenhado nativamente para atender a norma.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <CheckCircle className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Preço Competitivo</h4>
                                        <p className="text-gray-600">Tecnologia de ponta acessível para sua empresa.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <CheckCircle className="text-orange-600" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Suporte Local</h4>
                                        <p className="text-gray-600">Atendimento próximo e personalizado.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                            {/* Abstract UI Representation */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-8 w-8 bg-isotek-100 rounded-full"></div>
                                </div>
                                <div className="flex gap-4 mb-8">
                                    <div className="flex-1 h-24 bg-isotek-50 rounded-lg border border-isotek-100 p-4">
                                        <div className="h-8 w-8 bg-isotek-200 rounded mb-2"></div>
                                        <div className="h-3 w-16 bg-isotek-200 rounded"></div>
                                    </div>
                                    <div className="flex-1 h-24 bg-gray-50 rounded-lg border border-gray-100 p-4">
                                        <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-12 w-full bg-gray-50 rounded border border-gray-100"></div>
                                    <div className="h-12 w-full bg-gray-50 rounded border border-gray-100"></div>
                                    <div className="h-12 w-full bg-gray-50 rounded border border-gray-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="py-20 bg-isotek-600">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Pronto para elevar o nível da sua gestão?
                    </h2>
                    <p className="text-isotek-100 text-lg mb-10 max-w-2xl mx-auto">
                        Junte-se às empresas que já estão transformando seus resultados com a Isotek.
                    </p>
                    <button className="px-8 py-4 bg-white text-isotek-700 text-base font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg">
                        Fale com um Consultor
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">Isotek</span>
                    </div>
                    <div className="flex gap-8 text-sm">
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        <a href="#" className="hover:text-white transition-colors">Instagram</a>
                        <a href="#" className="hover:text-white transition-colors">Contato</a>
                    </div>
                    <div className="text-sm">
                        &copy; 2024 Isotek. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
