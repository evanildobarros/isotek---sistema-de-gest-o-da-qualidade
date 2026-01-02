import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Company } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    company: Company | null;
    isSuperAdmin: boolean;
    role: string | null;
    loading: boolean;
    loadingCompany: boolean;
    signOut: () => Promise<void>;
    refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingCompany, setLoadingCompany] = useState(true);

    const fetchCompany = useCallback(async (currentSession: Session | null) => {
        if (!currentSession?.user) {
            setCompany(null);
            setLoadingCompany(false);
            setIsSuperAdmin(false);
            setRole(null);
            return;
        }

        try {
            setLoadingCompany(true);

            // 1. Get profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('company_id, is_super_admin, role')
                .eq('id', currentSession.user.id)
                .single();

            if (profileError) {
                console.error('[AuthContext] Erro ao buscar perfil:', profileError);
                setCompany(null);
                return;
            }

            setIsSuperAdmin(!!profile?.is_super_admin);
            setRole(profile?.role || null);

            if (!profile?.company_id) {
                setCompany(null);
                return;
            }

            // 2. Get company details
            const { data: companyData, error: companyError } = await supabase
                .from('company_info')
                .select('*')
                .eq('id', profile.company_id)
                .single();

            if (companyError) {
                console.error('[AuthContext] Erro ao buscar empresa:', companyError);
                setCompany(null);
                return;
            }

            setCompany(companyData as Company);
        } catch (error) {
            console.error('[AuthContext] Erro inesperado:', error);
            setCompany(null);
        } finally {
            setLoadingCompany(false);
        }
    }, []);

    useEffect(() => {
        // Initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            fetchCompany(session);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            fetchCompany(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [fetchCompany]);

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('[AuthContext] Erro ao sair:', error);
        }
        setSession(null);
        setUser(null);
        setCompany(null);
        setIsSuperAdmin(false);
        setRole(null);
        localStorage.removeItem('isotek_target_company');
        localStorage.removeItem('isotek_auditor_mode');
    }, []);

    const refreshCompany = useCallback(async () => {
        await fetchCompany(session);
    }, [fetchCompany, session]);

    const value = useMemo(() => ({
        session,
        user,
        company,
        isSuperAdmin,
        role,
        loading,
        loadingCompany,
        signOut,
        refreshCompany
    }), [session, user, company, isSuperAdmin, loading, loadingCompany, signOut, refreshCompany]);

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#025159]"></div>
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
