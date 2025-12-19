import React, { useEffect, useState } from 'react';
import {
    BarChart3,
    Plus,
    TrendingUp,
    Users,
    Target,
    Calendar,
    MessageSquare,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { QualityObjective, KpiMeasurement, CustomerSurvey } from '../../../types';
import { Modal } from '../../common/Modal';
import { PageHeader } from '../../common/PageHeader';
import { EmptyState } from '../../common/EmptyState';

export const IndicatorsPage: React.FC = () => {
    const { user, company } = useAuthContext();
    const [loading, setLoading] = useState(true);

    // Data states
    const [objectives, setObjectives] = useState<QualityObjective[]>([]);
    const [measurements, setMeasurements] = useState<Record<string, KpiMeasurement[]>>({});
    const [surveys, setSurveys] = useState<CustomerSurvey[]>([]);

    // Modal states
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [selectedObjective, setSelectedObjective] = useState<QualityObjective | null>(null);

    // Forms
    const [measurementForm, setMeasurementForm] = useState({
        objective_id: '',
        date: new Date().toISOString().split('T')[0],
        value: '',
        notes: ''
    });

    const [surveyForm, setSurveyForm] = useState({
        date: new Date().toISOString().split('T')[0],
        client_name: '',
        score: 10,
        feedback: ''
    });

    useEffect(() => {
        if (company) {
            fetchData();
        }
    }, [company]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchObjectives(),
                fetchSurveys()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchObjectives = async () => {
        if (!company) return;

        // Fetch objectives
        const { data: objs, error: objError } = await supabase
            .from('quality_objectives')
            .select('*')
            .eq('company_id', company.id);

        if (objError) throw objError;
        setObjectives(objs || []);

        // Fetch measurements for all objectives
        if (objs && objs.length > 0) {
            const { data: meas, error: measError } = await supabase
                .from('kpi_measurements')
                .select('*')
                .eq('company_id', company.id)
                .order('date', { ascending: true });

            if (measError) throw measError;

            // Group by objective_id
            const grouped: Record<string, KpiMeasurement[]> = {};
            meas?.forEach(m => {
                if (!grouped[m.objective_id]) grouped[m.objective_id] = [];
                grouped[m.objective_id].push(m);
            });
            setMeasurements(grouped);
        }
    };

    const fetchSurveys = async () => {
        if (!company) return;

        const { data, error } = await supabase
            .from('customer_satisfaction_surveys')
            .select('*')
            .eq('company_id', company.id)
            .order('date', { ascending: false });

        if (error) throw error;
        setSurveys(data || []);
    };

    const handleSaveMeasurement = async () => {
        try {
            if (!company) return;

            const { error } = await supabase
                .from('kpi_measurements')
                .insert([{
                    company_id: company.id,
                    objective_id: measurementForm.objective_id,
                    date: measurementForm.date,
                    value: Number(measurementForm.value),
                    notes: measurementForm.notes
                }]);

            if (error) throw error;

            await fetchObjectives();
            setIsMeasurementModalOpen(false);
            setMeasurementForm({
                objective_id: '',
                date: new Date().toISOString().split('T')[0],
                value: '',
                notes: ''
            });
        } catch (error) {
            console.error('Erro ao salvar medição:', error);
            toast.error('Erro ao salvar medição');
        }
    };

    const handleSaveSurvey = async () => {
        try {
            if (!company) return;

            const { error } = await supabase
                .from('customer_satisfaction_surveys')
                .insert([{
                    company_id: company.id,
                    ...surveyForm
                }]);

            if (error) throw error;

            await fetchSurveys();
            setIsSurveyModalOpen(false);
            setSurveyForm({
                date: new Date().toISOString().split('T')[0],
                client_name: '',
                score: 10,
                feedback: ''
            });
        } catch (error) {
            console.error('Erro ao salvar pesquisa:', error);
            toast.error('Erro ao salvar pesquisa');
        }
    };

    const openMeasurementModal = (obj?: QualityObjective) => {
        if (obj) {
            setSelectedObjective(obj);
            setMeasurementForm(prev => ({ ...prev, objective_id: obj.id }));
        } else {
            setSelectedObjective(null);
            setMeasurementForm(prev => ({ ...prev, objective_id: objectives[0]?.id || '' }));
        }
        setIsMeasurementModalOpen(true);
    };

    // Calculations
    const averageSatisfaction = surveys.length > 0
        ? (surveys.reduce((acc, curr) => acc + curr.score, 0) / surveys.length).toFixed(1)
        : '0.0';

    const promoters = surveys.filter(s => s.score >= 9).length;
    const detractors = surveys.filter(s => s.score <= 6).length;
    const nps = surveys.length > 0
        ? Math.round(((promoters - detractors) / surveys.length) * 100)
        : 0;

    const pieData = [
        { name: 'Promotores (9-10)', value: promoters, color: '#22c55e' },
        { name: 'Neutros (7-8)', value: surveys.length - promoters - detractors, color: '#eab308' },
        { name: 'Detratores (0-6)', value: detractors, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
                icon={BarChart3}
                title="Indicadores de Desempenho"
                subtitle="ISO 9001: 9.1 - Monitoramento, medição, análise e avaliação"
                iconColor="yellow"
            />

            {/* Section A: Customer Satisfaction */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Satisfação do Cliente (9.1.2)
                    </h2>
                    <button
                        onClick={() => setIsSurveyModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Registrar Pesquisa
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* KPI Cards */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between col-span-1 md:col-span-2">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Média de Satisfação Geral</p>
                            <div className="flex items-end gap-2 mt-2">
                                <span className="text-4xl font-bold text-gray-900">{averageSatisfaction}</span>
                                <span className="text-sm text-gray-400 mb-1">/ 10</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Baseado em {surveys.length} pesquisas</p>
                        </div>
                        <div className="w-1/2 h-32">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={50}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-400 text-sm text-center">Sem dados de pesquisa</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section B: Process Indicators */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        Indicadores de Processo (9.1.1)
                    </h2>
                    <button
                        onClick={() => openMeasurementModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Lançar Medição
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Carregando indicadores...</div>
                ) : objectives.length === 0 ? (
                    <EmptyState
                        icon={Target}
                        title="Nenhum objetivo definido"
                        description="Cadastre objetivos da qualidade no módulo de Planejamento para monitorar indicadores."
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {objectives.map(obj => {
                            const objMeasurements = measurements[obj.id] || [];
                            const data = objMeasurements.map(m => ({
                                date: new Date(m.date).toLocaleDateString('pt-BR', { month: 'short' }),
                                value: m.value,
                                meta: obj.target_value
                            }));

                            return (
                                <div key={obj.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{obj.name}</h3>
                                            <p className="text-sm text-gray-500">Meta: {obj.target_value} {obj.unit} | Freq: {obj.frequency}</p>
                                        </div>
                                        <button
                                            onClick={() => openMeasurementModal(obj)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Lançar Medição"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="h-64 w-full">
                                        {data.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        cursor={{ stroke: '#e5e7eb' }}
                                                    />
                                                    <ReferenceLine y={obj.target_value} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Meta', position: 'right', fill: '#ef4444', fontSize: 10 }} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#2563eb"
                                                        strokeWidth={2}
                                                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                                        activeDot={{ r: 6 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
                                                <p className="text-sm">Sem dados de medição</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Lançar Medição */}
            <Modal
                isOpen={isMeasurementModalOpen}
                onClose={() => setIsMeasurementModalOpen(false)}
                title="Lançar Medição de KPI"
                size="md"
            >
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo / Indicador</label>
                        <select
                            value={measurementForm.objective_id}
                            onChange={e => setMeasurementForm({ ...measurementForm, objective_id: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                            disabled={!!selectedObjective}
                        >
                            <option value="">Selecione...</option>
                            {objectives.map(obj => (
                                <option key={obj.id} value={obj.id}>{obj.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data da Medição</label>
                            <input
                                type="date"
                                value={measurementForm.date}
                                onChange={e => setMeasurementForm({ ...measurementForm, date: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valor Realizado</label>
                            <input
                                type="number"
                                step="0.01"
                                value={measurementForm.value}
                                onChange={e => setMeasurementForm({ ...measurementForm, value: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Análise Crítica
                            <span className="text-gray-400 font-normal ml-1">(Obrigatório se meta não atingida)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={measurementForm.notes}
                            onChange={e => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Justificativa, análise de tendência ou ações tomadas..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsMeasurementModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveMeasurement}
                            className="px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                        >
                            Salvar Medição
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Pesquisa de Satisfação */}
            <Modal
                isOpen={isSurveyModalOpen}
                onClose={() => setIsSurveyModalOpen(false)}
                title="Registrar Pesquisa de Satisfação"
                size="md"
            >
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                            <input
                                type="date"
                                value={surveyForm.date}
                                onChange={e => setSurveyForm({ ...surveyForm, date: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nota (0-10)</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={surveyForm.score}
                                onChange={e => setSurveyForm({ ...surveyForm, score: Number(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                        <input
                            type="text"
                            value={surveyForm.client_name}
                            onChange={e => setSurveyForm({ ...surveyForm, client_name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="Nome do cliente ou empresa"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback / Comentários</label>
                        <textarea
                            rows={3}
                            value={surveyForm.feedback}
                            onChange={e => setSurveyForm({ ...surveyForm, feedback: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                            placeholder="Comentários do cliente..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsSurveyModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveSurvey}
                            className="px-4 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                        >
                            Salvar Pesquisa
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
