import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Company } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    company: Company | null;
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
    const [loading, setLoading] = useState(true);
    const [loadingCompany, setLoadingCompany] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // console.log('Auth State Changed:', _event, session?.user?.email);
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
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setCompany(null);
                return;
            }

            if (!profile?.company_id) {
                console.warn('User has no company_id');
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
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
        // Clear local state
        setSession(null);
        setUser(null);
        setCompany(null);
        setLoading(false);
        setLoadingCompany(false);
        // Redirect to login page
        navigate('/login', { replace: true });
    };

    const value = {
        session,
        user,
        company,
        loading,
        loadingCompany,
        signOut,
        refreshCompany: fetchCompany
    };

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
