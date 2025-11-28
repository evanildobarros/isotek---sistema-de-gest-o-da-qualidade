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
import { ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Clock, LayoutDashboard, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const COLORS = ['#ef4444', '#10b981']; // Red for Open, Green for Closed

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
        kpiMeasurementsRes,
        ncProductsRes,
        actionsRes,
        nextAuditRes
      ] = await Promise.all([
        // Audits (Completed)
        supabase.from('audits').select('*').eq('status', 'Concluída'),
        // KPIs Objectives
        supabase.from('quality_objectives').select('*').eq('company_id', companyId),
        // KPI Measurements (Last 6 months)
        supabase.from('kpi_measurements')
          .select('*')
          .eq('company_id', companyId)
          .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString()),
        // NC Products (ALL)
        supabase.from('non_conformities_products').select('*').eq('company_id', companyId),
        // Corrective Actions (ALL)
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

      // --- 1. Compliance Index / Health Calculation ---
      const kpis = kpisRes.data || [];
      const measurements = kpiMeasurementsRes.data || [];

      let kpiHealthSum = 0;
      let kpiCount = 0;

      kpis.forEach(kpi => {
        const kpiMeasurements = measurements
          .filter(m => m.objective_id === kpi.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (kpiMeasurements.length > 0) {
          const latest = kpiMeasurements[0];
          if (kpi.target_value > 0) {
            let achievement = (latest.value / kpi.target_value) * 100;
            if (achievement > 100) achievement = 100;
            kpiHealthSum += achievement;
            kpiCount++;
          }
        }
      });

      const complianceIndex = kpiCount > 0 ? Math.round(kpiHealthSum / kpiCount) : 100;

      // --- 2. Non-Conformities (RNCs) ---
      const ncProducts = ncProductsRes.data || [];
      const actions = actionsRes.data || [];

      const openNcProducts = ncProducts.filter(nc => nc.status !== 'resolved');
      const openActions = actions.filter(a => a.status !== 'closed');

      const totalOpenRNCs = openNcProducts.length + openActions.length;
      const totalClosedRNCs = (ncProducts.length - openNcProducts.length) + (actions.length - openActions.length);

      // Count "Critical" items (severity 'Crítica' in products)
      const criticalProductRNCs = openNcProducts.filter(nc => nc.severity === 'Crítica').length;

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

      // --- 5. Evolution Chart (KPIs Last 6 Months) ---
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
          value: 0,
          count: 0
        });
      }

      measurements.forEach(m => {
        const mDate = new Date(m.date);
        const mMonth = mDate.getMonth();
        const mYear = mDate.getFullYear();

        const monthData = last6Months.find(d => d.month === mMonth && d.year === mYear);
        if (monthData) {
          const kpi = kpis.find(k => k.id === m.objective_id);
          if (kpi && kpi.target_value > 0) {
            let achievement = (m.value / kpi.target_value) * 100;
            if (achievement > 100) achievement = 100;
            monthData.value += achievement;
            monthData.count++;
          }
        }
      });

      const chartDataProcessed = last6Months.map(d => ({
        name: d.name,
        'Média KPI (%)': d.count > 0 ? Math.round(d.value / d.count) : 0
      }));

      // --- 6. NC Distribution (Pie Chart) ---
      const distribution = [
        { name: 'Abertas', value: totalOpenRNCs },
        { name: 'Concluídas', value: totalClosedRNCs },
      ];

      setMetrics({
        complianceIndex,
        openRNCs: totalOpenRNCs,
        criticalRNCs: criticalProductRNCs,
        overdueActions: overdueActionsCount,
        nextAuditDate,
        nextAuditType
      });
      setChartData(chartDataProcessed);
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
          title="Saúde do SGQ"
          value={`${metrics.complianceIndex}%`}
          trend={metrics.complianceIndex >= 80 ? "Bom" : "Atenção"}
          trendUp={metrics.complianceIndex >= 80}
          icon={<CheckCircle2 className="text-emerald-500" />}
          subtext="Média de atingimento de metas"
        />
        <KpiCard
          title="Pendências (RNCs)"
          value={metrics.openRNCs.toString()}
          subtext={`${metrics.criticalRNCs} Críticas`}
          trend={metrics.openRNCs === 0 ? "Zerado" : `${metrics.openRNCs} Ativas`}
          trendUp={metrics.openRNCs === 0}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução de KPIs (6 Meses)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  name="Média KPI (%)"
                  type="monotone"
                  dataKey="Média KPI (%)"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RNCs: Abertas vs Concluídas</h3>
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