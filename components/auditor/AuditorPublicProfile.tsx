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
    X,
    Twitter,
    Linkedin,
    Instagram
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, UserBadge, GamificationLevel } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';

import logo from '../../assets/isotek-logo.png';

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
    twitter_url?: string | null;
    linkedin_url?: string | null;
    instagram_url?: string | null;
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
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-3 border-white/50 overflow-hidden">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className={`w-full h-full rounded-full ${profile.avatar_url === logo ? 'object-contain p-2' : 'object-cover'}`}
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

            {/* Redes Sociais */}
            {(profile.twitter_url || profile.linkedin_url || profile.instagram_url) && (
                <div className="px-3 py-3 border-b border-gray-100 flex gap-2">
                    {profile.twitter_url && (
                        <a
                            href={profile.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                            title="Twitter"
                        >
                            <Twitter size={14} />
                        </a>
                    )}
                    {profile.linkedin_url && (
                        <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="LinkedIn"
                        >
                            <Linkedin size={14} />
                        </a>
                    )}
                    {profile.instagram_url && (
                        <a
                            href={profile.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
                            title="Instagram"
                        >
                            <Instagram size={14} />
                        </a>
                    )}
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

// Helper para formatar data
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric'
    });
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
    const { user } = useAuthContext();

    const fetchAuditorData = async () => {
        // Check for undefined, null, empty, or literal "undefined" string
        if (!auditorId || auditorId === 'undefined' || auditorId.trim() === '') return;

        try {
            setLoading(true);

            // Se o usuário logado for quem estamos procurando (auditor visualizando próprio perfil)
            // OU se estamos buscando o perfil do Evans (hardcoded check for demo)
            if (user?.id) {
                const { data: loggedProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (loggedProfile && (loggedProfile.full_name?.toLowerCase().includes('evanildo') || loggedProfile.full_name?.toLowerCase().includes('evans') || loggedProfile.role === 'admin' || loggedProfile.role === 'auditor')) {
                    // Buscar total de auditorias via RPC seguro
                    const { data: statsData, error: statsError } = await supabase
                        .rpc('get_public_auditor_stats', { p_auditor_id: loggedProfile.id });

                    const totalAudits = statsData?.total_audits || 0;

                    const profileWithAudits: AuditorProfile = {
                        ...loggedProfile,
                        audits_completed: totalAudits || 0,
                        avatar_url: loggedProfile.avatar_url || logo,
                        bio: loggedProfile.bio // Mapeando a bio
                    };

                    setProfile(profileWithAudits);
                    const { data: badgesData } = await supabase
                        .from('user_badges')
                        .select('*, badge:badges(*)')
                        .eq('user_id', loggedProfile.id);
                    setBadges(badgesData || []);
                    setLoading(false);
                    return;
                }
            }

            // Fallback: Tentativa de busca pública inteligente se não logado
            if (auditorId === 'isotekapp-auditor' || auditorName?.includes('Evans')) {
                // ... (mantido código existente de busca)
                // Tentativa 1: Busca exata (Priorizando perfil com avatar)
                const { data: exactCandidates, error: exactError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('full_name', 'Evans Barros')
                    .order('created_at', { ascending: false })
                    .limit(5);

                // Filtrar candidato com avatar ou pegar o mais recente
                let realProfile = exactCandidates?.find(p => p.avatar_url) || exactCandidates?.[0];
                let realError = exactError;

                // Tentativa 2: Busca ampla se não encontrou exata
                if (!realProfile) {
                    const { data: fallbackCandidates, error: fallbackError } = await supabase
                        .from('profiles')
                        .select('*')
                        .or('full_name.ilike.%Evans%,role.eq.auditor')
                        .order('created_at', { ascending: false })
                        .limit(5);

                    realProfile = fallbackCandidates?.find(p => p.avatar_url) || fallbackCandidates?.[0];
                    // Se fallbackError existir e for relevante, consideramos. 
                    if (fallbackError) realError = fallbackError;
                }

                if (realProfile && !realError) {
                    // Buscar total de auditorias via RPC seguro
                    const { data: statsData } = await supabase
                        .rpc('get_public_auditor_stats', { p_auditor_id: realProfile.id });

                    const totalAudits = statsData?.total_audits || 0;

                    const profileWithAudits: AuditorProfile = {
                        ...realProfile,
                        audits_completed: totalAudits,
                        avatar_url: realProfile.avatar_url, // Usar o avatar do banco se existir
                        bio: realProfile.bio // Mapeando a bio
                    };

                    setProfile(profileWithAudits);
                    const { data: badgesData } = await supabase
                        .from('user_badges')
                        .select('*, badge:badges(*)')
                        .eq('user_id', realProfile.id);

                    if (badgesData) setBadges(badgesData);
                } else {
                    // Mock profile apenas se não encontrar NADA no banco
                    const mockProfile: AuditorProfile = {
                        id: 'mock-id',
                        full_name: 'Evans Barros',
                        avatar_url: logo,
                        gamification_xp: 1540,
                        gamification_level: 'bronze',
                        reputation_score: 4.9,
                        audits_completed: 12,
                        created_at: new Date().toISOString(),
                        bio: "Especialista em processos de gestão da qualidade e auditoria digital, focado em excelência técnica e automação."
                    };
                    setProfile(mockProfile);
                    setBadges([]);
                }
                setLoading(false);
                return;
            }

            // Buscar perfil
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', auditorId)
                .single();

            if (profileError) {
                console.error('Erro ao carregar perfil do auditor:', profileError);
                return;
            }

            // Buscar total de auditorias via RPC seguro
            const { data: statsData } = await supabase
                .rpc('get_public_auditor_stats', { p_auditor_id: auditorId });

            const totalAudits = statsData?.total_audits || 0;

            const profileWithAudits: AuditorProfile = {
                ...profileData,
                audits_completed: totalAudits,
                bio: profileData.bio // Mapeando a bio
            };

            setProfile(profileWithAudits);

            // Buscar badges
            const { data: badgesData, error: badgesError } = await supabase
                .from('user_badges')
                .select('*, badge:badges(*)')
                .eq('user_id', auditorId);

            if (!badgesError) {
                setBadges(badgesData || []);
            }
        } catch (error) {
            console.error('Erro geral ao buscar auditor:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !profile) {
            fetchAuditorData();
        }
    }, [isOpen, auditorId, user]); // Recarrega se usuário logado mudar

    if (!showTrigger && !isOpen) return null;

    if (showTrigger && !isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
            >
                {auditorName || 'Ver Perfil'}
                {/* <Info size={14} className="text-gray-400" /> */}
            </button>
        );
    }

    if (loading || !profile) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    // Configuração do nível atual
    const currentLevel = levelConfigs[profile.gamification_level] || levelConfigs.bronze;
    const memberSince = new Date(profile.created_at).getFullYear();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { setIsOpen(false); onClose?.(); }}>
            <div
                className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={() => { setIsOpen(false); onClose?.(); }}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Header com Nível */}
                <div className={`pt-8 pb-16 px-6 bg-gradient-to-br ${currentLevel.gradient} text-white relative overflow-hidden`}>
                    {/* Pattern de fundo */}
                    <div className="absolute inset-0 opacity-10">
                        <Trophy size={200} className="absolute -right-10 -bottom-10 rotate-12" />
                    </div>

                    <div className="relative z-10 flex items-start gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg transform rotate-3">
                                <img
                                    src={profile.avatar_url || logo}
                                    alt={profile.full_name || 'Auditor'}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                                <div className={`w-8 h-8 rounded-lg ${currentLevel.bgColor} flex items-center justify-center shadow-md border-2 border-white`}>
                                    <Trophy size={14} className={currentLevel.textColor} />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="font-bold text-lg leading-tight mb-1">
                                {profile.full_name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
                                <Trophy size={14} />
                                <span>Auditor {currentLevel.name} Isotek</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bio do Auditor */}
                {profile.bio && (
                    <div className="px-6 pt-4 pb-2">
                        <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-indigo-100 pl-3">
                            "{profile.bio}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditorPublicProfile;
