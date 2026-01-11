import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../data/theme';

const AVATAR_COLORS = ['#DBEAFE', '#FCE7F3', '#FEF3C7', '#D1FAE5', '#E0E7FF'];

export default function FeedItem({ item, index = 0 }) {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  // Format the relative time
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // If item is from Supabase, it has different structure than old mock data
  const profile = item.profiles;
  const name = profile?.first_name || profile?.username || item.name || 'Someone';
  const avatar = profile?.avatar_emoji || item.avatar || '👤';
  const description = item.description || item.text;
  const time = item.created_at ? getTimeAgo(item.created_at) : (item.time || 'Today');

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatar}>{avatar}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>
          <Text style={styles.nameText}>{name}</Text> {description}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={styles.dotIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatar: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  nameText: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  time: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryLight,
    marginLeft: 10,
  },
});
