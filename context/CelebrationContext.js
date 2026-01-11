import React, { createContext, useContext, useCallback } from 'react';
import { Alert } from 'react-native';

const CelebrationContext = createContext();

export function CelebrationProvider({ children }) {
  // Silent rewards as requested by user (no popouts)
  const celebratePoints = useCallback((points, message = '') => {
    console.log(`🎉 Points added: +${points} - ${message}`);
    // Alert.alert removed to prevent intrusive popouts
  }, []);

  const celebrateStreak = useCallback((streak) => {
    console.log(`🔥 Streak continued: ${streak} days`);
    // Alert.alert removed to prevent intrusive popouts
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebratePoints, celebrateStreak }}>
      {children}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}
