import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../data/theme';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

const TOAST_TYPES = {
  success: {
    bg: '#D1FAE5',
    color: '#166534',
    icon: CheckCircle,
    emoji: '✅',
  },
  error: {
    bg: '#FEE2E2',
    color: '#991B1B',
    icon: AlertCircle,
    emoji: '❌',
  },
  warning: {
    bg: '#FEF3C7',
    color: '#92400E',
    icon: AlertTriangle,
    emoji: '⚠️',
  },
  info: {
    bg: '#DBEAFE',
    color: '#1E40AF',
    icon: Info,
    emoji: 'ℹ️',
  },
};

export default function Toast({ 
  visible, 
  message, 
  type = 'info', 
  duration = 3000,
  onHide 
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const toastConfig = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = toastConfig.icon;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide && onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          top: insets.top + 10,
          backgroundColor: toastConfig.bg,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: toastConfig.color + '20' }]}>
          <Icon size={20} color={toastConfig.color} />
        </View>
        <Text style={[styles.message, { color: toastConfig.color }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
          <X size={18} color={toastConfig.color} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    ...SHADOWS.card,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeBtn: {
    padding: 4,
  },
});

