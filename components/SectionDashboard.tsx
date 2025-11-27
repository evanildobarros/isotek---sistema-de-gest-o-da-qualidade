import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Clock, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export const SectionDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    complianceIndex: 0,
    openRNCs: 0,
    criticalRNCs: 0,
    overdueActions: 0,
    nextAuditDate: null as string | null,
    nextAuditType: '',
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [ncDistribution, setNcDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;
      const companyId = profile.company_id;

      // Parallel Fetching
      const [
        auditsRes,
        kpisRes,
        ncProductsRes,
        actionsRes,
        nextAuditRes
      ] = await Promise.all([
        // Audits (Completed)
        supabase.from('audits').select('*').eq('status', 'Concluída'),
        // KPIs
        supabase.from('quality_objectives').select('*').eq('company_id', companyId),
        // NC Products (Open/Analyzing)
        supabase.from('non_conformities_products').select('*').eq('company_id', companyId).in('status', ['open', 'analyzing']),
        // Corrective Actions (All for chart + counts)
        supabase.from('corrective_actions').select('*').eq('company_id', companyId),
        // Next Audit
        supabase.from('audits')
          .select('date, type')
          .eq('status', 'Agendada')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(1)
          .single()
      ]);

      // --- 1. Compliance Index Calculation ---
      // (Audits OK + KPIs OK) / (Total Audits + Total KPIs)
      const audits = auditsRes.data || [];
      const kpis = kpisRes.data || [];

      const auditsOk = audits.filter(a => (a.non_conformities || 0) === 0).length;
      const kpisOk = kpis.filter(k => Number(k.current_value) >= Number(k.target_value)).length;

      const totalItems = audits.length + kpis.length;
      const complianceIndex = totalItems > 0
        ? Math.round(((auditsOk + kpisOk) / totalItems) * 100)
        : 100; // Default to 100 if no data

      // --- 2. Non-Conformities (RNCs) ---
      const ncProducts = ncProductsRes.data || [];
      const actions = actionsRes.data || [];

      const openActions = actions.filter(a => a.status !== 'closed');
      const totalOpenRNCs = ncProducts.length + openActions.length;

      // Count "Critical" items (just an example logic: severity 'Crítica' in products)
      // Note: We need to fetch severity for products. We already have * from select.
      const criticalProductRNCs = ncProducts.filter(nc => nc.severity === 'Crítica').length;

      // --- 3. Overdue Actions ---
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueActionsCount = actions.filter(a => {
        if (a.status === 'closed') return false;
        const deadline = new Date(a.deadline);
        return deadline < today;
      }).length;

      // --- 4. Next Audit ---
      const nextAuditDate = nextAuditRes.data ? nextAuditRes.data.date : null;
      const nextAuditType = nextAuditRes.data ? nextAuditRes.data.type : '';

      // --- 5. Evolution Chart (Last 6 Months) ---
      // Group actions by month (Created vs Closed)
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('pt-BR', { month: 'short' });
        const monthKey = d.getMonth(); // 0-11
        const yearKey = d.getFullYear();

        last6Months.push({
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          month: monthKey,
          year: yearKey,
          created: 0,
          completed: 0
        });
      }

      actions.forEach(action => {
        const createdDate = new Date(action.created_at);
        const createdMonth = createdDate.getMonth();
        const createdYear = createdDate.getFullYear();

        // Count Created
        const monthData = last6Months.find(m => m.month === createdMonth && m.year === createdYear);
        if (monthData) {
          monthData.created++;
        }

        // Count Completed (if closed)
        if (action.status === 'closed') {
          const updatedDate = new Date(action.updated_at);
          const updatedMonth = updatedDate.getMonth();
          const updatedYear = updatedDate.getFullYear();

          const completedMonthData = last6Months.find(m => m.month === updatedMonth && m.year === updatedYear);
          if (completedMonthData) {
            completedMonthData.completed++;
          }
        }
      });

      // --- 6. NC Distribution (Pie Chart) ---
      // Simple breakdown of current open items
      const distribution = [
        { name: 'Produtos', value: ncProducts.length },
        { name: 'Processos', value: openActions.length }, // Assuming actions are mostly process-related
      ];

      setMetrics({
        complianceIndex,
        openRNCs: totalOpenRNCs,
        criticalRNCs: criticalProductRNCs,
        overdueActions: overdueActionsCount,
        nextAuditDate,
        nextAuditType
      });
      setChartData(last6Months);
      setNcDistribution(distribution);

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="w-7 h-7 text-[#025159]" />
            <h1 className="text-2xl font-bold text-[#025159]">Visão Geral da Qualidade</h1>
          </div>
          <p className="text-gray-500 text-sm">Monitoramento em tempo real dos indicadores de desempenho.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard
          title="Índice de Conformidade"
          value={`${metrics.complianceIndex}%`}
          trend={metrics.complianceIndex >= 90 ? "Excelente" : "Atenção"}
          trendUp={metrics.complianceIndex >= 90}
          icon={<CheckCircle2 className="text-emerald-500" />}
          subtext="Baseado em KPIs e Auditorias"
        />
        <KpiCard
          title="Pendências (RNCs)"
          value={metrics.openRNCs.toString()}
          subtext={`${metrics.criticalRNCs} Críticas`}
          trend={metrics.openRNCs === 0 ? "Zerado" : `${metrics.openRNCs} Ativas`}
          trendUp={metrics.openRNCs === 0} // Green if 0
          icon={<AlertCircle className="text-amber-500" />}
        />
        <KpiCard
          title="Ações Atrasadas"
          value={metrics.overdueActions.toString()}
          subtext="Requer atenção imediata"
          trend={metrics.overdueActions === 0 ? "Em dia" : "Atraso"}
          trendUp={metrics.overdueActions === 0}
          icon={<Clock className="text-red-500" />}
        />
        <KpiCard
          title="Próxima Auditoria"
          value={metrics.nextAuditDate ? formatDate(metrics.nextAuditDate) : "N/A"}
          subtext={metrics.nextAuditType || "Nenhuma agendada"}
          trend="Agenda"
          trendUp={true}
          icon={<UsersIcon className="text-purple-500" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução de Ações (6 Meses)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  name="Criadas"
                  type="monotone"
                  dataKey="created"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="Concluídas"
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Pendências</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ncDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ncDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {ncDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Icons
const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

const KpiCard: React.FC<{
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  subtext?: string;
}> = ({ title, value, trend, trendUp, icon, subtext }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};