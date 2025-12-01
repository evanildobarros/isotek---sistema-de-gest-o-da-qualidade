import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const UserDropdown: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [profile, setProfile] = useState<{ full_name: string | null; role: string | null; avatar_url: string | null; is_super_admin?: boolean } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch profile from Supabase
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, role, avatar_url, is_super_admin')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setProfile(data);
            }
        };

        fetchProfile();
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { signOut } = useAuth();
    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        navigate('/app/perfil');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                {/* Avatar */}
                {profile?.avatar_url ? (
                    <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover shadow-md border-2 border-gray-100"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-isotek-500 to-isotek-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                )}

                {/* User Info */}
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name || user?.email || 'Usuário'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {profile?.is_super_admin ? 'Super Admin' : (profile?.role || 'Colaborador')}
                    </p>
                </div>

                {/* Chevron Icon */}
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 py-1 z-50 animate-fade-in">
                    {/* User Info Header (visible on mobile) */}
                    <div className="md:hidden px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name || user?.email || 'Usuário'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
                    </div>

                    {/* Menu Items */}
                    <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <User size={18} className="text-gray-400" />
                        <span>Meu Perfil</span>
                    </button>

                    <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut size={18} className="text-red-500" />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            )}
        </div>
    );
};
