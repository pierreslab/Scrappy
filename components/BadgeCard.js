import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SHADOWS } from '../data/theme';

export default function BadgeCard({ badge, locked, onPress }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: '29%', aspectRatio: 0.72, margin: 6 }}
    >
      <Animated.View style={[styles.container, locked && styles.lockedContainer, { transform: [{ scale: scaleAnim }] }]}>
        {/* Glow effect for unlocked badges */}
        {!locked && <View style={styles.glowEffect} />}
        
        <View style={[styles.iconContainer, locked && styles.lockedIconContainer]}>
          <Text style={styles.emoji}>{locked ? '🔒' : badge.emoji}</Text>
        </View>
        
        <Text style={[styles.name, locked && styles.lockedText]} numberOfLines={2}>
          {badge.name}
        </Text>
        
        <View style={[styles.statusBadge, locked ? styles.lockedBadge : styles.unlockedBadge]}>
          <Text style={[styles.statusText, locked && styles.lockedStatusText]} numberOfLines={1}>
            {locked ? `${badge.requirement} pts` : 'Unlocked ✓'}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  lockedContainer: {
    backgroundColor: '#F3F4F6',
    ...SHADOWS.cardSmall,
  },
  glowEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -60,
    borderRadius: 40,
    backgroundColor: COLORS.secondaryLight,
    opacity: 0.3,
  },
  iconContainer: {
    backgroundColor: COLORS.secondaryLight,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lockedIconContainer: {
    backgroundColor: '#D1D5DB',
  },
  emoji: {
    fontSize: 28,
  },
  name: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 14,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedBadge: {
    backgroundColor: '#DCFCE7',
  },
  lockedBadge: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.primary,
    flexShrink: 0,
  },
  lockedStatusText: {
    color: '#9CA3AF',
  },
});
