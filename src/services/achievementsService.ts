import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Goal } from '../types';

export interface CompletedGoalEntry {
    id: string; // UUID
    name: string;
    completedAt: string; // ISO Date
    isPerfect: boolean;
}

export interface AchievementStats {
    totalGoalsCompleted: number;
    perfectGoalsCompleted: number;
    unlockedMedals: string[]; // IDs of unlocked medals e.g., 'goal_1', 'perfect_5'
    history: CompletedGoalEntry[];
    updatedAt?: any;
}

export interface Achievement {
    id: string;
    type: 'standard' | 'perfect';
    threshold: number;
    title: string;
    description: string;
    icon: string; // Icon name e.g., 'star', 'trophy'
}

export const MILESTONES = [1, 5, 10, 20, 50, 100];

export const getAchievementStats = async (): Promise<AchievementStats> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docRef = doc(db, 'users', user.uid, 'stats', 'achievements');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
        return snap.data() as AchievementStats;
    } else {
        return {
            totalGoalsCompleted: 0,
            perfectGoalsCompleted: 0,
            unlockedMedals: [],
            history: [],
        };
    }
};

export const checkAndUnlockAchievements = async (
    isPerfect: boolean,
    goalName: string
): Promise<{ newUnlock: boolean; unlockedAchievements: Achievement[] }> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const statsRef = doc(db, 'users', user.uid, 'stats', 'achievements');

    // 1. Get current stats (or init)
    let stats = await getAchievementStats();

    // 2. Increment locally
    stats.totalGoalsCompleted += 1;
    if (isPerfect) {
        stats.perfectGoalsCompleted += 1;
    }

    // Add to history
    if (!stats.history) stats.history = [];
    stats.history.push({
        id: Math.random().toString(36).substr(2, 9), // Simple ID generation
        name: goalName,
        completedAt: new Date().toISOString(),
        isPerfect
    });

    // 3. Check for new unlocks
    const newUnlocks: string[] = [];
    const unlockedObjects: Achievement[] = [];

    // Check Standard Milestones
    MILESTONES.forEach(milestone => {
        const id = `goal_${milestone}`;
        if (stats.totalGoalsCompleted >= milestone && !stats.unlockedMedals.includes(id)) {
            newUnlocks.push(id);
            unlockedObjects.push({
                id,
                type: 'standard',
                threshold: milestone,
                title: `Conquistador Nível ${milestone}`,
                description: `Completou ${milestone} metas!`,
                icon: 'trophy-outline'
            });
        }
    });

    // Check Perfect Milestones
    if (isPerfect) {
        MILESTONES.forEach(milestone => {
            const id = `perfect_${milestone}`;
            if (stats.perfectGoalsCompleted >= milestone && !stats.unlockedMedals.includes(id)) {
                newUnlocks.push(id);
                unlockedObjects.push({
                    id,
                    type: 'perfect',
                    threshold: milestone,
                    title: `Perfeccionista Nível ${milestone}`,
                    description: `Completou ${milestone} metas perfeitas!`,
                    icon: 'star-outline'
                });
            }
        });
    }

    // 4. Update Firestore
    if (newUnlocks.length > 0) {
        stats.unlockedMedals = [...stats.unlockedMedals, ...newUnlocks];
    }

    await setDoc(statsRef, {
        totalGoalsCompleted: stats.totalGoalsCompleted,
        perfectGoalsCompleted: stats.perfectGoalsCompleted,
        unlockedMedals: stats.unlockedMedals,
        history: stats.history,
        updatedAt: serverTimestamp()
    }, { merge: true });

    return {
        newUnlock: newUnlocks.length > 0,
        unlockedAchievements: unlockedObjects
    };
};

export const removeGoalFromHistory = async (entryId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const statsRef = doc(db, 'users', user.uid, 'stats', 'achievements');
    const stats = await getAchievementStats();

    if (!stats.history) return;

    const entryIndex = stats.history.findIndex(h => h.id === entryId);
    if (entryIndex === -1) return;

    const entry = stats.history[entryIndex];

    // Remove from history
    stats.history.splice(entryIndex, 1);

    // Decrement counts
    stats.totalGoalsCompleted = Math.max(0, stats.totalGoalsCompleted - 1);
    if (entry.isPerfect) {
        stats.perfectGoalsCompleted = Math.max(0, stats.perfectGoalsCompleted - 1);
    }

    // Re-evaluate Medals (Locking logic)
    // We filter OUT medals that are no longer valid
    const validMedals = stats.unlockedMedals.filter(medalId => {
        const parts = medalId.split('_');
        const type = parts[0]; // 'goal' or 'perfect'
        const threshold = parseInt(parts[1], 10);

        if (type === 'goal') {
            return stats.totalGoalsCompleted >= threshold;
        } else if (type === 'perfect') {
            return stats.perfectGoalsCompleted >= threshold;
        }
        return true; // Keep unknown types
    });

    stats.unlockedMedals = validMedals;

    await setDoc(statsRef, {
        totalGoalsCompleted: stats.totalGoalsCompleted,
        perfectGoalsCompleted: stats.perfectGoalsCompleted,
        unlockedMedals: stats.unlockedMedals,
        history: stats.history,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const calculateIsPerfect = (goal: Goal): boolean => {
    // Heuristic: If number of progress entries matches expected days
    // or simple check: streaks were never broken. 
    // Since we don't have historical streak data, we assume if current progress fully matches target 
    // AND the number of entries in dailyProgress matches the number of days the goal was active, it's perfect.

    // Simplified Logic v1: 
    // A goal is perfect if dailyProgress count >= (Target / DailyTarget)
    // Example: Target 100, Daily 10. Needs 10 days. If dailyProgress has 10 keys, it was efficient.

    if (!goal.dailyProgress) return false;

    const entriesCount = Object.keys(goal.dailyProgress).length;
    const expectedDays = Math.ceil(goal.target / goal.dailyTarget);

    // We allow a small margin? No, perfect is perfect.
    return entriesCount <= expectedDays;
    // Note: It's "<=" because maybe they did MORE than daily target. 
    // If they did LESS, they would need MORE days (count > expected).
};
