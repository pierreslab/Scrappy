import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import { useUser } from '../context/UserContext';
import { getClassLeaderboard, getSchoolLeaderboard, getGlobalLeaderboard } from '../utils/supabase';

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('My Class');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const tabs = ['My Class', 'School', 'Global'];

  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab, user?.classId, user?.schoolId]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      let result = [];
      console.log('Fetching leaderboard for:', { activeTab, classId: user?.classId, schoolId: user?.schoolId });

      if (activeTab === 'My Class') {
        if (user?.classId) {
          result = await getClassLeaderboard(user.classId);
        } else {
          console.warn('No classId found for user');
        }
      } else if (activeTab === 'School') {
        if (user?.schoolId) {
          result = await getSchoolLeaderboard(user.schoolId);
        } else {
          console.warn('No schoolId found for user');
        }
      } else if (activeTab === 'Global') {
        result = await getGlobalLeaderboard();
      }

      console.log('Leaderboard result:', result?.length, 'items');
      setData(result || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentPress = (student, rank) => {
    if (activeTab === 'My Class') {
      navigation.navigate('StudentProfile', {
        student: {
          id: student.id,
          name: student.first_name || student.username,
          avatar: student.avatar_emoji,
          points: student.total_points,
          streak: student.current_streak,
          class: student.class_name,
        },
        rank
      });
    }
  };

  const renderClassItem = ({ item, index }) => {
    const isUser = item.id === user?.id;
    const rank = item.rank || index + 1;

    let medal = null;
    if (rank === 1) medal = '🥇';
    else if (rank === 2) medal = '🥈';
    else if (rank === 3) medal = '🥉';

    return (
      <TouchableOpacity
        style={[styles.row, isUser && styles.userRow]}
        onPress={() => handleStudentPress(item, rank)}
        activeOpacity={0.7}
      >
        <View style={[styles.rankBadge, isUser && styles.rankBadgeUser]}>
          <Text style={[styles.rankText, isUser && styles.userText]}>{medal || rank}</Text>
        </View>
        <View style={[styles.rowAvatar, isUser && styles.rowAvatarUser]}>
          <Text style={styles.rowAvatarEmoji}>{item.avatar_emoji || '👤'}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.name, isUser && styles.userText]}>{item.first_name || item.username}</Text>
          {isUser && <Text style={[styles.youBadge]}>You!</Text>}
        </View>
        <View style={[styles.pointsBadge, isUser && styles.pointsBadgeUser]}>
          <Text style={[styles.points, isUser && styles.pointsUser]}>{item.total_points.toLocaleString()}</Text>
          <Text style={[styles.ptsLabel, isUser && styles.ptsLabelUser]}>pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSchoolItem = ({ item, index }) => {
    const isUserClass = item.id === user?.classId;
    const rank = item.rank || index + 1;

    return (
      <View style={[styles.row, styles.schoolRow, isUserClass && styles.userRow]}>
        <View style={[styles.rankBadge, isUserClass && styles.rankBadgeUser]}>
          <Text style={[styles.rankText, isUserClass && styles.userText]}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.name, isUserClass && styles.userText]}>{item.class_name}</Text>
          <Text style={[styles.subInfo, isUserClass && styles.userTextLight]}>
            {item.student_count} students
          </Text>
        </View>
        <View style={[styles.pointsBadge, isUserClass && styles.pointsBadgeUser]}>
          <Text style={[styles.points, isUserClass && styles.pointsUser]}>
            {item.total_points >= 1000 ? `${(item.total_points / 1000).toFixed(1)}k` : item.total_points}
          </Text>
          <Text style={[styles.ptsLabel, isUserClass && styles.ptsLabelUser]}>pts</Text>
        </View>
      </View>
    );
  };

  const renderGlobalItem = ({ item, index }) => {
    const isUserSchool = item.id === user?.schoolId;
    const rank = item.rank || index + 1;

    let medal = null;
    if (rank === 1) medal = '🥇';
    else if (rank === 2) medal = '🥈';
    else if (rank === 3) medal = '🥉';

    return (
      <View style={[styles.row, styles.globalRow, isUserSchool && styles.userRow]}>
        <View style={[styles.rankBadge, isUserSchool && styles.rankBadgeUser]}>
          <Text style={[styles.rankText, isUserSchool && styles.userText]}>{medal || rank}</Text>
        </View>
        <Text style={styles.countryFlag}>🇨🇦</Text>
        <View style={styles.infoContainer}>
          <Text style={[styles.name, isUserSchool && styles.userText]} numberOfLines={1}>{item.school_name}</Text>
          <Text style={[styles.subInfo, isUserSchool && styles.userTextLight]}>
            {item.city} · {item.student_count} students
          </Text>
        </View>
        <View style={[styles.pointsBadge, isUserSchool && styles.pointsBadgeUser]}>
          <Text style={[styles.points, isUserSchool && styles.pointsUser]}>
            {item.total_points >= 1000 ? `${(item.total_points / 1000).toFixed(0)}k` : item.total_points}
          </Text>
          <Text style={[styles.ptsLabel, isUserSchool && styles.ptsLabelUser]}>pts</Text>
        </View>
      </View>
    );
  };

  const renderItem = (props) => {
    switch (activeTab) {
      case 'My Class': return renderClassItem(props);
      case 'School': return renderSchoolItem(props);
      case 'Global': return renderGlobalItem(props);
      default: return renderClassItem(props);
    }
  };

  const renderTopThree = () => {
    if (activeTab !== 'My Class' || loading || data.length === 0) return null;

    const topThree = data.slice(0, 3);
    const positions = [
      { index: 1, size: 80, top: 20 },
      { index: 0, size: 100, top: 0 },
      { index: 2, size: 70, top: 30 },
    ];

    return (
      <View style={styles.podiumContainer}>
        {positions.map((pos) => {
          const player = topThree[pos.index];
          if (!player) return <View key={pos.index} style={{ width: pos.size, marginHorizontal: 8 }} />;
          const isUser = player.id === user?.id;
          const medals = ['🥇', '🥈', '🥉'];
          const rank = pos.index + 1;

          return (
            <TouchableOpacity
              key={pos.index}
              style={[styles.podiumItem, { marginTop: pos.top }]}
              onPress={() => handleStudentPress(player, rank)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.podiumAvatar,
                { width: pos.size, height: pos.size, borderRadius: pos.size / 2 },
                isUser && styles.podiumAvatarUser
              ]}>
                <Text style={[styles.podiumEmoji, { fontSize: pos.size * 0.5 }]}>
                  {player.avatar_emoji || '👤'}
                </Text>
              </View>
              <Text style={styles.podiumMedal}>{medals[pos.index]}</Text>
              <Text style={[styles.podiumName, isUser && styles.podiumNameUser]} numberOfLines={1}>
                {player.first_name || player.username}
              </Text>
              <View style={[styles.podiumPoints, isUser && styles.podiumPointsUser]}>
                <Text style={[styles.podiumPointsText, isUser && styles.podiumPointsTextUser]}>
                  {player.total_points.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderHeader = () => {
    if (activeTab === 'School') {
      return (
        <View style={styles.headerCard}>
          <Text style={styles.headerCardEmoji}>🏫</Text>
          <View>
            <Text style={styles.headerCardTitle}>School Competition</Text>
            <Text style={styles.headerCardSubtitle}>Which class recycles the most?</Text>
          </View>
        </View>
      );
    }
    if (activeTab === 'Global') {
      return (
        <View style={[styles.headerCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={styles.headerCardEmoji}>🌍</Text>
          <View>
            <Text style={[styles.headerCardTitle, { color: '#1E40AF' }]}>Global Rankings</Text>
            <Text style={[styles.headerCardSubtitle, { color: '#3B82F6' }]}>Top eco-schools worldwide!</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerEmoji}>🏆</Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTopThree()}

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={activeTab === 'My Class' ? data.slice(3) : data}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No data yet. Be the first to join!</Text>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerEmoji: {
    fontSize: 28,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 5,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 15,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontWeight: '700',
    color: COLORS.textLight,
    fontSize: 13,
  },
  activeTabText: {
    color: 'white',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  podiumAvatar: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  podiumAvatarUser: {
    backgroundColor: COLORS.secondary,
    borderWidth: 4,
    borderColor: '#FDE047',
  },
  podiumEmoji: {},
  podiumMedal: {
    fontSize: 28,
    marginTop: -14,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumNameUser: {
    color: COLORS.secondary,
  },
  podiumPoints: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    ...SHADOWS.cardSmall,
  },
  podiumPointsUser: {
    backgroundColor: 'white',
  },
  podiumPointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  podiumPointsTextUser: {
    color: COLORS.text,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    ...SHADOWS.card,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 40,
    fontSize: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  headerCardEmoji: {
    fontSize: 36,
    marginRight: 14,
  },
  headerCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  headerCardSubtitle: {
    fontSize: 13,
    color: '#22C55E',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    marginBottom: 10,
    borderRadius: 20,
  },
  schoolRow: {
    paddingVertical: 16,
  },
  globalRow: {
    paddingVertical: 16,
  },
  userRow: {
    backgroundColor: COLORS.secondary,
    transform: [{ scale: 1.02 }],
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeUser: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  rowAvatarUser: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  rowAvatarEmoji: {
    fontSize: 20,
  },
  countryFlag: {
    fontSize: 28,
    marginLeft: 10,
    marginRight: 4,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  subInfo: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  youBadge: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    overflow: 'hidden',
  },
  pointsBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.cardSmall,
  },
  pointsBadgeUser: {
    backgroundColor: 'white',
  },
  points: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  pointsUser: {
    color: COLORS.text,
  },
  ptsLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  ptsLabelUser: {
    color: COLORS.text,
  },
  userText: {
    color: 'white',
  },
  userTextLight: {
    color: 'rgba(255,255,255,0.8)',
  },
});
