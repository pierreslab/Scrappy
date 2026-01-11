import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../data/theme';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ToastContext = createContext();

const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    backgroundColor: '#DCFCE7',
    textColor: '#166534',
    iconColor: '#22C55E',
  },
  error: {
    icon: XCircle,
    backgroundColor: '#FEE2E2',
    textColor: '#991B1B',
    iconColor: '#DC2626',
  },
  warning: {
    icon: AlertCircle,
    backgroundColor: '#FEF3C7',
    textColor: '#92400E',
    iconColor: '#F59E0B',
  },
  info: {
    icon: Info,
    backgroundColor: '#DBEAFE',
    textColor: '#1E40AF',
    iconColor: '#3B82F6',
  },
};

function Toast({ message, type, visible, onHide }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

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
      onHide();
    });
  };

  if (!visible) return null;

  const toastStyle = TOAST_TYPES[type] || TOAST_TYPES.info;
  const IconComponent = toastStyle.icon;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: insets.top + 10,
          backgroundColor: toastStyle.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <IconComponent size={22} color={toastStyle.iconColor} />
      <Text style={[styles.toastText, { color: toastStyle.textColor }]}>
        {message}
      </Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    zIndex: 9999,
    ...SHADOWS.card,
  },
  toastText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
  },
});
