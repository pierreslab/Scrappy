import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, getProfile, updateProfile as updateSupabaseProfile, getUserChallenges, getChallenges, updateChallengeProgress as updateSupabaseChallengeProgress, getBadges, getUserBadges } from '../utils/supabase';
import SoundEffects from '../utils/sounds';

const UserContext = createContext();

// Helper to safely format challenge end dates
const formatChallengeDate = (dateString) => {
  try {
    if (!dateString) return null;
    // Parse the date string (YYYY-MM-DD format from Supabase)
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    console.log('Date formatting error:', e);
    return null;
  }
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState({ daily: [], weekly: [], special: [] });
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impactStats, setImpactStats] = useState(null);
  const [schoolImpact, setSchoolImpact] = useState(null);
  const [badges, setBadges] = useState([]);

  // Listen for auth changes and load user data
  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          await loadUserData(session.user.id);
        } else {
          setAuthUser(null);
          // Use mock data when not authenticated
          loadMockUser();
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
        await loadUserData(session.user.id);
      } else {
        // No authenticated user - use mock data for demo mode
        console.log('No authenticated user, using mock data');
        loadMockUser();
      }
    } catch (error) {
      console.error('Session check error:', error);
      // On error, use mock data
      loadMockUser();
    } finally {
      setLoading(false);
    }
  };

  const loadMockUser = () => {
    // Use generic defaults instead of "Pierre"
    setUser({
      id: 'no-user',
      name: 'Scrappy Student',
      avatar: '🌱',
      class: 'Selecting...',
      points: 0,
      monthlyPoints: 0,
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalScans: 0,
      totalCrafts: 0,
      grade: null,
    });

    setImpactStats({
      co2Saved: 0,
      treesSaved: 0,
      energySaved: 0,
      waterSaved: 0,
      itemsRecycled: 0,
    });

    setChallenges({ daily: [], weekly: [], special: [] });
  };

  const loadUserData = async (userId, retryCount = 0) => {
    try {
      // Load profile
      const profile = await getProfile(userId);

      // Profile might not exist yet if just registered
      if (!profile && retryCount < 3) {
        console.log('Profile not found, retrying in 1s...');
        setTimeout(() => loadUserData(userId, retryCount + 1), 1000);
        return;
      }

      // Profile exists but class_id is null - registration might still be in progress
      // Retry a few times to let the registration screen finish updating the profile
      if (profile && !profile.class_id && retryCount < 5) {
        console.log('Profile found but class_id is null, retrying in 500ms... (attempt', retryCount + 1, ')');
        setTimeout(() => loadUserData(userId, retryCount + 1), 500);
        return;
      }

      if (!profile) {
        console.log('Profile still not found after retries, signing out...');
        await supabase.auth.signOut();
        return;
      }

      // Load crafts count
      const { count: craftCount } = await supabase
        .from('crafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Load class rank from leaderboard
      let classRank = null;
      if (profile.class_id) {
        const { data: rankData, error: rankError } = await supabase
          .from('class_leaderboard')
          .select('rank')
          .eq('class_id', profile.class_id)
          .eq('id', userId)
          .maybeSingle();

        if (rankError) {
          console.log('Rank query error:', rankError);
        }
        classRank = rankData?.rank || null;
      }

      setUser({
        id: profile.id,
        name: profile.first_name || profile.username || 'Student',
        avatar: profile.avatar_emoji || '🧑‍🎓',
        class: profile.classes?.name || 'No Class',
        points: profile.total_points || 0,
        monthlyPoints: profile.monthly_points || 0,
        streak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        lastActiveDate: profile.last_activity_date,
        totalScans: profile.total_items || 0,
        totalCrafts: craftCount || 0,
        grade: profile.grade,
        schoolId: profile.school_id,
        classId: profile.class_id,
        classRank: classRank,
      });

      // Load impact stats (don't use .single() to avoid errors for new users)
      const { data: impactArray, error: impactError } = await supabase
        .from('impact_stats')
        .select('*')
        .eq('user_id', userId);

      if (impactArray && impactArray.length > 0) {
        const impact = impactArray[0];
        setImpactStats({
          co2Saved: impact.co2_saved_kg || 0,
          treesSaved: impact.trees_saved || 0,
          energySaved: impact.energy_saved_kwh || 0,
          waterSaved: impact.water_saved_liters || 0,
          itemsRecycled: impact.items_recycled || 0,
        });
      } else {
        // No impact stats yet - create default row
        console.log('No impact stats found, creating default...');
        const { data: newImpact, error: createError } = await supabase
          .from('impact_stats')
          .insert({
            user_id: userId,
            co2_saved_kg: 0,
            trees_saved: 0,
            energy_saved_kwh: 0,
            water_saved_liters: 0,
            items_recycled: 0,
          })
          .select()
          .maybeSingle();

        if (!createError && newImpact) {
          setImpactStats({
            co2Saved: 0,
            treesSaved: 0,
            energySaved: 0,
            waterSaved: 0,
            itemsRecycled: 0,
          });
        } else {
          console.error('Error creating impact stats:', createError);
          // Set defaults anyway
          setImpactStats({
            co2Saved: 0,
            treesSaved: 0,
            energySaved: 0,
            waterSaved: 0,
            itemsRecycled: 0,
          });
        }
      }

      // Load challenges
      await loadChallenges(userId);

      // Load badges
      await loadBadges(userId);

      // Load school impact
      if (profile.school_id) {
        await fetchSchoolImpact(profile.school_id);
      }

      // Check streak
      await checkStreak(userId, profile);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadChallenges = async (userId) => {
    try {
      // Get all active challenges
      const allChallenges = await getChallenges();

      // Get user's progress on challenges
      const userChallenges = await getUserChallenges(userId);

      // Combine them
      const challengesByType = { daily: [], weekly: [], special: [] };

      const today = new Date().toISOString().split('T')[0];

      allChallenges.forEach(challenge => {
        // Skip challenges that are not for today
        if (challenge.start_date && challenge.start_date > today) return;
        if (challenge.end_date && challenge.end_date < today) return;

        const userProgress = userChallenges.find(uc => uc.challenge_id === challenge.id);

        const combinedChallenge = {
          id: challenge.id,
          name: challenge.name,
          emoji: challenge.emoji,
          description: challenge.description,
          type: challenge.type,
          goal: challenge.goal_value,
          goalType: challenge.goal_type,
          points: challenge.points_reward,
          progress: userProgress?.progress || 0,
          completed: userProgress?.completed || false,
          endDate: challenge.end_date ? formatChallengeDate(challenge.end_date) : null,
        };

        if (challenge.type === 'daily') {
          challengesByType.daily.push(combinedChallenge);
        } else if (challenge.type === 'weekly') {
          challengesByType.weekly.push(combinedChallenge);
        } else if (challenge.type === 'special') {
          challengesByType.special.push(combinedChallenge);
        }
      });

      setChallenges(challengesByType);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadBadges = async (userId) => {
    try {
      const allBadges = await getBadges();
      const userBadges = await getUserBadges(userId);

      const combinedBadges = allBadges.map(badge => {
        const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
        return {
          ...badge,
          unlocked: !!userBadge,
          unlockedAt: userBadge?.created_at,
          // Map to match the frontend expected format if necessary
          requirement: badge.requirement_value,
        };
      });

      setBadges(combinedBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const fetchSchoolImpact = async (schoolId) => {
    try {
      const { data, error } = await supabase.rpc('get_school_impact_stats', {
        p_school_id: schoolId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const stats = data[0];
        setSchoolImpact({
          co2Saved: stats.total_co2_saved_kg || 0,
          treesSaved: stats.total_trees_saved || 0,
          energySaved: stats.total_energy_saved_kwh || 0,
          waterSaved: stats.total_water_saved_liters || 0,
          itemsRecycled: stats.total_items_recycled || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching school impact:', error);
    }
  };

  const checkStreak = async (userId, profile) => {
    const today = new Date().toDateString();
    const lastActive = profile.last_activity_date;

    if (!lastActive || lastActive !== today) {
      const lastDate = lastActive ? new Date(lastActive) : new Date();
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      let newStreak = profile.current_streak || 0;

      if (diffDays === 1) {
        // Consecutive day - increase streak
        newStreak = (profile.current_streak || 0) + 1;
      } else if (diffDays > 1) {
        // Missed a day - reset streak
        newStreak = 1;
      }

      // Update in database
      await updateSupabaseProfile(userId, {
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak || 0),
        last_activity_date: new Date().toISOString().split('T')[0],
      });

      // Update local state
      setUser(prev => ({
        ...prev,
        streak: newStreak,
        longestStreak: Math.max(newStreak, profile.longest_streak || 0),
        lastActiveDate: new Date().toISOString().split('T')[0],
      }));
    }
  };

  const addPoints = async (points, type = 'scan') => {
    if (!user) return 0;

    try {
      // If authenticated, update in database
      if (authUser) {
        const updates = {
          total_points: (user.points || 0) + points,
          monthly_points: (user.monthlyPoints || 0) + points,
        };

        if (type === 'scan') {
          updates.total_items = (user.totalScans || 0) + 1;
        }

        await updateSupabaseProfile(authUser.id, updates);
      }

      // Update local state (works in both mock and authenticated mode)
      setUser(prev => ({
        ...prev,
        points: (prev.points || 0) + points,
        monthlyPoints: (prev.monthlyPoints || 0) + points,
        totalScans: type === 'scan' ? (prev.totalScans || 0) + 1 : prev.totalScans,
        totalCrafts: type === 'craft' ? (prev.totalCrafts || 0) + 1 : prev.totalCrafts,
      }));

      const newTotalPoints = (user.points || 0) + points;
      // Update challenge progress
      await updateChallengeProgressForAction(type, points, newTotalPoints);

      return points;
    } catch (error) {
      console.error('Error adding points:', error);
      return 0;
    }
  };

  const updateChallengeProgressForAction = async (type, points, newTotalPoints) => {
    if (!authUser) return;

    try {
      // Update challenges based on action type
      const updatedChallenges = { ...challenges };

      for (const challengeType of ['daily', 'weekly', 'special']) {
        for (const challenge of updatedChallenges[challengeType]) {
          let shouldUpdate = false;
          let newProgress = challenge.progress;

          // Determine if this challenge should be updated using goalType
          if (type === 'scan' && challenge.goalType === 'scans') {
            newProgress = Math.min(challenge.goal, challenge.progress + 1);
            shouldUpdate = true;
          } else if (type === 'craft' && challenge.goalType === 'crafts') {
            newProgress = Math.min(challenge.goal, challenge.progress + 1);
            shouldUpdate = true;
          } else if (challenge.goalType === 'points') {
            newProgress = newTotalPoints;
            shouldUpdate = true;
          } else if (challenge.goalType === 'streak') {
            newProgress = user.streak || 0;
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            const isNowCompleted = newProgress >= challenge.goal;
            // Update in database
            await updateSupabaseChallengeProgress(authUser.id, challenge.id, newProgress, isNowCompleted);

            // Check if just completed
            if (newProgress >= challenge.goal && challenge.progress < challenge.goal) {
              // Award bonus points for completing challenge
              await updateSupabaseProfile(authUser.id, {
                total_points: newTotalPoints + challenge.points,
              });

              // Play celebration sound!
              SoundEffects.playComplete();

              setCompletedChallenges(c => [...c, challenge.id]);
            }

            // Update local state
            challenge.progress = newProgress;
            challenge.completed = newProgress >= challenge.goal;
          }
        }
      }

      setChallenges(updatedChallenges);

      // Reload user data to get updated points
      await loadUserData(authUser.id);
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  const updateProfile = async (name, avatar) => {
    if (!user) return;

    try {
      // If authenticated, update in database
      if (authUser) {
        const updates = {};
        if (name) updates.first_name = name;
        if (avatar) updates.avatar_emoji = avatar;

        await updateSupabaseProfile(authUser.id, updates);
      }

      // Update local state
      setUser(prev => ({
        ...prev,
        name: name || prev.name,
        avatar: avatar || prev.avatar,
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const addImpact = async (co2 = 0.5, trees = 0, energy = 1, water = 10) => {
    if (!impactStats) return;

    try {
      // If authenticated, update in database
      if (authUser) {
        const { data, error } = await supabase
          .from('impact_stats')
          .update({
            co2_saved_kg: (impactStats.co2Saved || 0) + co2,
            trees_saved: (impactStats.treesSaved || 0) + trees,
            energy_saved_kwh: (impactStats.energySaved || 0) + energy,
            water_saved_liters: (impactStats.waterSaved || 0) + water,
            items_recycled: (impactStats.itemsRecycled || 0) + 1,
          })
          .eq('user_id', authUser.id)
          .select()
          .single();

        if (!error && data) {
          setImpactStats({
            co2Saved: data.co2_saved_kg,
            treesSaved: data.trees_saved,
            energySaved: data.energy_saved_kwh,
            waterSaved: data.water_saved_liters,
            itemsRecycled: data.items_recycled,
          });
          return;
        }
      }

      // Update local state (for mock mode)
      setImpactStats(prev => ({
        co2Saved: (prev.co2Saved || 0) + co2,
        treesSaved: (prev.treesSaved || 0) + trees,
        energySaved: (prev.energySaved || 0) + energy,
        waterSaved: (prev.waterSaved || 0) + water,
        itemsRecycled: (prev.itemsRecycled || 0) + 1,
      }));
    } catch (error) {
      console.error('Error updating impact stats:', error);
    }
  };

  const refreshUserData = async () => {
    if (authUser) {
      await loadUserData(authUser.id);
    } else {
      // In mock mode, just reload mock data
      loadMockUser();
    }
  };

  const getDailyChallenge = () => {
    if (!challenges.daily || challenges.daily.length === 0) return null;
    // Return first uncompleted challenge, or first one if all completed
    return challenges.daily.find(c => !c.completed) || challenges.daily[0];
  };

  const isChallengeCompleted = (challengeId) => {
    return completedChallenges.includes(challengeId);
  };

  return (
    <UserContext.Provider value={{
      user,
      challenges,
      badges,
      impactStats,
      schoolImpact,
      loading,
      addPoints,
      updateProfile,
      addImpact,
      getDailyChallenge,
      isChallengeCompleted,
      completedChallenges,
      refreshUserData,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

