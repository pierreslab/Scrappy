import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import { BADGES, GLOBAL_LEADERBOARD } from '../data/mockData';
import { useCrafts } from '../context/CraftsContext';
import { useUser } from '../context/UserContext';
import BadgeCard from '../components/BadgeCard';
import { Settings, X, Clock, Calendar, Star } from 'lucide-react-native';
import EmptyState from '../components/EmptyState';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedCraft, setSelectedCraft] = useState(null);
  const [challengeTab, setChallengeTab] = useState('daily');
  const { crafts } = useCrafts();
  const { user, challenges, loading, impactStats, badges, schoolImpact } = useUser();
  const badgeList = badges.length > 0 ? badges : Object.values(BADGES);
  // Only count badges that are actually unlocked in the database
  const unlockedCount = badges.filter(b => b.unlocked).length;

  // School Impact Data (Database accurate if available, otherwise fallback to mock)
  const schoolData = GLOBAL_LEADERBOARD.find(s => s.name === user.school) || GLOBAL_LEADERBOARD[0];

  const displaySchoolTrees = schoolImpact?.treesSaved || 42;
  const displaySchoolEnergy = schoolImpact?.energySaved ? (schoolImpact.energySaved / 1000).toFixed(1) : 1.2;
  const displaySchoolItems = schoolImpact?.itemsRecycled ? (schoolImpact.itemsRecycled / 1000).toFixed(1) : 8.5;

  const getChallenges = () => {
    return challenges[challengeTab] || [];
  };

  const handleBadgePress = (badge) => {
    setSelectedBadge(badge);
  };

  const closeBadgeModal = () => {
    setSelectedBadge(null);
  };

  // Show loading state while user data is being fetched
  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* Header with Settings */}
        <View style={styles.headerBar}>
          <Text style={styles.screenTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings size={22} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileDecor1} />
          <View style={styles.profileDecor2} />

          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user.avatar}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.classBadge}>
            <Text style={styles.classText}>{user.class}</Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{user.points}</Text>
              <Text style={styles.profileStatLabel}>Points</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{user.streak}</Text>
              <Text style={styles.profileStatLabel}>Streak 🔥</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{unlockedCount}</Text>
              <Text style={styles.profileStatLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* Impact Stats */}
        <Text style={styles.sectionTitle}>Your Impact 🌍</Text>
        <View style={styles.impactGrid}>
          <View style={[styles.impactCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.impactEmoji}>🌬️</Text>
            <Text style={styles.impactValue}>{impactStats?.co2Saved || 0} kg</Text>
            <Text style={styles.impactLabel}>CO2 Saved</Text>
            <Text style={styles.impactFact}>= {Math.round((impactStats?.co2Saved || 0) * 5)} miles of driving!</Text>
          </View>
          <View style={[styles.impactCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.impactEmoji}>🌳</Text>
            <Text style={styles.impactValue}>{impactStats?.treesSaved || 0}</Text>
            <Text style={styles.impactLabel}>Trees Saved</Text>
            <Text style={styles.impactFact}>Keep it up!</Text>
          </View>
        </View>

        <View style={styles.impactGrid}>
          <View style={[styles.impactCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.impactEmoji}>⚡</Text>
            <Text style={styles.impactValue}>{impactStats?.energySaved || 0} hrs</Text>
            <Text style={styles.impactLabel}>Energy Saved</Text>
            <Text style={styles.impactFact}>Powers a TV!</Text>
          </View>
          <View style={[styles.impactCard, { backgroundColor: '#FCE7F3' }]}>
            <Text style={styles.impactEmoji}>💧</Text>
            <Text style={styles.impactValue}>{impactStats?.waterSaved || 0} L</Text>
            <Text style={styles.impactLabel}>Water Saved</Text>
            <Text style={styles.impactFact}>= {Math.floor((impactStats?.waterSaved || 0) / 100)} baths!</Text>
          </View>
        </View>

        {/* School Collective Impact */}
        <View style={styles.schoolImpactCard}>
          <View style={styles.schoolImpactHeader}>
            <Text style={styles.schoolImpactTitle}>{schoolData.name} Impact 🏫</Text>
            <View style={styles.schoolBadge}>
              <Text style={styles.schoolBadgeText}>{schoolData.city}</Text>
            </View>
          </View>
          <View style={styles.schoolStatsRow}>
            <View style={styles.schoolStat}>
              <Text style={styles.schoolStatEmoji}>🌳</Text>
              <Text style={styles.schoolStatValue}>{displaySchoolTrees}</Text>
              <Text style={styles.schoolStatLabel}>Trees Saved</Text>
            </View>
            <View style={styles.schoolStat}>
              <Text style={styles.schoolStatEmoji}>🔋</Text>
              <Text style={styles.schoolStatValue}>{displaySchoolEnergy}k</Text>
              <Text style={styles.schoolStatLabel}>kWh Saved</Text>
            </View>
            <View style={styles.schoolStat}>
              <Text style={styles.schoolStatEmoji}>🥤</Text>
              <Text style={styles.schoolStatValue}>{displaySchoolItems}k</Text>
              <Text style={styles.schoolStatLabel}>Items Recycled</Text>
            </View>
          </View>
          <View style={styles.schoolGoalContainer}>
            <View style={styles.schoolGoalHeader}>
              <Text style={styles.schoolGoalTitle}>Monthly School Goal</Text>
              <Text style={styles.schoolGoalProgress}>85%</Text>
            </View>
            <View style={styles.schoolGoalBar}>
              <View style={[styles.schoolGoalFill, { width: '85%' }]} />
            </View>
            <Text style={styles.schoolGoalText}>1,500 more items to reach our 10k goal! 🎉</Text>
          </View>
        </View>

        {/* Impact Garden Section */}
        <View style={styles.gardenCard}>
          <Text style={styles.gardenTitle}>My Impact Garden 🌱</Text>
          <Text style={styles.gardenText}>
            Your recycling has helped grow {impactStats?.treesSaved || 0} trees in the school garden!
          </Text>
          <View style={styles.gardenVisuals}>
            {Array.from({ length: impactStats?.treesSaved || 0 }).map((_, i) => (
              <View key={i} style={styles.treeContainer}>
                <Text style={styles.treeEmoji}>🌳</Text>
                <View style={styles.treeShadow} />
              </View>
            ))}
            <View style={[styles.treeContainer, { opacity: 0.4 }]}>
              <Text style={[styles.treeEmoji, { fontSize: 36 }]}>🌱</Text>
              <Text style={styles.plantingText}>Growing...</Text>
            </View>
          </View>
          <View style={styles.gardenProgress}>
            <View style={[styles.gardenProgressFill, { width: `${((impactStats?.itemsRecycled || 0) % 10) * 10}%` }]} />
          </View>
          <Text style={styles.gardenProgressText}>{10 - ((impactStats?.itemsRecycled || 0) % 10)} more recycled items until next tree!</Text>
        </View>

        {/* Challenges Section */}
        <Text style={styles.sectionTitle}>Challenges 🎯</Text>

        {/* Challenge Tabs */}
        <View style={styles.challengeTabs}>
          <TouchableOpacity
            style={[styles.challengeTab, challengeTab === 'daily' && styles.activeChallTab]}
            onPress={() => setChallengeTab('daily')}
          >
            <Clock size={16} color={challengeTab === 'daily' ? 'white' : COLORS.textLight} />
            <Text style={[styles.challTabText, challengeTab === 'daily' && styles.activeChallTabText]}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.challengeTab, challengeTab === 'weekly' && styles.activeChallTab]}
            onPress={() => setChallengeTab('weekly')}
          >
            <Calendar size={16} color={challengeTab === 'weekly' ? 'white' : COLORS.textLight} />
            <Text style={[styles.challTabText, challengeTab === 'weekly' && styles.activeChallTabText]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.challengeTab, challengeTab === 'special' && styles.activeChallTab]}
            onPress={() => setChallengeTab('special')}
          >
            <Star size={16} color={challengeTab === 'special' ? 'white' : COLORS.textLight} />
            <Text style={[styles.challTabText, challengeTab === 'special' && styles.activeChallTabText]}>Special</Text>
          </TouchableOpacity>
        </View>

        {/* Challenge Cards */}
        <View style={styles.challengesList}>
          {getChallenges().map((challenge) => {
            const progressPercent = Math.min(100, (challenge.progress / challenge.goal) * 100);
            const isComplete = challenge.progress >= challenge.goal;

            return (
              <View
                key={challenge.id}
                style={[styles.challengeCard, isComplete && styles.completedChallengeCard]}
              >
                <View style={styles.challengeHeader}>
                  <View style={[styles.challengeIconBg, isComplete && styles.completedIconBg]}>
                    <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeName}>{isComplete ? '✓ ' : ''}{challenge.name}</Text>
                    {challenge.description && (
                      <Text style={styles.challengeDesc}>{challenge.description}</Text>
                    )}
                    {challenge.endDate && (
                      <Text style={styles.challengeDate}>Ends: {challenge.endDate}</Text>
                    )}
                  </View>
                  <View style={[styles.pointsBadge, isComplete && styles.completedBadge]}>
                    <Text style={[styles.pointsText, isComplete && styles.completedPointsText]}>
                      {isComplete ? '✓' : `+${challenge.points}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.challengeProgressContainer}>
                  <View style={styles.challengeProgressBar}>
                    <View
                      style={[
                        styles.challengeProgressFill,
                        { width: `${progressPercent}%` },
                        isComplete && styles.completedProgressFill
                      ]}
                    />
                  </View>
                  <Text style={styles.challengeProgressText}>
                    {challenge.progress >= 1000
                      ? `${(challenge.progress / 1000).toFixed(1)}k`
                      : challenge.progress} / {challenge.goal >= 1000
                        ? `${(challenge.goal / 1000).toFixed(0)}k`
                        : challenge.goal}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* My Crafts Section */}
        <View style={styles.myCraftsHeader}>
          <Text style={styles.sectionTitle}>My Creations 🎨</Text>
          <Text style={styles.craftsCount}>{crafts.length} crafts</Text>
        </View>

        {crafts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              type="crafts"
              onAction={() => navigation.navigate('Main', { screen: 'Scan', params: { mode: 'craft' } })}
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.craftsScroll}
            contentContainerStyle={styles.craftsScrollContent}
          >
            {crafts.map((craft) => (
              <TouchableOpacity
                key={craft.id}
                style={styles.craftCard}
                onPress={() => setSelectedCraft(craft)}
                activeOpacity={0.85}
              >
                {craft.photoUri ? (
                  <Image source={{ uri: craft.photoUri }} style={styles.craftPhoto} />
                ) : (
                  <View style={styles.craftEmojiContainer}>
                    <Text style={styles.craftEmoji}>{craft.emoji}</Text>
                  </View>
                )}
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
                <Text style={styles.craftName} numberOfLines={2}>{craft.name}</Text>
                <Text style={styles.craftDate}>{craft.completedDate}</Text>
                <View style={styles.craftPointsBadge}>
                  <Text style={styles.craftPoints}>+{craft.points} pts</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add New Craft Card */}
            <TouchableOpacity
              style={styles.addCraftCard}
              onPress={() => navigation.navigate('Main', { screen: 'Scan' })}
            >
              <Text style={styles.addCraftPlus}>+</Text>
              <Text style={styles.addCraftText}>Make a Craft</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Trophy Room / Badges */}
        <View style={styles.trophyHeader}>
          <Text style={styles.sectionTitle}>Trophy Room 🏆</Text>
          <Text style={styles.badgeCount}>{unlockedCount}/{badgeList.length}</Text>
        </View>
        <View style={styles.badgeGrid}>
          {badgeList.map((badge, index) => {
            // Only show as unlocked if the database says so
            const isLocked = !badge.unlocked;
            return (
              <BadgeCard
                key={index}
                badge={badge}
                locked={isLocked}
                onPress={() => handleBadgePress(badge)}
              />
            );
          })}
        </View>

      </ScrollView>

      {/* Craft Detail Modal */}
      <Modal
        visible={!!selectedCraft}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedCraft(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.craftModalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCraft(null)}>
              <X size={24} color={COLORS.textLight} />
            </TouchableOpacity>

            {selectedCraft && (
              <>
                {selectedCraft.photoUri ? (
                  <Image source={{ uri: selectedCraft.photoUri }} style={styles.craftModalImage} />
                ) : (
                  <View style={styles.craftModalEmojiContainer}>
                    <Text style={styles.craftModalEmoji}>{selectedCraft.emoji}</Text>
                  </View>
                )}

                <Text style={styles.craftModalName}>{selectedCraft.name}</Text>
                <Text style={styles.craftModalDate}>Completed on {selectedCraft.completedDate}</Text>

                <View style={styles.craftModalPointsBadge}>
                  <Text style={styles.craftModalPoints}>+{selectedCraft.points} pts earned! 🎉</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Badge Detail Modal */}
      <Modal
        visible={!!selectedBadge}
        transparent={true}
        animationType="fade"
        onRequestClose={closeBadgeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={closeBadgeModal}>
              <X size={24} color={COLORS.textLight} />
            </TouchableOpacity>

            {selectedBadge && (
              <>
                <View style={[styles.modalIconContainer, user.points < selectedBadge.requirement && styles.lockedModalIcon]}>
                  <Text style={styles.modalEmoji}>
                    {user.points < selectedBadge.requirement ? '🔒' : selectedBadge.emoji}
                  </Text>
                </View>

                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>

                <View style={[
                  styles.statusTag,
                  user.points < selectedBadge.requirement ? styles.lockedTag : styles.unlockedTag
                ]}>
                  <Text style={[
                    styles.statusTagText,
                    user.points < selectedBadge.requirement ? styles.lockedTagText : styles.unlockedTagText
                  ]}>
                    {user.points < selectedBadge.requirement ? 'Locked' : 'Unlocked!'}
                  </Text>
                </View>

                <Text style={styles.modalDescription}>
                  {selectedBadge.description || `Earn ${selectedBadge.requirement} points to unlock this badge!`}
                </Text>

                {user.points < selectedBadge.requirement && (
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      {user.points} / {selectedBadge.requirement} pts
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(100, (user.points / selectedBadge.requirement) * 100)}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressSubtext}>
                      {selectedBadge.requirement - user.points} more points needed!
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  settingsBtn: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 14,
    ...SHADOWS.cardSmall,
  },
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  profileDecor1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileDecor2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatar: {
    fontSize: 50,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: 'white',
  },
  classBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 8,
  },
  classText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 16,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
  },
  profileStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  impactGrid: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  impactCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    ...SHADOWS.cardSmall,
  },
  impactEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },
  impactLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  impactFact: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 6,
    fontStyle: 'italic',
  },
  schoolImpactCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  schoolImpactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  schoolImpactTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    flex: 1,
  },
  schoolBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  schoolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  schoolStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 20,
  },
  schoolStat: {
    alignItems: 'center',
    flex: 1,
  },
  schoolStatEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  schoolStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  schoolStatLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  schoolGoalContainer: {
    marginTop: 4,
  },
  schoolGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  schoolGoalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  schoolGoalProgress: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  schoolGoalBar: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  schoolGoalFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  schoolGoalText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  gardenCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 28,
    padding: 24,
    marginTop: 12,
    marginBottom: 24,
    ...SHADOWS.cardSmall,
  },
  gardenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 8,
  },
  gardenText: {
    color: '#166534',
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 20,
  },
  gardenVisuals: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  treeContainer: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  treeEmoji: {
    fontSize: 48,
  },
  treeShadow: {
    width: 30,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginTop: -4,
  },
  plantingText: {
    fontSize: 10,
    color: '#166534',
    marginTop: 4,
  },
  gardenProgress: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gardenProgressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  gardenProgressText: {
    fontSize: 12,
    color: '#166534',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  trophyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeCount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  // Challenges Styles
  challengeTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    ...SHADOWS.cardSmall,
  },
  challengeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 12,
  },
  activeChallTab: {
    backgroundColor: COLORS.primary,
  },
  challTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  activeChallTabText: {
    color: 'white',
  },
  challengesList: {
    marginBottom: 24,
  },
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  completedChallengeCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIconBg: {
    backgroundColor: '#DCFCE7',
  },
  challengeEmoji: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  challengeName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  completedText: {
    color: '#166534',
  },
  challengeDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  challengeDate: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  completedBadge: {
    backgroundColor: '#22C55E',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  completedPointsText: {
    color: 'white',
  },
  challengeProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  completedProgressFill: {
    backgroundColor: '#22C55E',
  },
  challengeProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
    minWidth: 60,
    textAlign: 'right',
  },

  // My Crafts Styles
  myCraftsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  craftsCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  emptyStateContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  craftsScroll: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  craftsScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  craftCard: {
    width: 130,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.card,
  },
  craftPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#22C55E',
  },
  craftEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  craftEmoji: {
    fontSize: 32,
  },
  completedBadge: {
    position: 'absolute',
    top: 55,
    right: 35,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 1,
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  craftName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
    height: 34,
  },
  craftDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  craftPointsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  craftPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  addCraftCard: {
    width: 130,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  addCraftPlus: {
    fontSize: 36,
    color: COLORS.textLight,
    fontWeight: '300',
  },
  addCraftText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 4,
  },

  // Craft Modal Styles
  craftModalContent: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.card,
  },
  craftModalImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#22C55E',
  },
  craftModalEmojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  craftModalEmoji: {
    fontSize: 60,
  },
  craftModalName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  craftModalDate: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  craftModalPointsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  craftModalPoints: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...SHADOWS.card,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'white',
    ...SHADOWS.cardSmall,
  },
  lockedModalIcon: {
    backgroundColor: '#E5E7EB',
  },
  modalEmoji: {
    fontSize: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  unlockedTag: {
    backgroundColor: '#DCFCE7',
  },
  lockedTag: {
    backgroundColor: '#F3F4F6',
  },
  statusTagText: {
    fontWeight: '700',
    fontSize: 14,
  },
  unlockedTagText: {
    color: '#166534',
  },
  lockedTagText: {
    color: '#6B7280',
  },
  modalDescription: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  progressSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
