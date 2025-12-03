import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '../../lib/supabase';

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const COLORS = {
  primary: '#025159',
  secondary: '#3F858C',
  accent: '#A67458',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#64748b',
  background: '#F0F9FA'
};

export const SectionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    npsScore: 0,
    npsTrend: 'stable', // up, down, stable
    totalNc: 0,
    ncTrendData: [] as any[],
    auditsCompleted: 0,
    auditsPending: 0,
    actionsOpen: 0,
    actionsClosed: 0,
    ncByMonth: [] as any[],
    ncByDept: [] as any[],
    pendingTasks: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;
      const companyId = profile.company_id;

      // Parallel Fetching
      const [
        metricsRes,
        surveysRes,
        ncProductsRes,
        actionsRes,
        nextAuditsRes,
        riskTasksRes
      ] = await Promise.all([
        supabase.rpc('get_dashboard_metrics', { p_company_id: companyId }),
        supabase.from('customer_satisfaction_surveys').select('*').eq('company_id', companyId),
        supabase.from('non_conformities_products').select('created_at, origin').eq('company_id', companyId),
        supabase.from('corrective_actions').select('id, code, status, deadline').eq('company_id', companyId),
        supabase.from('audits')
          .select('*')
          .eq('company_id', companyId)
          .eq('status', 'Agendada')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(5),
        supabase.from('risk_tasks_with_responsible')
          .select('id, description, deadline, responsible_name, status')
          .eq('status', 'pending')
          .order('deadline', { ascending: true, nullsFirst: false })
          .limit(10)
      ]);

      const metricsData = metricsRes.data?.[0] || {
        total_ncs: 0,
        audits_completed: 0,
        audits_pending: 0,
        actions_open: 0,
        actions_closed: 0
      };

      // 1. NPS Calculation
      const surveys = surveysRes.data || [];
      let npsScore = 0;
      if (surveys.length > 0) {
        // Simple average for demo, ideally NPS formula: %Promoters - %Detractors
        const promoters = surveys.filter(s => s.score >= 9).length;
        const detractors = surveys.filter(s => s.score <= 6).length;
        const total = surveys.length;
        npsScore = Math.round(((promoters - detractors) / total) * 100);
      }

      // 2. NC Data
      const ncProducts = ncProductsRes.data || [];
      const totalNc = metricsData.total_ncs;

      // Sparkline data (last 7 NCs simply for visual trend)
      const ncTrendData = ncProducts
        .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
        .slice(-10)
        .map((nc, index) => ({ index, value: 1 })); // Simplified for sparkline presence

      // 3. Audits
      const auditsCompleted = metricsData.audits_completed;
      const auditsPending = metricsData.audits_pending;

      // 4. Actions (SAC)
      const actions = actionsRes.data || [];
      const actionsOpen = metricsData.actions_open;
      const actionsClosed = metricsData.actions_closed;

      // 5. NC Trend (Last 6 Months)
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('pt-BR', { month: 'short' });
        const monthKey = d.getMonth();
        const yearKey = d.getFullYear();

        const count = ncProducts.filter(nc => {
          const ncDate = new Date(nc.created_at || '');
          return ncDate.getMonth() === monthKey && ncDate.getFullYear() === yearKey;
        }).length;

        last6Months.push({
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          value: count
        });
      }

      // 6. NC by Dept (Origin)
      const originCounts: Record<string, number> = {};
      ncProducts.forEach(nc => {
        const origin = nc.origin || 'Outros';
        originCounts[origin] = (originCounts[origin] || 0) + 1;
      });
      const ncByDept = Object.entries(originCounts).map(([name, value]) => ({ name, value }));

      // 7. Pending Tasks List
      const pendingTasks = [];

      // Overdue Actions
      const today = new Date();
      actions.forEach(a => {
        if (a.status !== 'closed' && new Date(a.deadline) < today) {
          pendingTasks.push({
            id: `action-${a.id}`,
            title: `Ação Atrasada: ${a.code}`,
            type: 'action',
            status: 'critical',
            date: a.deadline
          });
        }
      });

      // Upcoming Audits
      (nextAuditsRes.data || []).forEach(a => {
        pendingTasks.push({
          id: `audit-${a.id}`,
          title: `Auditoria: ${a.type}`,
          type: 'audit',
          status: 'warning',
          date: a.date
        });
      });

      // Risk Tasks
      const riskTasks = riskTasksRes.data || [];
      riskTasks.forEach(task => {
        const isOverdue = task.deadline && new Date(task.deadline) < today;
        pendingTasks.push({
          id: `risk-task-${task.id}`,
          title: `Tarefa: ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}`,
          subtitle: task.responsible_name || 'Sem responsável',
          type: 'risk-task',
          status: isOverdue ? 'critical' : 'normal',
          date: task.deadline || null
        });
      });

      setMetrics({
        npsScore,
        npsTrend: 'up', // Mock trend
        totalNc,
        ncTrendData,
        auditsCompleted,
        auditsPending,
        actionsOpen,
        actionsClosed,
        ncByMonth: last6Months,
        ncByDept,
        pendingTasks: pendingTasks.slice(0, 5) // Limit to 5 items
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#025159] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#025159]">Dashboard</h1>
          <p className="text-gray-500 text-sm">Visão geral dos indicadores de qualidade</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
          <Clock size={14} />
          {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: NPS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-500">Satisfação do Cliente (NPS)</h3>
            <span className="p-1.5 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{metrics.npsScore}</span>
            <span className="text-sm font-medium text-green-600">+2.5%</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Baseado em pesquisas recentes</p>
        </div>

        {/* Card 2: NCs + Sparkline */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-500">Não Conformidades</h3>
            <span className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <AlertCircle size={16} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-gray-900">{metrics.totalNc}</span>
            <div className="w-24 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.ncTrendData}>
                  <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Total acumulado</p>
        </div>

        {/* Card 3: Audits (Donut) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Auditorias</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-bold text-gray-900">{metrics.auditsCompleted}</span>
                <span className="text-gray-400 text-xs">Concluídas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="font-bold text-gray-900">{metrics.auditsPending}</span>
                <span className="text-gray-400 text-xs">Pendentes</span>
              </div>
            </div>
          </div>
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Concluídas', value: metrics.auditsCompleted },
                    { name: 'Pendentes', value: metrics.auditsPending }
                  ]}
                  innerRadius={25}
                  outerRadius={35}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#fbbf24" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Actions (Bar) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Ações (SAC)</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-bold text-gray-900">{metrics.actionsOpen}</span>
                <span className="text-gray-400 text-xs">Abertas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-bold text-gray-900">{metrics.actionsClosed}</span>
                <span className="text-gray-400 text-xs">Fechadas</span>
              </div>
            </div>
          </div>
          <div className="w-24 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Abertas', value: metrics.actionsOpen },
                { name: 'Fechadas', value: metrics.actionsClosed }
              ]}>
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="#ef4444" />
                  <Cell fill="#3b82f6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: MAIN CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: NC Trend */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tendência de NCs</h3>
            <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.ncByMonth}>
                <defs>
                  <linearGradient id="colorNc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorNc)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: NC by Dept */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">NCs por Origem</h3>
            <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.ncByDept} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#025159" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3: PENDING TASKS LIST */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Tarefas Pendentes</h3>
          <button 
            onClick={() => navigate('/app/planos-de-acao')}
            className="text-sm text-[#025159] font-medium hover:underline"
          >
            Ver todas
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {metrics.pendingTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-green-100 mx-auto mb-3" />
              <p>Tudo em dia! Nenhuma tarefa pendente.</p>
            </div>
          ) : (
            metrics.pendingTasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'critical' ? 'bg-red-500' : task.status === 'normal' ? 'bg-blue-400' : 'bg-amber-400'}`}></div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    {task.subtitle && (
                      <p className="text-xs text-gray-400 mt-0.5">{task.subtitle}</p>
                    )}
                    {task.date && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        {formatDate(task.date)}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/app/planos-de-acao')}
                  className="p-2 text-gray-400 hover:text-[#025159] hover:bg-[#F0F9FA] rounded-full transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};