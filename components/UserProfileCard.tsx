import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Profile } from '../types';

const UserProfileCard: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const fetchProfile = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, role, avatar_url')
                .eq('id', user.id)
                .single();
            if (error) {
                console.error('Error fetching profile:', error);
                setProfile(null);
            } else {
                setProfile(data as Profile);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

    const displayName = profile?.full_name?.trim() || user?.email || '';
    const role = profile?.role?.trim() || 'Colaborador';
    const avatarUrl = profile?.avatar_url;

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        const initials = parts.map(p => p[0]?.toUpperCase() ?? '').join('');
        return initials.slice(0, 2);
    };

    if (authLoading) {
        return (
            <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex flex-col space-y-2">
                    <div className="w-32 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-3 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
            {loading ? (
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            ) : avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500 text-white font-medium">
                    {getInitials(displayName)}
                </div>
            )}
            <div className="flex flex-col">
                {loading ? (
                    <div className="space-y-2">
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                    </div>
                ) : (
                    <>
                        <span className="font-medium text-gray-900">{displayName}</span>
                        <span className="text-xs text-gray-500">{role}</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfileCard;
