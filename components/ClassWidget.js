import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../data/theme';

export default function ClassWidget({ className, progress, goal }) {
  const percentage = Math.min(100, Math.max(0, progress * 100));

  return (
    <View style={styles.container}>
      {/* Decorative elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.classLabel}>{className}</Text>
          <Text style={styles.goalText}>Goal: {goal}</Text>
        </View>
        <View style={styles.percentBadge}>
          <Text style={styles.percentText}>{Math.round(percentage)}%</Text>
        </View>
      </View>
      
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${percentage}%` }]}>
          <View style={styles.progressShine} />
        </View>
      </View>
      
      <View style={styles.footerRow}>
        <Text style={styles.motivationText}>🔥 Almost there! Keep recycling!</Text>
        <Text style={styles.rewardEmoji}>🍕</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.1,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    opacity: 0.1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  classLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  percentBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  percentText: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
  },
  progressBarBackground: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  motivationText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 13,
  },
  rewardEmoji: {
    fontSize: 28,
  },
});
