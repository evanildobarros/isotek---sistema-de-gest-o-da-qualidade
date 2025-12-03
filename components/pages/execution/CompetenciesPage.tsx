import React, { useEffect, useState } from 'react';
import {
    Plus,
    GraduationCap,
    Users,
    Edit2,
    Trash2,
    X,
    Upload,
    FileText,
    Calendar,
    Briefcase,
    Building,
    CheckCircle2,
    AlertTriangle,
    Clock,
    ExternalLink,
    Search
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Employee, EmployeeTraining } from '../../../types';

export const CompetenciesPage: React.FC = () => {
    const { user, company } = useAuthContext();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [trainings, setTrainings] = useState<EmployeeTraining[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [uploadingCertificate, setUploadingCertificate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [employeeForm, setEmployeeForm] = useState({
        name: '',
        job_title: '',
        department: '',
        admission_date: '',
        status: 'active' as const
    });

    const [trainingForm, setTrainingForm] = useState({
        training_name: '',
        date_completed: '',
        expiration_date: '',
        notes: '',
        certificate_file: null as File | null
    });

    useEffect(() => {
        fetchEmployees();
    }, [user, company]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchTrainings(selectedEmployee.id);
        }
    }, [selectedEmployee]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            if (!company) return;

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', company.id)
                .order('name');

            if (error) throw error;
            setEmployees(data || []);

            // Auto-select first employee if none selected
            if (data && data.length > 0 && !selectedEmployee) {
                setSelectedEmployee(data[0]);
            }
        } catch (error) {
            console.error('Erro ao carregar colaboradores:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrainings = async (employeeId: string) => {
        try {
            const { data, error } = await supabase
                .from('employee_trainings')
                .select('*')
                .eq('employee_id', employeeId)
                .order('date_completed', { ascending: false });

            if (error) throw error;

            // Calculate status for each training
            const trainingsWithStatus = (data || []).map(t => ({
                ...t,
                status: calculateTrainingStatus(t.expiration_date)
            }));

            setTrainings(trainingsWithStatus);
        } catch (error) {
            console.error('Erro ao carregar treinamentos:', error);
        }
    };

    const calculateTrainingStatus = (expirationDate?: string): EmployeeTraining['status'] => {
        if (!expirationDate) return 'completed';

        const expDate = new Date(expirationDate);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (expDate < today) return 'expired';
        if (expDate <= thirtyDaysFromNow) return 'expiring_soon';
        return 'completed';
    };

    const getEmployeeTrainingStatus = (employeeId: string): 'ok' | 'warning' | 'expired' => {
        const empTrainings = trainings.filter(t => t.employee_id === employeeId);
        if (empTrainings.length === 0) return 'ok';

        const hasExpired = empTrainings.some(t => t.status === 'expired');
        const hasExpiring = empTrainings.some(t => t.status === 'expiring_soon');

        if (hasExpired) return 'expired';
        if (hasExpiring) return 'warning';
        return 'ok';
    };

    const handleOpenEmployeeModal = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            setEmployeeForm({
                name: employee.name,
                job_title: employee.job_title,
                department: employee.department || '',
                admission_date: employee.admission_date,
                status: employee.status
            });
        } else {
            setEditingEmployee(null);
            setEmployeeForm({
                name: '',
                job_title: '',
                department: '',
                admission_date: '',
                status: 'active'
            });
        }
        setIsEmployeeModalOpen(true);
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company) return;

        try {
            const payload = {
                ...employeeForm,
                company_id: company.id
            };

            if (editingEmployee) {
                const { error } = await supabase
                    .from('employees')
                    .update(payload)
                    .eq('id', editingEmployee.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('employees')
                    .insert([payload]);
                if (error) throw error;
            }

            fetchEmployees();
            setIsEmployeeModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar colaborador:', error);
            alert('Erro ao salvar colaborador');
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;

        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);

            if (error) throw error;

            if (selectedEmployee?.id === id) {
                setSelectedEmployee(null);
            }

            fetchEmployees();
        } catch (error) {
            console.error('Erro ao excluir colaborador:', error);
        }
    };

    const handleOpenTrainingModal = () => {
        setTrainingForm({
            training_name: '',
            date_completed: '',
            expiration_date: '',
            notes: '',
            certificate_file: null
        });
        setIsTrainingModalOpen(true);
    };

    const uploadCertificate = async (file: File): Promise<string | null> => {
        try {
            setUploadingCertificate(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${company?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('certificates')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('certificates')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Erro ao fazer upload do certificado:', error);
            alert('Erro ao fazer upload do certificado');
            return null;
        } finally {
            setUploadingCertificate(false);
        }
    };

    const handleSaveTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        try {
            let certificateUrl = null;

            // Upload certificate if provided
            if (trainingForm.certificate_file) {
                certificateUrl = await uploadCertificate(trainingForm.certificate_file);
                if (!certificateUrl) return; // Upload failed
            }

            const payload = {
                employee_id: selectedEmployee.id,
                training_name: trainingForm.training_name,
                date_completed: trainingForm.date_completed,
                expiration_date: trainingForm.expiration_date || null,
                notes: trainingForm.notes || null,
                certificate_url: certificateUrl
            };

            const { error } = await supabase
                .from('employee_trainings')
                .insert([payload]);

            if (error) throw error;

            fetchTrainings(selectedEmployee.id);
            setIsTrainingModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar treinamento:', error);
            alert('Erro ao salvar treinamento');
        }
    };

    const handleDeleteTraining = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este treinamento?')) return;

        try {
            const { error } = await supabase
                .from('employee_trainings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            if (selectedEmployee) {
                fetchTrainings(selectedEmployee.id);
            }
        } catch (error) {
            console.error('Erro ao excluir treinamento:', error);
        }
    };

    const getStatusBadge = (status: EmployeeTraining['status']) => {
        switch (status) {
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        VENCIDO
                    </span>
                );
            case 'expiring_soon':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        A VENCER
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        REALIZADO
                    </span>
                );
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#025159]">Competências e Treinamentos</h1>
                </div>
                <p className="text-gray-500 text-sm">
                    Gestão de colaboradores e matriz de treinamentos (ISO 9001:2015 - 7.2 & 7.3)
                </p>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Employee List */}
                <div className="col-span-1 lg:col-span-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
                                <h2 className="font-bold text-gray-900">Colaboradores</h2>
                                <button
                                    onClick={() => handleOpenEmployeeModal()}
                                    className="w-full md:w-auto p-2 bg-[#025159] text-white rounded-lg hover:bg-[#025159]/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                                    title="Adicionar Colaborador"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="md:hidden">Novo Colaborador</span>
                                </button>
                            </div>

                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar colaborador..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#025159] focus:ring-2 focus:ring-[#025159]/20 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[300px] md:max-h-[calc(100vh-250px)] overflow-y-auto p-4 pr-2">
                            {employees
                                .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(employee => {
                                    const status = getEmployeeTrainingStatus(employee.id);
                                    const isSelected = selectedEmployee?.id === employee.id;

                                    return (
                                        <button
                                            key={employee.id}
                                            onClick={() => {
                                                setSelectedEmployee(employee);
                                                // Smooth scroll to details on mobile
                                                if (window.innerWidth < 1024) {
                                                    setTimeout(() => {
                                                        document.getElementById('employee-details')?.scrollIntoView({ behavior: 'smooth' });
                                                    }, 100);
                                                }
                                            }}
                                            className={`w-full p-4 rounded-lg border transition-all cursor-pointer flex flex-col gap-3 text-left hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm shrink-0">
                                                        {getInitials(employee.name)}
                                                    </div>
                                                    <div
                                                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${status === 'expired'
                                                            ? 'bg-red-500'
                                                            : status === 'warning'
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-500'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate text-sm">{employee.name}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{employee.job_title}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {status === 'expired' && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded-full">
                                                        Treinamento Vencido
                                                    </span>
                                                )}
                                                {status === 'warning' && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-medium rounded-full">
                                                        A Vencer
                                                    </span>
                                                )}
                                                {status === 'ok' && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                                                        Em Dia
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}

                            {employees.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Nenhum colaborador cadastrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Employee Details & Trainings */}
                <div className="col-span-1 lg:col-span-8" id="employee-details">
                    {selectedEmployee ? (
                        <div className="space-y-6">
                            {/* Employee Header */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-[#025159]/10 flex items-center justify-center font-bold text-[#025159] text-xl shrink-0">
                                            {getInitials(selectedEmployee.name)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Briefcase className="w-4 h-4" />
                                                    {selectedEmployee.job_title}
                                                </div>
                                                {selectedEmployee.department && (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Building className="w-4 h-4" />
                                                        {selectedEmployee.department}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    Admissão: {formatDate(selectedEmployee.admission_date)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenEmployeeModal(selectedEmployee)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Colaborador"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Colaborador"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Trainings Section */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">Matriz de Treinamentos</h3>
                                    <button
                                        onClick={handleOpenTrainingModal}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#025159]/90 transition-colors shadow-sm text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Registrar Treinamento
                                    </button>
                                </div>

                                <div className="p-4">
                                    {trainings.length > 0 ? (
                                        <div className="space-y-3">
                                            {trainings.map(training => (
                                                <div
                                                    key={training.id}
                                                    className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 mb-1">
                                                            {training.training_name}
                                                        </h4>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <span>Realizado: {formatDate(training.date_completed)}</span>
                                                            {training.expiration_date && (
                                                                <span>Validade: {formatDate(training.expiration_date)}</span>
                                                            )}
                                                        </div>
                                                        {training.notes && (
                                                            <p className="text-sm text-gray-600 mt-2">{training.notes}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {getStatusBadge(training.status)}

                                                        {training.certificate_url && (
                                                            <a
                                                                href={training.certificate_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Ver Certificado"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}

                                                        <button
                                                            onClick={() => handleDeleteTraining(training.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Excluir Treinamento"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">Nenhum treinamento registrado</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um colaborador</h3>
                            <p className="text-gray-500">Escolha um colaborador na lista ao lado para ver seus treinamentos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Employee Modal */}
            {isEmployeeModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
                            </h2>
                            <button onClick={() => setIsEmployeeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={employeeForm.name}
                                        onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                                    <input
                                        type="text"
                                        required
                                        value={employeeForm.job_title}
                                        onChange={e => setEmployeeForm({ ...employeeForm, job_title: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="Ex: Operador de Empilhadeira"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                                    <input
                                        type="text"
                                        value={employeeForm.department}
                                        onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="Ex: Logística"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Admissão</label>
                                    <input
                                        type="date"
                                        required
                                        value={employeeForm.admission_date}
                                        onChange={e => setEmployeeForm({ ...employeeForm, admission_date: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={employeeForm.status}
                                        onChange={e => setEmployeeForm({ ...employeeForm, status: e.target.value as 'active' | 'inactive' })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEmployeeModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Training Modal */}
            {isTrainingModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">Registrar Treinamento</h2>
                            <button onClick={() => setIsTrainingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTraining} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Treinamento</label>
                                <input
                                    type="text"
                                    required
                                    value={trainingForm.training_name}
                                    onChange={e => setTrainingForm({ ...trainingForm, training_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    placeholder="Ex: Operação de Empilhadeira NR-11"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Realização</label>
                                    <input
                                        type="date"
                                        required
                                        value={trainingForm.date_completed}
                                        onChange={e => setTrainingForm({ ...trainingForm, date_completed: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Validade (Opcional)</label>
                                    <input
                                        type="date"
                                        value={trainingForm.expiration_date}
                                        onChange={e => setTrainingForm({ ...trainingForm, expiration_date: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notas Adicionais</label>
                                <textarea
                                    rows={3}
                                    value={trainingForm.notes}
                                    onChange={e => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                    placeholder="Informações adicionais sobre o treinamento..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Certificado / Evidência</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            {trainingForm.certificate_file
                                                ? trainingForm.certificate_file.name
                                                : 'Clique para fazer upload (PDF ou Imagem)'}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={e => setTrainingForm({ ...trainingForm, certificate_file: e.target.files?.[0] || null })}
                                            className="hidden"
                                        />
                                    </label>
                                    {trainingForm.certificate_file && (
                                        <button
                                            type="button"
                                            onClick={() => setTrainingForm({ ...trainingForm, certificate_file: null })}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTrainingModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={uploadingCertificate}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingCertificate}
                                    className="px-6 py-2 bg-[#025159] text-white rounded-lg hover:bg-[#3F858C] transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingCertificate ? 'Fazendo upload...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
