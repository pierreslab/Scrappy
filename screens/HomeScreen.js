import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../data/theme';
import ClassWidget from '../components/ClassWidget';
import FeedItem from '../components/FeedItem';
import PrimaryButton from '../components/PrimaryButton';
import { Settings } from 'lucide-react-native';
import { useCelebration } from '../context/CelebrationContext';
import { useUser } from '../context/UserContext';
import { getActivityFeed } from '../utils/supabase';

export default function HomeScreen({ navigation }) {
  const { celebrateStreak } = useCelebration();
  const { user, loading, getDailyChallenge } = useUser();
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const hasShownStreak = useRef(false);

  const dailyChallenge = getDailyChallenge();
  const challengeProgress = dailyChallenge ? (dailyChallenge.progress / dailyChallenge.goal) * 100 : 0;

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const data = await getActivityFeed(10);
      setFeed(data || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setFeedLoading(false);
    }
  };

  // Poll for new feed items every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  // Show streak celebration on first load if streak >= 3
  useEffect(() => {
    if (!hasShownStreak.current && user && user.streak >= 3) {
      hasShownStreak.current = true;
      setTimeout(() => {
        celebrateStreak(user.streak);
      }, 1000);
    }
  }, [user]);

  // Show loading state while user data is being fetched
  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your world...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{user.name}! {user.avatar}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.streakContainer} activeOpacity={0.8}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakCount}>{user.streak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Settings size={22} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsLeft}>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{user.points.toLocaleString()} 🌟</Text>
          </View>
          <View style={styles.pointsDivider} />
          <View style={styles.pointsRight}>
            <Text style={styles.rankLabel}>Class Rank</Text>
            <Text style={styles.rankValue}>#{user.classRank || '?'} 🏆</Text>
          </View>
        </View>

        {/* Class Widget */}
        <ClassWidget
          className={user.class}
          progress={0.8}
          goal="Pizza Party 🍕"
        />

        {/* Daily Challenge */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeLabel}>🎯 Daily Challenge</Text>
            <View style={[styles.rewardBadge, dailyChallenge?.progress >= dailyChallenge?.goal && styles.completedBadge]}>
              <Text style={[styles.rewardText, dailyChallenge?.progress >= dailyChallenge?.goal && styles.completedText]}>
                {dailyChallenge?.progress >= dailyChallenge?.goal ? '✓ Done!' : `+${dailyChallenge?.points || 50} pts`}
              </Text>
            </View>
          </View>
          <Text style={styles.challengeTitle}>{dailyChallenge?.name || 'Recycle 3 Items'}</Text>
          <View style={styles.challengeProgress}>
            <View style={[styles.challengeProgressFill, { width: `${challengeProgress}%` }]} />
          </View>
          <Text style={styles.challengeProgressText}>
            {dailyChallenge?.progress || 0} of {dailyChallenge?.goal || 3} completed
          </Text>
          {dailyChallenge?.progress < dailyChallenge?.goal && (
            <PrimaryButton
              title="📸 Scan Now"
              onPress={() => navigation.navigate('Scan')}
              style={styles.challengeButton}
            />
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions ⚡</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#DBEAFE' }]} onPress={() => navigation.navigate('Scan', { mode: 'recycle' })}>
            <Text style={styles.quickActionEmoji}>♻️</Text>
            <Text style={styles.quickActionLabel}>Recycle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#FCE7F3' }]} onPress={() => navigation.navigate('Scan', { mode: 'craft' })}>
            <Text style={styles.quickActionEmoji}>🎨</Text>
            <Text style={styles.quickActionLabel}>Craft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#FEF3C7' }]} onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.quickActionEmoji}>🏆</Text>
            <Text style={styles.quickActionLabel}>Ranks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#E0E7FF' }]} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.quickActionEmoji}>📊</Text>
            <Text style={styles.quickActionLabel}>My Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Feed */}
        <Text style={styles.sectionTitle}>Live Updates 📢</Text>
        <View style={styles.feedContainer}>
          {feedLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 20 }} />
          ) : feed.length === 0 ? (
            <Text style={styles.emptyFeedText}>No updates yet. Start recycling to see your name here!</Text>
          ) : (
            feed.map((item, index) => (
              <FeedItem key={item.id} item={item} index={index} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  settingsBtn: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    ...SHADOWS.cardSmall,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  username: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  streakContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.cardSmall,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  streakLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  pointsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.card,
  },
  pointsLeft: {
    flex: 1,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsValue: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  pointsDivider: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 20,
    borderRadius: 1,
  },
  pointsRight: {
    alignItems: 'center',
  },
  rankLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  rankValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  challengeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '700',
  },
  rewardBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: COLORS.primary,
  },
  rewardText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  completedText: {
    color: 'white',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  challengeProgress: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 5,
  },
  challengeProgressText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 16,
    fontWeight: '600',
  },
  challengeButton: {
    backgroundColor: COLORS.accent,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    width: '47%',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.cardSmall,
  },
  quickActionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  feedContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    ...SHADOWS.card,
  },
  emptyFeedText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14,
    padding: 20,
    fontStyle: 'italic',
  },
});
