import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../utils/supabase';

export default function StudentProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { student, rank } = route.params;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [crafts, setCrafts] = useState([]);

  useEffect(() => {
    fetchStudentStats();
  }, [student.id]);

  const fetchStudentStats = async () => {
    try {
      // Fetch impact stats
      const { data, error } = await supabase
        .from('impact_stats')
        .select('*')
        .eq('user_id', student.id)
        .single();

      if (data) {
        setStats({
          co2Saved: data.co2_saved_kg,
          treesSaved: data.trees_saved,
          itemsRecycled: data.items_recycled,
          energySaved: data.energy_saved_kwh,
          waterSaved: data.water_saved_liters,
        });
      } else {
        // Fallback calculation if no stats in DB
        setStats({
          co2Saved: Math.floor(student.points / 100),
          treesSaved: Math.floor(student.points / 600),
          itemsRecycled: Math.floor(student.points / 10),
          energySaved: Math.floor(student.points / 50),
          waterSaved: Math.floor(student.points * 5),
        });
      }

      // Fetch student's crafts
      const { data: craftData } = await supabase
        .from('crafts')
        .select('*')
        .eq('user_id', student.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setCrafts(craftData || []);
    } catch (err) {
      console.error('Error fetching student stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{student.avatar || '👤'}</Text>
              {getMedal() && (
                <View style={styles.medalBadge}>
                  <Text style={styles.medalText}>{getMedal()}</Text>
                </View>
              )}
            </View>

            <Text style={styles.name}>{student.name}</Text>

            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>Rank #{rank}</Text>
            </View>

            <View style={styles.pointsDisplay}>
              <Text style={styles.pointsValue}>{student.points.toLocaleString()}</Text>
              <Text style={styles.pointsLabel}>Total Points 🌟</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <Text style={styles.sectionTitle}>Eco Stats 🌍</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.statEmoji}>🌬️</Text>
              <Text style={styles.statValue}>{stats.co2Saved} kg</Text>
              <Text style={styles.statLabel}>CO2 Saved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.statEmoji}>🌳</Text>
              <Text style={styles.statValue}>{stats.treesSaved}</Text>
              <Text style={styles.statLabel}>Trees Saved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.statEmoji}>♻️</Text>
              <Text style={styles.statValue}>{stats.itemsRecycled}</Text>
              <Text style={styles.statLabel}>Items Recycled</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{student.streak} days</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>

          {/* Achievements */}
          <Text style={styles.sectionTitle}>Achievements 🏆</Text>
          <View style={styles.achievementsCard}>
            {student.points >= 100 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>🌱</Text>
                <Text style={styles.achievementName}>Rookie Recycler</Text>
              </View>
            )}
            {student.points >= 500 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>🦸</Text>
                <Text style={styles.achievementName}>Eco Warrior</Text>
              </View>
            )}
            {student.points >= 1000 && (
              <View style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>🏆</Text>
                <Text style={styles.achievementName}>Green Champion</Text>
              </View>
            )}
            {student.points < 100 && (
              <Text style={styles.noAchievements}>Just getting started! 🌟</Text>
            )}
          </View>
          {/* Crafts Gallery */}
          {crafts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Creations 🎨</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.craftsScroll}
                contentContainerStyle={styles.craftsScrollContent}
              >
                {crafts.map((craft) => (
                  <View key={craft.id} style={styles.craftCard}>
                    {craft.photo_url ? (
                      <Image
                        source={{ uri: craft.photo_url }}
                        style={styles.craftImage}
                        resizeMode="cover"
                      />
                    ) : craft.ai_preview_url ? (
                      <Image
                        source={{ uri: craft.ai_preview_url }}
                        style={styles.craftImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.craftEmoji}>{craft.emoji || '🎨'}</Text>
                    )}
                    <Text style={styles.craftName} numberOfLines={2}>{craft.name}</Text>
                    <Text style={styles.craftPoints}>+{craft.points_earned} pts</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* Fun Fact */}
          <View style={styles.funFactCard}>
            <Text style={styles.funFactEmoji}>💡</Text>
            <View style={styles.funFactContent}>
              <Text style={styles.funFactLabel}>Fun Fact</Text>
              <Text style={styles.funFactText}>
                {student.name}'s recycling has saved enough energy to charge {Math.floor(student.points / 5)} phones! 📱
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.cardSmall,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.card,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 110,
    height: 110,
    textAlign: 'center',
    lineHeight: 110,
    borderRadius: 55,
    overflow: 'hidden',
  },
  medalBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.cardSmall,
  },
  medalText: {
    fontSize: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 20,
  },
  rankText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  pointsDisplay: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    ...SHADOWS.cardSmall,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginTop: 4,
  },
  achievementsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  achievementEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  noAchievements: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontWeight: '600',
    paddingVertical: 20,
  },
  funFactCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  funFactEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  funFactContent: {
    flex: 1,
  },
  funFactLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
    marginBottom: 4,
  },
  funFactText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 20,
  },
  craftsScroll: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  craftsScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  craftCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    width: 140,
    ...SHADOWS.cardSmall,
  },
  craftImage: {
    width: 100,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  craftEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  craftName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  craftPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
