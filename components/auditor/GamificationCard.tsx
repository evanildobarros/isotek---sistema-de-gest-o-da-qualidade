import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Star,
    ClipboardCheck,
    Zap,
    Eye,
    Heart,
    Award,
    CheckCircle,
    Crown,
    Shield,
    Users,
    Lock,
    TrendingUp,
    Sparkles,
    Wallet
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';
import { Badge, UserBadge, GamificationLevel } from '../../types';
import { AUDITOR_RATES, AUDIT_BASE_PRICE } from '../../lib/constants';
import { calculateAuditEarnings } from '../../lib/utils/finance';
import { Percent } from 'lucide-react';

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
    minXp: number;
    maxXp: number;
    color: string;           // Cor principal do nível (texto/ícone)
    progressColor: string;   // Cor da barra de progresso
    borderColor: string;
    bgStyle: string;         // Estilo do background (gradiente suave)
}

const levelConfigs: Record<GamificationLevel, LevelConfig> = {
    bronze: {
        name: 'Bronze',
        minXp: 0,
        maxXp: 500,
        color: 'text-amber-700',
        progressColor: 'bg-amber-600',
        borderColor: 'border-amber-200',
        bgStyle: 'bg-gradient-to-br from-amber-50 to-white'
    },
    silver: {
        name: 'Prata',
        minXp: 500,
        maxXp: 1000,
        color: 'text-slate-600',
        progressColor: 'bg-slate-500',
        borderColor: 'border-slate-200',
        bgStyle: 'bg-gradient-to-br from-slate-50 to-white'
    },
    gold: {
        name: 'Ouro',
        minXp: 1000,
        maxXp: 2500,
        color: 'text-yellow-700',
        progressColor: 'bg-yellow-500',
        borderColor: 'border-yellow-200',
        bgStyle: 'bg-gradient-to-br from-yellow-50 to-white'
    },
    platinum: {
        name: 'Platina',
        minXp: 2500,
        maxXp: 5000,
        color: 'text-cyan-700',
        progressColor: 'bg-cyan-600',
        borderColor: 'border-cyan-200',
        bgStyle: 'bg-gradient-to-br from-cyan-50 to-white'
    },
    diamond: {
        name: 'Diamante',
        minXp: 5000,
        maxXp: 10000,
        color: 'text-purple-700',
        progressColor: 'bg-purple-600',
        borderColor: 'border-purple-200',
        bgStyle: 'bg-gradient-to-br from-purple-50 to-white'
    }
};

const getNextLevel = (current: GamificationLevel): GamificationLevel | null => {
    const levels: GamificationLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const idx = levels.indexOf(current);
    return idx < levels.length - 1 ? levels[idx + 1] : null;
};

interface GamificationCardProps {
    className?: string;
}

interface AuditorProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    gamification_xp: number;
    gamification_level: GamificationLevel;
    reputation_score: number;
    audits_completed: number;
}

