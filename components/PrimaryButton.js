import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../data/theme';
import SoundEffects from '../utils/sounds';

export default function PrimaryButton({ title, onPress, style, textStyle, variant = 'primary', disabled, isLoading }) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: COLORS.secondary };
      case 'accent':
        return { backgroundColor: COLORS.accent };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 3, borderColor: COLORS.primary };
      default:
        return { backgroundColor: COLORS.primary };
    }
  };

  const getTextStyle = () => {
    if (variant === 'outline') return { color: COLORS.primary };
    return { color: 'white' };
  };

  const handlePress = () => {
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), (disabled || isLoading) && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : 'white'} />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
