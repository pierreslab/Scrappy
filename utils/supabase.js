import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toByteArray } from 'base64-js';

const supabaseUrl = 'https://tifefoiykytlwfhbjnbu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZmVmb2l5a3l0bHdmaGJqbmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzg5NDMsImV4cCI6MjA4MzY1NDk0M30.IZoMMfC4UQ_bRFcS3yG10jw-uRc1uXRwOhFgefIIKS8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for common operations

// Auth
export const signUp = async (email, password, name, classId) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) throw error;

  // Update profile with class
  if (data.user && classId) {
    await supabase
      .from('profiles')
      .update({ class_id: classId, name })
      .eq('id', data.user.id);
  }

  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Profile
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      classes(name, school_id, schools(name, city))
    `)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('getProfile error:', error);
    throw error;
  }
  console.log('getProfile result:', {
    id: data?.id,
    class_id: data?.class_id,
    school_id: data?.school_id,
    classes: data?.classes
  });
  return data;
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Add points and update stats
export const addPoints = async (userId, points, type = 'scan') => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, total_items')
    .eq('id', userId)
    .maybeSingle();

  const updates = {
    total_points: (profile?.total_points || 0) + points,
  };

  if (type === 'scan') {
    updates.total_items = (profile?.total_items || 0) + 1;
  }

  // Also update impact stats in separate table
  const { data: impact } = await supabase
    .from('impact_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (impact) {
    await supabase
      .from('impact_stats')
      .update({
        co2_saved_kg: (impact.co2_saved_kg || 0) + 0.5,
        water_saved_liters: (impact.water_saved_liters || 0) + 10,
        energy_saved_kwh: (impact.energy_saved_kwh || 0) + 1,
        items_recycled: (impact.items_recycled || 0) + 1,
      })
      .eq('user_id', userId);
  }

  return updateProfile(userId, updates);
};

// Scans
export const createScan = async (userId, scanData) => {
  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id: userId,
      ...scanData,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getUserScans = async (userId) => {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Crafts
export const createCraft = async (userId, craftData) => {
  const { data, error } = await supabase
    .from('crafts')
    .insert({
      user_id: userId,
      ...craftData,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getUserCrafts = async (userId) => {
  const { data, error } = await supabase
    .from('crafts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Leaderboards
export const getClassLeaderboard = async (classId) => {
  const { data, error } = await supabase
    .from('class_leaderboard')
    .select('*')
    .eq('class_id', classId)
    .order('rank', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data;
};

export const getSchoolLeaderboard = async (schoolId) => {
  const { data, error } = await supabase
    .from('school_leaderboard')
    .select('*')
    .eq('school_id', schoolId)
    .order('rank', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data;
};

export const getGlobalLeaderboard = async () => {
  const { data, error } = await supabase
    .from('global_leaderboard')
    .select('*')
    .order('rank', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data;
};

// Badges
export const getBadges = async () => {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true });

  if (error) throw error;
  return data;
};

export const getUserBadges = async (userId) => {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export const unlockBadge = async (userId, badgeId) => {
  const { data, error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId })
    .select()
    .maybeSingle();

  if (error && error.code !== '23505') throw error; // Ignore duplicate key error
  return data;
};

// Challenges
export const getChallenges = async (type) => {
  let query = supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const getUserChallenges = async (userId) => {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export const updateChallengeProgress = async (userId, challengeId, progress, completed = false) => {
  const { data, error } = await supabase
    .from('user_challenges')
    .upsert({
      user_id: userId,
      challenge_id: challengeId,
      progress,
      completed,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Activity Feed
export const getActivityFeed = async (limit = 20) => {
  const { data, error } = await supabase
    .from('activity_feed')
    .select('*, profiles(first_name, username, avatar_emoji)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export const createFeedItem = async (userId, feedData) => {
  const { data, error } = await supabase
    .from('activity_feed')
    .insert({
      user_id: userId,
      ...feedData,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Classes
export const getClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select('*, schools(name, city)')
    .order('name');

  if (error) throw error;
  return data;
};

// Storage helpers for images

// Upload base64 image to storage
export const uploadBase64Image = async (bucket, fileName, base64Data) => {
  // Convert base64 to Uint8Array using base64-js
  const byteArray = toByteArray(base64Data);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, byteArray, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

// Upload scan image
export const uploadScanImage = async (userId, base64Data) => {
  const fileName = `${userId}/${Date.now()}.jpg`;
  return uploadBase64Image('scans', fileName, base64Data);
};

// Upload craft image
export const uploadCraftImage = async (userId, base64Data) => {
  const fileName = `${userId}/${Date.now()}.jpg`;
  return uploadBase64Image('crafts', fileName, base64Data);
};

// Upload avatar image
export const uploadAvatarImage = async (userId, base64Data) => {
  const fileName = `${userId}/avatar.jpg`;
  return uploadBase64Image('avatars', fileName, base64Data);
};

// Get public URL for a file
export const getPublicUrl = (bucket, path) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return publicUrl;
};