export const GamificationCard: React.FC<GamificationCardProps> = ({ className = '' }) => {
    const { user } = useAuthContext();
    const [profile, setProfile] = useState<AuditorProfile | null>(null);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [loading, setLoading] = useState(true);

    // Dados do perfil do auditor
    const xp = profile?.gamification_xp || 0;
    const level = (profile?.gamification_level || 'bronze') as GamificationLevel;
    const reputation = profile?.reputation_score || 0;
    const auditsCompleted = profile?.audits_completed || 0;

    const levelConfig = levelConfigs[level];
    const nextLevel = getNextLevel(level);
    const nextLevelConfig = nextLevel ? levelConfigs[nextLevel] : null;

    // Calcular progresso
    const progressXp = xp - levelConfig.minXp;
    const levelRange = levelConfig.maxXp - levelConfig.minXp;
    const progressPercent = Math.min(Math.round((progressXp / levelRange) * 100), 100);

    useEffect(() => {
        if (user) {
            fetchProfileAndBadges();
        }
    }, [user]);

    const fetchProfileAndBadges = async () => {
        try {
            setLoading(true);

            // Buscar perfil do auditor com dados de gamificação
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, gamification_xp, gamification_level, reputation_score, audits_completed')
                .eq('id', user?.id)
                .single();

            if (profileError) {
                console.error('Erro ao carregar perfil:', profileError);
            } else {
                setProfile(profileData as AuditorProfile);
            }

            // Buscar todas as badges
            const { data: badges, error: badgesError } = await supabase
                .from('badges')
                .select('id, name, description, icon_name, color, category, xp_reward')
                .order('category', { ascending: true });

            if (badgesError) throw badgesError;
            setAllBadges(badges || []);

            // Buscar badges do usuário
            const { data: earned, error: earnedError } = await supabase
                .from('user_badges')
                .select('id, user_id, badge_id, awarded_at, badge:badges(id, name, description, icon_name, color, category, xp_reward)')
                .eq('user_id', user?.id);

            if (earnedError) throw earnedError;

            // Garantir que a join de badge seja tratada como objeto único
            const mappedBadges = (earned || []).map(ub => ({
                ...ub,
                badge: Array.isArray(ub.badge) ? ub.badge[0] : ub.badge
            })) as UserBadge[];

            setUserBadges(mappedBadges);

            // Buscar dados financeiros (Total Earnings)
            // Tenta buscar da view, se falhar (por permissão ou não existência), calcula manual
            const { data: financialData, error: financialError } = await supabase
                .from('auditor_financial_summary')
                .select('total_earnings, total_audits')
                .eq('auditor_id', user?.id)
                .single();

            if (financialData && financialData.total_earnings > 0) {
                setTotalEarnings(financialData.total_earnings);

                // Sempre atualizar o contador de auditorias a partir da view se disponível
                if ((financialData as any).total_audits > 0) {
                    setProfile(prev => prev ? { ...prev, audits_completed: (financialData as any).total_audits } : null);
                }
            } else {
                // Fallback: Calcular via audit_assignments se view falhar ou retornar 0
                // Usamos a mesma lógica da AuditorWalletPage para consistência
                const { data: assignments } = await supabase
                    .from('audit_assignments')
                    .select('status, auditor_payout')
                    .eq('auditor_id', user?.id)
                    .eq('status', 'concluida');

                if (assignments && assignments.length > 0) {
                    // Sempre atualizar localmente se o número de auditorias for diferente do perfil
                    // para garantir que o dashboard mostre o dado real imediato
                    setProfile(prev => prev ? { ...prev, audits_completed: assignments.length } : null);

                    const total = assignments.reduce((acc, curr) => {
                        // Se tiver payout no banco usa ele, senão calcula com base no nível atual
                        const payout = curr.auditor_payout ||
                            calculateAuditEarnings(AUDIT_BASE_PRICE, level).auditorShare;
                        return acc + payout;
                    }, 0);
                    setTotalEarnings(total);
                } else {
                    setTotalEarnings(0);
                }
            }

        } catch (error) {
            console.error('Erro ao carregar dados de gamificação:', error);
        } finally {
            setLoading(false);
        }
    };

    const earnedBadgeIds = userBadges.map(ub => ub.badge_id);

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
            {/* Layout Horizontal para Desktop */}
            <div className="flex flex-col lg:flex-row">
                {/* Coluna 1: Header com Avatar e Nível + Progress */}
                <div className="p-5 lg:w-80 lg:min-w-80 border-b lg:border-b-0 lg:border-r border-gray-100">
                    <div className="flex items-center gap-4">
                        {/* Avatar com borda de nível */}
                        <div className="relative">
                            <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white flex items-center justify-center border-2 ${levelConfig.borderColor.replace('border-', 'border-')}`}>
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full rounded-full object-cover p-0.5"
                                    />
                                ) : (
                                    <span className={`text-xl lg:text-2xl font-bold ${levelConfig.color}`}>
                                        {profile?.full_name?.charAt(0) || 'A'}
                                    </span>
                                )}
                            </div>
                            {/* Badge de Nível (Ícone) */}
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                                <Trophy className={`w-3 h-3 lg:w-4 lg:h-4 ${levelConfig.color}`} />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base lg:text-lg text-[#025159] truncate" title={profile?.full_name || ''}>
                                {profile?.full_name || 'Auditor'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${levelConfig.color}`}>
                                    Nível {levelConfig.name}
                                </span>
                                {nextLevelConfig && (
                                    <span className="text-xs text-gray-400">
                                        → {nextLevelConfig.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* XP Total */}
                        <div className="text-right">
                            <div className="text-xl lg:text-2xl font-black text-[#025159] flex items-center justify-end gap-1">
                                <Sparkles className="w-4 h-4 text-gray-300" />
                                {xp.toLocaleString()}
                            </div>
                            <span className="text-xs text-gray-400">XP Total</span>
                        </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mt-5">
                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                            <span className="text-gray-500">{progressXp} / {levelRange} XP</span>
                            <span className="text-[#025159]">{progressPercent}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${levelConfig.progressColor}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Coluna 2: Stats + Badges */}
                <div className="flex-1 flex flex-col lg:flex-row bg-white/50">
                    {/* Stats Rápidos */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Reputação */}
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                <div className="p-1.5 bg-yellow-100 rounded-lg">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900 leading-tight">
                                        {reputation.toFixed(1)}
                                    </p>
                                    <p className="text-[10px] text-gray-500">Nota Média</p>
                                </div>
                            </div>


                            {/* Auditoria Taxa de Repasse */}
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <Percent className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900 leading-tight">
                                        {(AUDITOR_RATES[level as keyof typeof AUDITOR_RATES]?.rate * 100 || 70)}%
                                    </p>
                                    <p className="text-[10px] text-gray-500">Taxa de Repasse</p>
                                </div>
                            </div>

                            {/* Financeiro (Novo) */}
                            <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                <div className="p-1.5 bg-emerald-100 rounded-lg">
                                    <Wallet className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900 leading-tight">
                                        R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] text-gray-500">Ganhos Totais</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Galeria de Badges */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Conquistas
                            </h4>
                            <span className="text-xs text-gray-500">
                                {userBadges.length} / {allBadges.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {allBadges.map((badge) => {
                                    const isEarned = earnedBadgeIds.includes(badge.id);
                                    const IconComponent = badgeIcons[badge.icon_name] || Award;

                                    return (
                                        <div
                                            key={badge.id}
                                            className={`relative group cursor-pointer transition-all ${isEarned
                                                ? 'opacity-100 scale-100'
                                                : 'opacity-40 grayscale hover:opacity-60'
                                                }`}
                                            title={`${badge.name}: ${badge.description}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEarned
                                                ? 'bg-gradient-to-br from-white to-gray-100 shadow-md border border-gray-200'
                                                : 'bg-gray-100 border border-gray-200'
                                                }`}>
                                                {isEarned ? (
                                                    <IconComponent className={`w-4 h-4 ${badge.color}`} />
                                                ) : (
                                                    <Lock className="w-3 h-3 text-gray-400" />
                                                )}
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                {badge.name}
                                                {!isEarned && ' (Bloqueado)'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer com Dica */}
            <div className="px-4 pb-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-700">
                        Complete auditorias para ganhar XP e desbloquear badges!
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GamificationCard;

