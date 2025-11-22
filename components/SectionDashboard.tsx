import React from 'react';
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
import { ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const dataCompliance = [
  { name: 'Jan', value: 92 },
  { name: 'Fev', value: 95 },
  { name: 'Mar', value: 88 },
  { name: 'Abr', value: 94 },
  { name: 'Mai', value: 98 },
  { name: 'Jun', value: 96 },
];

const dataNC = [
  { name: 'Abertas', value: 5 },
  { name: 'Em Análise', value: 3 },
  { name: 'Concluídas', value: 12 },
];

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export const SectionDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Visão Geral da Qualidade</h2>
            <p className="text-sm text-gray-500 mt-1">Monitoramento em tempo real dos indicadores de desempenho.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            Última atualização: Hoje, 09:45
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard 
          title="Índice de Conformidade" 
          value="96.5%" 
          trend="+2.1%" 
          trendUp={true}
          icon={<CheckCircle2 className="text-emerald-500" />}
        />
        <KpiCard 
          title="Não Conformidades" 
          value="8" 
          subtext="3 Críticas"
          trend="-1" 
          trendUp={true} // Less is better, visually green
          icon={<AlertCircle className="text-amber-500" />}
        />
        <KpiCard 
          title="Ações Corretivas" 
          value="12" 
          subtext="4 Atrasadas"
          trend="-2" 
          trendUp={false} 
          icon={<Clock className="text-blue-500" />}
        />
        <KpiCard 
          title="Treinamentos" 
          value="85%" 
          subtext="Cobertura Anual"
          trend="+5%" 
          trendUp={true}
          icon={<UsersIcon className="text-purple-500" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Conformidade (Semestral)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataCompliance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} domain={[0, 100]} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                    type="monotone" 
                    dataKey="value" 
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status de NCs</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataNC}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataNC.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
              {dataNC.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      {entry.name}
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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