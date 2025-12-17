import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Calendar,
    ArrowRight,
    LayoutDashboard,
    Clock,
    CalendarCheck,
    PlayCircle,
    CheckCircle2,
    LogOut,
    User
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useAuditor } from '../../../contexts/AuditorContext';

interface Assignment {
    id: string;
    company_id: string;
    start_date: string;
    end_date: string | null;
    status: string;
    company: {
        id: string;
        name: string;
        cnpj: string;
        logo_url?: string;
    };
}

interface KPIStats {
    agendadas: number;
    emAndamento: number;
    concluidas: number;
}

export const AuditorPortal: React.FC = () => {
    const { user } = useAuthContext();
    const { enterAuditorMode } = useAuditor();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [stats, setStats] = useState<KPIStats>({ agendadas: 0, emAndamento: 0, concluidas: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAssignments();
        }
    }, [user]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);

            const { data: allData, error: allError } = await supabase
                .from('audit_assignments')
                .select(`
                    *,
                    company:company_info (
                        id,
                        name,
                        cnpj,
                        logo_url
                    )
                `)
                .eq('auditor_id', user?.id)
                .order('start_date', { ascending: true });

            if (allError) throw allError;

            const agendadas = allData?.filter(a => a.status === 'agendada').length || 0;
            const emAndamento = allData?.filter(a => a.status === 'em_andamento').length || 0;
            const concluidas = allData?.filter(a => a.status === 'concluida').length || 0;
            setStats({ agendadas, emAndamento, concluidas });

            const activeAssignments = allData?.filter(a => ['agendada', 'em_andamento'].includes(a.status)) || [];
            setAssignments(activeAssignments);
        } catch (error: any) {
            console.error('Erro ao buscar auditorias:', error);
            toast.error('Erro ao carregar suas auditorias');
        } finally {
            setLoading(false);
        }
    };

    const handleEnterEnvironment = (assignment: Assignment) => {
        enterAuditorMode({
            id: assignment.company.id,
            name: assignment.company.name
        });
        navigate('/app/dashboard');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const getProgressPercent = (status: string) => {
        switch (status) {
            case 'agendada': return 10;
            case 'em_andamento': return 50;
            case 'concluida': return 100;
            default: return 0;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#025159] rounded-lg">
                                <LayoutDashboard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Portal do Auditor</h1>
                                <p className="text-xs text-gray-500">Isotek SGQ</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User size={16} />
                                <span>{user?.email}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Olá, Auditor! 👋
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Acompanhe suas auditorias e acesse os ambientes das empresas clientes.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <CalendarCheck className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.agendadas}</p>
                                <p className="text-sm text-gray-500">Agendadas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <PlayCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.emAndamento}</p>
                                <p className="text-sm text-gray-500">Em Andamento</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.concluidas}</p>
                                <p className="text-sm text-gray-500">Concluídas</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Meus Projetos de Auditoria</h3>

                {/* Assignments Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : assignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {assignment.company.logo_url ? (
                                                <img
                                                    src={assignment.company.logo_url}
                                                    alt={assignment.company.name}
                                                    className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-blue-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-gray-900">{assignment.company.name}</h4>
                                                <p className="text-xs text-gray-500">CNPJ: {assignment.company.cnpj || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignment.status === 'em_andamento'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {assignment.status === 'em_andamento' ? 'Em Andamento' : 'Agendada'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Início: {new Date(assignment.start_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        {assignment.end_date && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>Fim: {new Date(assignment.end_date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                            <span>Progresso</span>
                                            <span>{getProgressPercent(assignment.status)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${assignment.status === 'em_andamento'
                                                    ? 'bg-blue-500'
                                                    : 'bg-yellow-500'
                                                    }`}
                                                style={{ width: `${getProgressPercent(assignment.status)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 pb-6">
                                    <button
                                        onClick={() => handleEnterEnvironment(assignment)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#025159] text-white rounded-lg hover:bg-[#013d42] transition-colors font-medium group"
                                    >
                                        Acessar Ambiente de Auditoria
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma auditoria designada</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Você ainda não possui auditorias agendadas ou em andamento vinculadas ao seu perfil.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};
