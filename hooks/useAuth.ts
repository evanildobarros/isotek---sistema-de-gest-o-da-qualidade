import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
    const { user, session, loading, signOut } = useAuthContext();

    // Helper functions that wrap Supabase auth methods
    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { success: !error, data, error };
    };

    const signUp = async (email: string, password: string, options?: { data: any }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options
        });
        return { success: !error, data, error };
    };

    return {
        user,
        session,
        loading,
        error: null, // Context doesn't track global error, but we keep the field for compatibility
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut
    };
};
