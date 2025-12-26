import React, { useState, useEffect } from 'react';
import {
    Bell,
    AlertTriangle,
    Clock,
    FileText,
    CheckCircle,
    X,
    ChevronRight,
    Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAuditor } from '../../contexts/AuditorContext';
import { Notification, NotificationType } from '../../types';

interface Alert {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    link: string;
    date: string;
    category: 'nc' | 'audit' | 'document' | 'general';
}

export const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const navigate = useNavigate();
    const { company } = useAuthContext();
    const { effectiveCompanyId } = useAuditor();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [systemAlerts, setSystemAlerts] = useState<Alert[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'notifications'>('all');

    useEffect(() => {
        if (effectiveCompanyId) {
            fetchAll();
        }
    }, [effectiveCompanyId]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchNotifications(),
                fetchSystemAlerts()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        if (!effectiveCompanyId) return;
        const { data } = await supabase
            .from('notifications')
            .select('id, title, message, type, link, created_at, read, company_id')
            .eq('company_id', effectiveCompanyId)
            .order('created_at', { ascending: false })
            .limit(10);
        setNotifications(data || []);
    };

    const fetchSystemAlerts = async () => {
        if (!effectiveCompanyId) return;
        const alerts: Alert[] = [];
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

        // 1. NCs Atrasadas
        const { data: ncs } = await supabase
            .from('corrective_actions')
            .select('id, code, deadline, description')
            .eq('company_id', effectiveCompanyId)
            .neq('status', 'closed')
            .lt('deadline', today);

        (ncs || []).forEach(nc => {
            alerts.push({
                id: `nc-${nc.id}`,
                title: `NC Atrasada: ${nc.code}`,
                message: nc.description.substring(0, 50) + '...',
                type: 'error',
                link: '/app/nao-conformidades',
                date: nc.deadline,
                category: 'nc'
            });
        });

        // 2. Auditorias Próximas (próximos 7 dias)
        const { data: audits } = await supabase
            .from('audits')
            .select('id, type, date')
            .eq('company_id', effectiveCompanyId)
            .eq('status', 'Agendada')
            .gte('date', today)
            .lte('date', sevenDaysStr);

        (audits || []).forEach(audit => {
            alerts.push({
                id: `audit-${audit.id}`,
                title: `Auditoria Próxima`,
                message: `${audit.type} agendada para ${new Date(audit.date).toLocaleDateString('pt-BR')}`,
                type: 'warning',
                link: '/app/auditoria-interna',
                date: audit.date,
                category: 'audit'
            });
        });

        // 2b. Auditorias Externas Próximas (próximos 7 dias)
        const { data: extAudits } = await supabase
            .from('audit_assignments')
            .select('id, start_date, status')
            .eq('company_id', effectiveCompanyId)
            .in('status', ['agendada', 'active', 'pending', 'em_andamento'])
            .lte('start_date', sevenDaysStr);

        (extAudits || []).forEach(audit => {
            const isLate = new Date(audit.start_date) < new Date(today) && (audit.status === 'agendada' || audit.status === 'pending');
            alerts.push({
                id: `ext-audit-${audit.id}`,
                title: isLate ? `Auditoria Externa Atrasada` : `Auditoria Externa Próxima`,
                message: `Auditoria com consultor externo ${isLate ? 'deveria ter iniciado' : 'inicia'} em ${new Date(audit.start_date).toLocaleDateString('pt-BR')}`,
                type: isLate ? 'error' : 'warning',
                link: `/app/auditorias-externas`,
                date: audit.start_date,
                category: 'audit'
            });
        });

        // 2c. Constatações de Auditoria Externa (NCs abertas)
        const { data: activeAssignments } = await supabase
            .from('audit_assignments')
            .select('id')
            .eq('company_id', effectiveCompanyId);

        if (activeAssignments && activeAssignments.length > 0) {
            const assignmentIds = activeAssignments.map(a => a.id);
            const { data: extFindings } = await supabase
                .from('audit_findings')
                .select('id, severity, iso_clause, audit_assignment_id')
                .in('audit_assignment_id', assignmentIds)
                .eq('status', 'open')
                .in('severity', ['nao_conformidade_menor', 'nao_conformidade_maior']);

            (extFindings || []).forEach(f => {
                alerts.push({
                    id: `finding-${f.id}`,
                    title: `Constatação de Auditoria: ${f.severity === 'nao_conformidade_maior' ? 'NC Maior' : 'NC Menor'}`,
                    message: `Item pendente na cláusula ${f.iso_clause || 'Geral'} da auditoria externa.`,
                    type: 'error',
                    link: `/app/auditorias-externas/${f.audit_assignment_id}`,
                    date: new Date().toISOString(), // Findings usually don't have a specific deadline in the table, using current date
                    category: 'nc'
                });
            });
        }

        // 3. Treinamentos Vencendo (próximos 30 dias)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

        // Get trainings for employees of the current company
        const { data: employees } = await supabase
            .from('employees')
            .select('id, name')
            .eq('company_id', effectiveCompanyId);

        if (employees && employees.length > 0) {
            const employeeIds = employees.map(e => e.id);
            const employeeMap = employees.reduce((acc, e) => ({ ...acc, [e.id]: e.name }), {} as any);

            const { data: trainings } = await supabase
                .from('employee_trainings')
                .select('id, training_name, expiration_date, employee_id')
                .in('employee_id', employeeIds)
                .or(`expiration_date.lte.${thirtyDaysStr},expiration_date.lt.${today}`);

            (trainings || []).forEach(t => {
                const isExpired = t.expiration_date && t.expiration_date < today;
                alerts.push({
                    id: `training-${t.id}`,
                    title: isExpired ? `Treinamento Vencido` : `Treinamento a Vencer`,
                    message: `${t.training_name} de ${employeeMap[t.employee_id]} ${isExpired ? 'venceu' : 'vence'} em ${new Date(t.expiration_date!).toLocaleDateString('pt-BR')}`,
                    type: isExpired ? 'error' : 'warning',
                    link: '/app/competencias',
                    date: t.expiration_date!,
                    category: 'document'
                });
            });
        }

        // 4. Documentos GED (vencendo em 30 dias)
        const { data: gedDocs } = await supabase
            .from('documents')
            .select('id, title, code, next_review_date')
            .eq('company_id', effectiveCompanyId)
            .neq('status', 'obsoleto')
            .or(`next_review_date.lte.${thirtyDaysStr},next_review_date.lt.${today}`);

        (gedDocs || []).forEach(doc => {
            const isOverdue = doc.next_review_date && doc.next_review_date < today;
            alerts.push({
                id: `ged-${doc.id}`,
                title: isOverdue ? `Revisão de Documento Atrasada` : `Revisão de Documento Próxima`,
                message: `O documento ${doc.code || doc.title} ${isOverdue ? 'precisava ter sido revisado' : 'precisa ser revisado'} em ${new Date(doc.next_review_date!).toLocaleDateString('pt-BR')}`,
                type: isOverdue ? 'error' : 'warning',
                link: '/app/documentos',
                date: doc.next_review_date!,
                category: 'document'
            });
        });

        setSystemAlerts(alerts);
    };

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const renderIcon = (type: NotificationType | 'nc' | 'audit' | 'document') => {
        switch (type) {
            case 'error': return <AlertTriangle className="text-red-500" size={18} />;
            case 'warning': return <Clock className="text-yellow-500" size={18} />;
            case 'success': return <CheckCircle className="text-green-500" size={18} />;
            default: return <Info className="text-blue-500" size={18} />;
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 0) return `Em ${Math.abs(diffDays)} dias`;
        return `Há ${diffDays} dias`;
    };

    const allItems = [
        ...systemAlerts.map(a => ({ ...a, isAlert: true, read: false })),
        ...notifications.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            link: n.link,
            date: n.created_at,
            isAlert: false,
            read: n.read
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredItems = allItems.filter(item => {
        if (activeTab === 'alerts') return item.isAlert;
        if (activeTab === 'notifications') return !item.isAlert;
        return true;
    });

    return (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell size={18} className="text-[#025159]" />
                        Notificações e Alertas
                    </h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X size={18} className="text-gray-500" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 p-1 bg-white dark:bg-gray-900">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'all' ? 'bg-[#025159] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                    Tudo
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'alerts' ? 'bg-[#025159] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                    Alertas ({systemAlerts.length})
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'notifications' ? 'bg-[#025159] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                    Mensagens
                </button>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#025159] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500">Buscando atualizações...</p>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filteredItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={async () => {
                                    if (!item.isAlert) await markAsRead(item.id);
                                    if (item.link) navigate(item.link);
                                    onClose();
                                }}
                                className={`w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all flex items-start gap-4 ${!item.isAlert && !item.read ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                            >
                                <div className={`p-2 rounded-xl shrink-0 ${item.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                                    item.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                                        'bg-blue-50 dark:bg-blue-900/20'
                                    }`}>
                                    {renderIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-bold truncate ${!item.isAlert && !item.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.title}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                            {formatRelativeTime(item.date)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                        {item.message}
                                    </p>
                                    {item.link && (
                                        <div className="mt-2 flex items-center text-[10px] font-bold text-[#025159] uppercase tracking-wider">
                                            Ver detalhes <ChevronRight size={10} className="ml-1" />
                                        </div>
                                    )}
                                </div>
                                {!item.isAlert && !item.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center px-8">
                        <div className="bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="text-gray-300" size={32} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Tudo em ordem por aqui!</h4>
                        <p className="text-xs text-gray-500">Você não possui notificações pendentes no momento.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-center">
                <button
                    onClick={() => {
                        navigate('/app/configuracoes');
                        onClose();
                    }}
                    className="text-xs font-bold text-[#025159] hover:underline"
                >
                    Gerenciar Notificações
                </button>
            </div>
        </div>
    );
};
