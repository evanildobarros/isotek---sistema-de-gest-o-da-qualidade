import { supabase } from '../supabase';
import { GamificationLevel } from '../../types';

export const LEVEL_CONFIGS = {
    bronze: { minXp: 0, maxXp: 500 },
    silver: { minXp: 500, maxXp: 1000 },
    gold: { minXp: 1000, maxXp: 2500 },
    platinum: { minXp: 2500, maxXp: 5000 },
    diamond: { minXp: 5000, maxXp: 10000 },
};

export const calculateLevel = (xp: number): GamificationLevel => {
    if (xp >= 5000) return 'diamond';
    if (xp >= 2500) return 'platinum';
    if (xp >= 1000) return 'gold';
    if (xp >= 500) return 'silver';
    return 'bronze';
};

export const rewardXP = async (userId: string, amount: number, reason: string) => {
    try {
        // 1. Get current XP
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('gamification_xp, gamification_level, audits_completed')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        const currentXp = profile.gamification_xp || 0;
        const newXp = currentXp + amount;
        const newLevel = calculateLevel(newXp);

        // 2. Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                gamification_xp: newXp,
                gamification_level: newLevel,
                audits_completed: reason === 'audit_completed'
                    ? (profile.audits_completed || 0) + 1
                    : profile.audits_completed
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 3. Optional: Add to ledger if table exists
        // (We stick to profile update for now to ensure it works without DB changes)

        return { success: true, newXp, newLevel };
    } catch (error) {
        console.error('Error rewarding XP:', error);
        return { success: false, error };
    }
};
