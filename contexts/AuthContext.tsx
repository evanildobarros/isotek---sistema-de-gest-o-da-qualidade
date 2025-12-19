import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Company, AuditAssignment } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    company: Company | null;
    isSuperAdmin: boolean;
    loading: boolean;
    loadingCompany: boolean;
    signOut: () => Promise<void>;
    refreshCompany: () => Promise<void>;
    // Auditor Externo
    auditorAssignments: AuditAssignment[];
    viewingAsCompanyId: string | null;
    viewingAsCompanyName: string | null;
    isAuditorMode: boolean;
    setViewingAsCompany: (companyId: string | null, companyName?: string | null) => void;
    effectiveCompanyId: string | null; // company_id efetivo (própria ou visualizando)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingCompany, setLoadingCompany] = useState(true);

    // Estados do Auditor Externo
    const [auditorAssignments, setAuditorAssignments] = useState<AuditAssignment[]>([]);
    const [viewingAsCompanyId, setViewingAsCompanyId] = useState<string | null>(null);
    const [viewingAsCompanyName, setViewingAsCompanyName] = useState<string | null>(null);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchCompany = async () => {
        if (!user) {
            setCompany(null);
            setLoadingCompany(false);
            return;
        }

        try {
            setLoadingCompany(true);
            // 1. Get company_id from profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('company_id, is_super_admin')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setCompany(null);
                return;
            }

            if (profile?.is_super_admin) {
                setIsSuperAdmin(true);
            } else {
                setIsSuperAdmin(false);
            }

            if (!profile?.company_id) {
                console.warn('User has no company_id');
                setCompany(null);
                return;
            }

            // 2. Get company details
            const { data: companyData, error: companyError } = await supabase
                .from('company_info')
                .select('id, name, logo_url, slogan, owner_id, created_at, status, plan, cnpj, monthly_revenue, owner_name, owner_email, email, phone, address, subscription_status, plan_id, current_period_end, max_users, max_storage_gb, stripe_customer_id, stripe_subscription_id, payment_method_brand, payment_method_last4')
                .eq('id', profile.company_id)
                .single();

            if (companyError) {
                console.error('Error fetching company:', companyError);
                setCompany(null);
                return;
            }

            setCompany(companyData);
        } catch (error) {
            console.error('Unexpected error fetching company:', error);
            setCompany(null);
        } finally {
            setLoadingCompany(false);
        }
    };

    // 3. Fetch Company Data when User changes
    useEffect(() => {
        fetchCompany();
    }, [user]);

    const navigate = useNavigate();

    // Função para buscar vínculos de auditor
    const fetchAuditorAssignments = useCallback(async () => {
        if (!user) {
            setAuditorAssignments([]);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('audit_assignments')
                .select(`
                    id, auditor_id, company_id, start_date, end_date, status, notes, created_by, created_at, updated_at,
                    company:company_info(id, name)
                `)
                .eq('auditor_id', user.id)
                .in('status', ['agendada', 'em_andamento']) // Status ativos
                .lte('start_date', today)
                .or(`end_date.is.null,end_date.gte.${today}`);

            if (error) {
                console.error('[AuthContext] Erro ao buscar vínculos de auditor:', error);
                setAuditorAssignments([]);
                return;
            }

            const mappedAssignments: AuditAssignment[] = (data || []).map((item: any) => ({
                id: item.id,
                auditor_id: item.auditor_id,
                company_id: item.company_id,
                start_date: item.start_date,
                end_date: item.end_date,
                status: item.status,
                notes: item.notes,
                created_by: item.created_by,
                created_at: item.created_at,
                updated_at: item.updated_at,
                company_name: item.company?.name || 'Empresa'
            }));

            setAuditorAssignments(mappedAssignments);
        } catch (error) {
            console.error('[AuthContext] Erro ao buscar vínculos:', error);
            setAuditorAssignments([]);
        }
    }, [user]);

    // Buscar vínculos de auditor quando user mudar
    useEffect(() => {
        fetchAuditorAssignments();
    }, [fetchAuditorAssignments]);

    // Restaurar seleção de empresa do sessionStorage
    useEffect(() => {
        const savedCompanyId = sessionStorage.getItem('auditor_viewing_company_id');
        const savedCompanyName = sessionStorage.getItem('auditor_viewing_company_name');
        if (savedCompanyId) {
            setViewingAsCompanyId(savedCompanyId);
            setViewingAsCompanyName(savedCompanyName);
        }
    }, []);

    // Função para trocar empresa visualizada como auditor
    const setViewingAsCompany = useCallback((companyId: string | null, companyName?: string | null) => {
        setViewingAsCompanyId(companyId);
        setViewingAsCompanyName(companyName || null);

        if (companyId) {
            sessionStorage.setItem('auditor_viewing_company_id', companyId);
            if (companyName) {
                sessionStorage.setItem('auditor_viewing_company_name', companyName);
            }
        } else {
            sessionStorage.removeItem('auditor_viewing_company_id');
            sessionStorage.removeItem('auditor_viewing_company_name');
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
        // Clear local state
        setSession(null);
        setUser(null);
        setCompany(null);
        setIsSuperAdmin(false);
        setLoading(false);
        setLoadingCompany(false);
        setAuditorAssignments([]);
        setViewingAsCompanyId(null);
        setViewingAsCompanyName(null);
        sessionStorage.removeItem('auditor_viewing_company_id');
        sessionStorage.removeItem('auditor_viewing_company_name');
        // navigate('/login', { replace: true }); // Removed direct navigation to avoid context issues
    }, [setSession, setUser, setCompany, setIsSuperAdmin, setLoading, setLoadingCompany, setAuditorAssignments, setViewingAsCompanyId, setViewingAsCompanyName]);

    const refreshCompany = useCallback(async () => {
        await fetchCompany();
    }, [fetchCompany]);

    // Computar valores derivados
    const isAuditorMode = !!viewingAsCompanyId;
    const effectiveCompanyId = viewingAsCompanyId || company?.id || null;

    // Memoizar o valor do contexto para evitar re-renderizações
    const value = React.useMemo(() => ({
        session,
        user,
        company,
        isSuperAdmin,
        loading,
        loadingCompany,
        signOut,
        refreshCompany,
        auditorAssignments,
        viewingAsCompanyId,
        viewingAsCompanyName,
        isAuditorMode,
        setViewingAsCompany,
        effectiveCompanyId
    }), [
        session,
        user,
        company,
        isSuperAdmin,
        loading,
        loadingCompany,
        signOut,
        refreshCompany,
        auditorAssignments,
        viewingAsCompanyId,
        viewingAsCompanyName,
        isAuditorMode,
        setViewingAsCompany,
        effectiveCompanyId
    ]);

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
