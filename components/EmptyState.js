import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../data/theme';

const EMPTY_STATES = {
  crafts: {
    emoji: '🎨',
    title: 'No Crafts Yet!',
    description: 'Scan some items and turn trash into treasure!',
    buttonText: 'Start Crafting',
  },
  scans: {
    emoji: '📷',
    title: 'Nothing Scanned Yet',
    description: 'Take a photo of any item to check if it\'s recyclable!',
    buttonText: 'Scan Now',
  },
  badges: {
    emoji: '🏆',
    title: 'No Badges Earned',
    description: 'Keep recycling to unlock awesome badges!',
    buttonText: 'Start Recycling',
  },
  challenges: {
    emoji: '🎯',
    title: 'No Active Challenges',
    description: 'Check back soon for new challenges!',
    buttonText: null,
  },
  feed: {
    emoji: '📢',
    title: 'No Activity Yet',
    description: 'Be the first to recycle something!',
    buttonText: 'Scan Now',
  },
  leaderboard: {
    emoji: '📊',
    title: 'No Rankings Yet',
    description: 'Start recycling to appear on the leaderboard!',
    buttonText: 'Get Started',
  },
};

export default function EmptyState({ type = 'scans', onAction }) {
  const state = EMPTY_STATES[type] || EMPTY_STATES.scans;

  return (
    <View style={styles.container}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{state.emoji}</Text>
      </View>
      <Text style={styles.title}>{state.title}</Text>
      <Text style={styles.description}>{state.description}</Text>
      {state.buttonText && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{state.buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 32,
    paddingVertical: 48,
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    ...SHADOWS.button,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
