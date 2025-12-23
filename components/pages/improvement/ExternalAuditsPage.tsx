import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Filter,
    Search,
    ChevronRight,
    AlertCircle,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { AuditorPublicProfile } from '../../auditor/AuditorPublicProfile';

interface AuditAssignment {
    id: string;
    auditor_id: string;
    company_id: string;
    status: string;
    start_date: string;
    end_date: string;
    notes: string;
    auditor?: {
        full_name: string;
        email?: string;
        avatar_url: string;
    };
    created_at: string;
    findings_count?: {
        total: number;
        open: number;
        closed: number;
    }
}

export const ExternalAuditsPage: React.FC = () => {
    const { effectiveCompanyId } = useAuthContext();
    const navigate = useNavigate();
    const [audits, setAudits] = useState<AuditAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'scheduled'>('all');

    useEffect(() => {
        if (effectiveCompanyId) {
            fetchAudits();
        } else {
            setLoading(false);
        }
    }, [effectiveCompanyId]);

    const fetchAudits = async () => {
        try {
            setLoading(true);

            // 1. Buscar auditorias
            const { data: auditsData, error: auditsError } = await supabase
                .from('audit_assignments')
                .select('id, auditor_id, company_id, status, start_date, end_date, notes, created_at')
                .eq('company_id', effectiveCompanyId)
                .order('start_date', { ascending: false });

            if (auditsError) throw auditsError;

            // 2. Buscar perfis dos auditores
            const auditorIds = Array.from(new Set(auditsData.map(a => a.auditor_id).filter(Boolean)));
            let auditorsMap: Record<string, any> = {};

            if (auditorIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', auditorIds);

                if (profilesData) {
                    profilesData.forEach(p => {
                        auditorsMap[p.id] = p;
                    });
                }
            }

            // 3. Buscar contagem de constatações e montar objeto final
            const auditsWithCounts = await Promise.all((auditsData || []).map(async (audit) => {
                const { count: totalFindings } = await supabase
                    .from('audit_findings')
                    .select('id', { count: 'exact', head: true })
                    .eq('audit_assignment_id', audit.id);

                const { count: openFindings } = await supabase
                    .from('audit_findings')
                    .select('id', { count: 'exact', head: true })
                    .eq('audit_assignment_id', audit.id)
                    .neq('status', 'closed');

                return {
                    ...audit,
                    auditor: auditorsMap[audit.auditor_id],
                    findings_count: {
                        total: totalFindings || 0,
                        open: openFindings || 0,
                        closed: (totalFindings || 0) - (openFindings || 0)
                    }
                };
            }));

            setAudits(auditsWithCounts);
        } catch (error: any) {
            console.error('Erro ao buscar auditorias:', error);
            toast.error('Erro ao carregar auditorias externas');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
            case 'concluida':
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Concluída</span>;
            case 'active':
            case 'em_andamento':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> Em Andamento</span>;
            case 'scheduled':
            case 'agendada':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1"><Calendar size={12} /> Agendada</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="text-[#025159]" />
                    Auditorias Externas
                </h1>
                <p className="text-gray-500 mt-1">
                    Gerencie as auditorias realizadas por auditores externos e acompanhe os planos de ação.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por auditor ou notas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#025159] focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Filtros de status poderiam vir aqui */}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-[#025159]" size={32} />
                </div>
            ) : audits.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <ShieldCheck className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma auditoria encontrada</h3>
                    <p className="text-gray-500 mt-1">Sua empresa ainda não passou por auditorias externas registradas no sistema.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {audits.map((audit) => (
                        <div
                            key={audit.id}
                            onClick={() => navigate(`/app/auditorias-externas/${audit.id}`)}
                            className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getStatusBadge(audit.status)}
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatDate(audit.start_date)} - {formatDate(audit.end_date)}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#025159] transition-colors">
                                        Auditoria Externa - {new Date(audit.start_date).getFullYear()}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {audit.auditor?.avatar_url ? (
                                                <img src={audit.auditor.avatar_url} alt={audit.auditor.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-500">
                                                    {audit.auditor?.full_name?.charAt(0) || 'A'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            Auditor:{' '}
                                            <span onClick={(e) => e.stopPropagation()}>
                                                <AuditorPublicProfile
                                                    auditorId={audit.auditor_id}
                                                    auditorName={audit.auditor?.full_name || 'Desconhecido'}
                                                />
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{audit.findings_count?.total || 0}</div>
                                        <div className="text-xs text-gray-500 font-medium uppercase">Constatações</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${(audit.findings_count?.open || 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {audit.findings_count?.open || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium uppercase">Pendentes</div>
                                    </div>
                                    <div className="text-gray-300">
                                        <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform text-[#025159]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
