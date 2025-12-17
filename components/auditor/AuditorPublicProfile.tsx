import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Star,
    Award,
    Calendar,
    Zap,
    Eye,
    Heart,
    Crown,
    Shield,
    Users,
    CheckCircle,
    Info,
    X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, UserBadge, GamificationLevel } from '../../types';

// Mapeamento de ícones por slug
const badgeIcons: Record<string, React.ElementType> = {
    'Zap': Zap,
    'Eye': Eye,
    'Heart': Heart,
    'Award': Award,
    'CheckCircle': CheckCircle,
    'Trophy': Trophy,
    'Crown': Crown,
    'Star': Star,
    'Shield': Shield,
    'Users': Users,
};

// Configuração de níveis
interface LevelConfig {
    name: string;
    gradient: string;
    textColor: string;
    bgColor: string;
}

const levelConfigs: Record<GamificationLevel, LevelConfig> = {
    bronze: {
        name: 'Bronze',
        gradient: 'from-amber-600 to-amber-800',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-100'
    },
    silver: {
        name: 'Prata',
        gradient: 'from-gray-400 to-gray-600',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-100'
    },
    gold: {
        name: 'Ouro',
        gradient: 'from-yellow-400 to-amber-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-100'
    },
    platinum: {
        name: 'Platina',
        gradient: 'from-cyan-400 to-teal-500',
        textColor: 'text-cyan-700',
        bgColor: 'bg-cyan-100'
    },
    diamond: {
        name: 'Diamante',
        gradient: 'from-purple-400 to-pink-500',
        textColor: 'text-purple-700',
        bgColor: 'bg-purple-100'
    }
};

interface AuditorProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    gamification_xp: number;
    gamification_level: GamificationLevel;
    reputation_score: number;
    audits_completed: number;
    created_at: string;
}

interface AuditorPublicProfileProps {
    auditorId: string;
    auditorName?: string;
    showTrigger?: boolean; // Se true, renderiza o trigger (nome clicável)
    onClose?: () => void;
    className?: string;
}

// Componente do Card
const ProfileCard: React.FC<{
    profile: AuditorProfile;
    badges: UserBadge[];
    onClose?: () => void;
}> = ({ profile, badges, onClose }) => {
    const level = (profile.gamification_level || 'bronze') as GamificationLevel;
    const levelConfig = levelConfigs[level];
    const memberSince = profile.created_at
        ? new Date(profile.created_at).getFullYear()
        : new Date().getFullYear();

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-72 z-50">
            {/* Header com gradiente */}
            <div className={`bg-gradient-to-r ${levelConfig.gradient} p-4 text-white relative`}>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-3 border-white/50">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold">
                                {profile.full_name?.charAt(0) || 'A'}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-base">
                            {profile.full_name || 'Auditor'}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <Trophy size={14} />
                            <span className="text-sm font-medium">
                                Auditor {levelConfig.name} Isotek
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="p-3 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <div>
                            <p className="text-sm font-bold text-gray-900">
                                {profile.reputation_score?.toFixed(1) || '0.0'}
                            </p>
                            <p className="text-[10px] text-gray-500">Avaliação</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                            <p className="text-sm font-bold text-gray-900">
                                {profile.audits_completed || 0}
                            </p>
                            <p className="text-[10px] text-gray-500">Auditorias</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges conquistadas */}
            {badges.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Award size={12} />
                        Conquistas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {badges.slice(0, 5).map((ub) => {
                            const badge = ub.badge;
                            if (!badge) return null;
                            const IconComponent = badgeIcons[badge.icon_name] || Award;
                            return (
                                <div
                                    key={ub.badge_id}
                                    title={badge.name}
                                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                                >
                                    <IconComponent className={`w-4 h-4 ${badge.color}`} />
                                </div>
                            );
                        })}
                        {badges.length > 5 && (
                            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                +{badges.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-3 bg-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>Membro desde {memberSince}</span>
                </div>
            </div>
        </div>
    );
};

// Componente Principal com Popover
export const AuditorPublicProfile: React.FC<AuditorPublicProfileProps> = ({
    auditorId,
    auditorName,
    showTrigger = true,
    onClose,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(!showTrigger);
    const [profile, setProfile] = useState<AuditorProfile | null>(null);
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAuditorData = async () => {
        if (!auditorId) return;

        try {
            setLoading(true);

            // Buscar perfil
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, gamification_xp, gamification_level, reputation_score, audits_completed, created_at')
                .eq('id', auditorId)
                .single();

            if (profileError) {
                console.error('Erro ao carregar perfil do auditor:', profileError);
                return;
            }

            setProfile(profileData as AuditorProfile);

            // Buscar badges
            const { data: badgesData, error: badgesError } = await supabase
                .from('user_badges')
                .select('*, badge:badges(*)')
                .eq('user_id', auditorId);

            if (!badgesError) {
                setBadges(badgesData || []);
            }

        } catch (error) {
            console.error('Erro ao buscar dados do auditor:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !profile) {
            fetchAuditorData();
        }
    }, [isOpen, auditorId]);

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        onClose?.();
    };

    if (!showTrigger) {
        // Renderiza só o card
        if (loading) {
            return (
                <div className={`bg-white rounded-xl shadow-lg p-6 w-72 ${className}`}>
                    <div className="flex items-center justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                </div>
            );
        }

        if (!profile) return null;

        return <ProfileCard profile={profile} badges={badges} onClose={onClose} />;
    }

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Trigger - Nome clicável */}
            <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1.5 text-[#025159] hover:text-[#013d42] font-medium transition-colors group"
            >
                <span className="border-b border-dashed border-current">
                    {auditorName || 'Auditor'}
                </span>
                <Info size={14} className="opacity-60 group-hover:opacity-100" />
            </button>

            {/* Popover/Card */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={handleClose}
                    />
                    {/* Card posicionado */}
                    <div className="absolute top-full left-0 mt-2 z-50">
                        {loading ? (
                            <div className="bg-white rounded-xl shadow-lg p-6 w-72">
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                                </div>
                            </div>
                        ) : profile ? (
                            <ProfileCard profile={profile} badges={badges} onClose={handleClose} />
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-4 w-72 text-center text-gray-500 text-sm">
                                Não foi possível carregar o perfil
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AuditorPublicProfile;
