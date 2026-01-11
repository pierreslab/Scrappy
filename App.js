import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Camera, Trophy, User } from 'lucide-react-native';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultScreen from './screens/ResultScreen';
import StudentProfileScreen from './screens/StudentProfileScreen';
import CraftDetailScreen from './screens/CraftDetailScreen';
import CraftUploadScreen from './screens/CraftUploadScreen';
import SettingsScreen from './screens/SettingsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SplashScreen from './screens/SplashScreen';
import { CraftsProvider } from './context/CraftsContext';
import { CelebrationProvider } from './context/CelebrationContext';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { COLORS } from './data/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          borderRadius: 20,
          marginHorizontal: 10,
          marginBottom: 20,
          position: 'absolute',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 12,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconProps = { color, size: 28, strokeWidth: focused ? 3 : 2 };
          
          if (route.name === 'Home') return <Home {...iconProps} />;
          if (route.name === 'Scan') return <Camera {...iconProps} />;
          if (route.name === 'Leaderboard') return <Trophy {...iconProps} />;
          if (route.name === 'Profile') return <User {...iconProps} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen} 
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  // Set to true to require login, false to skip auth (for development/demo)
  const requireAuth = true;
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }
  
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <CraftsProvider>
            <CelebrationProvider>
              <ToastProvider>
                <NavigationContainer>
                  <StatusBar style="dark" />
                  <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {requireAuth ? (
                      // Auth flow first
                      <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        <Stack.Screen name="Main" component={TabNavigator} />
                      </>
                    ) : (
                      // Skip auth for demo
                      <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                      </>
                    )}
                    <Stack.Screen name="Result" component={ResultScreen} options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="StudentProfile" component={StudentProfileScreen} options={{ presentation: 'card' }} />
                    <Stack.Screen name="CraftDetail" component={CraftDetailScreen} options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="CraftUpload" component={CraftUploadScreen} options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'card' }} />
                  </Stack.Navigator>
                </NavigationContainer>
              </ToastProvider>
            </CelebrationProvider>
          </CraftsProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
