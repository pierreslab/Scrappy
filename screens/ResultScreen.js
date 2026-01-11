import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import PrimaryButton from '../components/PrimaryButton';
import { analyzeImageWithGemini } from '../utils/gemini';
import * as Speech from 'expo-speech';
import { ArrowLeft, CheckCircle, Sparkles, Scan, Brain, Leaf, Volume2 } from 'lucide-react-native';
import { useCelebration } from '../context/CelebrationContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { createScan, uploadScanImage } from '../utils/supabase';
import SoundEffects from '../utils/sounds';
import TTS from '../utils/tts';

const FUN_FACTS = [
  { emoji: '🌳', fact: 'Recycling 1 ton of paper saves 17 trees!' },
  { emoji: '💡', fact: 'A glass bottle takes 1 million years to decompose!' },
  { emoji: '🎮', fact: 'Recycling 1 bottle saves enough energy for 25 min of gaming!' },
  { emoji: '🐢', fact: '100,000 marine animals die from plastic each year.' },
  { emoji: '🏠', fact: 'Recycled aluminum can return to shelves in 60 days!' },
  { emoji: '📱', fact: '1 million phones can recover 35,000 lbs of copper!' },
  { emoji: '🍕', fact: 'Americans throw away 25% of food they buy!' },
  { emoji: '🚗', fact: 'Recycling 1 can saves gas to drive 3 miles!' },
];

const SCAN_STEPS = [
  { icon: Scan, label: 'Capturing image...' },
  { icon: Brain, label: 'AI analyzing...' },
  { icon: Leaf, label: 'Finding eco-info...' },
];

export default function ResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { celebratePoints } = useCelebration();
  const { user, refreshUserData } = useUser();
  const { profile } = useAuth();
  const { imageBase64, mode, accessibilityMode } = route.params;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset state when new image comes in
    setLoading(true);
    setData(null);
    setCurrentStep(0);
    setCurrentFact(0);

    analyzeImage();
    startAnimations();

    // Rotate through steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % SCAN_STEPS.length);
    }, 1500);

    // Rotate through facts
    const factInterval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentFact(prev => (prev + 1) % FUN_FACTS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 3000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(factInterval);
    };
  }, [imageBase64, mode]);

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  };

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      Speech.stop();
    };
  }, []);

  const analyzeImage = async () => {
    try {
      const result = await analyzeImageWithGemini(imageBase64, mode);
      if (!isMounted.current) return;
      setData(result);

      // Save scan to database for recycling mode
      if (mode === 'recycle' && result.points && user && user.id !== 'no-user') {
        try {
          // Upload image to Supabase storage
          const imageUrl = await uploadScanImage(user.id, imageBase64);
          if (!isMounted.current) return;

          // Create scan record (triggers will handle points, badges, etc.)
          await createScan(user.id, {
            material_type: result.item || 'unknown',
            points_earned: result.points,
            image_url: imageUrl,
            bin_type: (result.bin || 'blue').toLowerCase().replace(' bin', '').trim(),
            school_id: user.schoolId,
            gemini_response: result,
          });

          // Refresh user data to get updated points/stats from database
          try {
            await refreshUserData();
          } catch (e) {
            console.log('Error refreshing user data:', e);
          }

          if (!isMounted.current) return;

          // Celebrate!
          setTimeout(() => {
            if (isMounted.current) {
              SoundEffects.playPoints();
              celebratePoints(result.points, result.recyclable ? "Great recycling! 🌍" : "Thanks for checking! ♻️");
            }
          }, 500);
        } catch (error) {
          console.error('Error saving scan:', error);
          if (!isMounted.current) return;
          // Still show celebration even if save fails
          setTimeout(() => {
            if (isMounted.current) {
              celebratePoints(result.points, result.recyclable ? "Great recycling! 🌍" : "Thanks for checking! ♻️");
            }
          }, 500);
        }
      }

      if (accessibilityMode && isMounted.current) {
        if (mode === 'recycle') {
          Speech.speak(`I see ${result.item}. ${result.description} You earned ${result.points} points.`);
        } else {
          const projectNames = result.recipes.map(r => r.name).join(', ');
          Speech.speak(`I found some items. You can make: ${projectNames}.`);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const [isNavigating, setIsNavigating] = useState(false);

  // Read aloud function using ElevenLabs
  const readAloud = async () => {
    if (isSpeaking) {
      await TTS.stop();
      setIsSpeaking(false);
      return;
    }

    if (!data) return;

    let textToSpeak = '';
    if (mode === 'recycle') {
      const binName = data.bin === 'blue' ? 'blue recycling bin' :
        data.bin === 'green' ? 'green compost bin' :
          data.bin === 'black' ? 'trash bin' : 'special disposal';
      textToSpeak = `This is a ${data.item}. Put it in the ${binName}. ${data.description}. ${data.impact}. You earned ${data.points} points!`;
    } else if (data.recipes && data.recipes.length > 0) {
      const recipe = data.recipes[0];
      textToSpeak = `You can make a ${recipe.name}! You'll need: ${recipe.items.join(', ')}. It's ${recipe.difficulty} difficulty.`;
    }

    if (textToSpeak) {
      await TTS.speak(
        textToSpeak,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  // Auto-read in accessibility mode
  useEffect(() => {
    if (accessibilityMode && data && !loading) {
      readAloud();
    }
  }, [data, loading, accessibilityMode]);

  const handleDone = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    try {
      // Stop any ongoing speech
      TTS.stop();
      Speech.stop();
    } catch (e) {
      console.log('Error stopping speech:', e);
    }

    // Navigate back to Home tab
    // Use a small timeout to allow speech to stop cleanly
    setTimeout(() => {
      navigation.navigate('Main', { screen: 'Home' });
    }, 100);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160]
  });

  if (loading) {
    const StepIcon = SCAN_STEPS[currentStep].icon;

    return (
      <View style={styles.loadingContainer}>
        {/* Background decorations */}
        <View style={styles.loadingDecor1} />
        <View style={styles.loadingDecor2} />
        <Animated.View style={[styles.loadingDecor3, { transform: [{ rotate: spin }] }]} />

        {/* Image Preview with Scan Effect */}
        <View style={styles.scanPreviewContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
            style={styles.scanPreviewImage}
            blurRadius={2}
          />
          <View style={styles.scanOverlay}>
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] }
              ]}
            />
          </View>
          <View style={styles.scanCorners}>
            <View style={[styles.scanCorner, styles.scanCornerTL]} />
            <View style={[styles.scanCorner, styles.scanCornerTR]} />
            <View style={[styles.scanCorner, styles.scanCornerBL]} />
            <View style={[styles.scanCorner, styles.scanCornerBR]} />
          </View>
        </View>

        {/* Current Step */}
        <View style={styles.stepContainer}>
          <Animated.View style={[styles.stepIconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <StepIcon size={28} color="white" />
          </Animated.View>
          <Text style={styles.stepText}>{SCAN_STEPS[currentStep].label}</Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {SCAN_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotComplete
              ]}
            />
          ))}
        </View>

        {/* Fun Fact Card */}
        <Animated.View style={[styles.factCard, { opacity: fadeAnim }]}>
          <Text style={styles.factEmoji}>{FUN_FACTS[currentFact].emoji}</Text>
          <View style={styles.factContent}>
            <Text style={styles.factLabel}>Did you know?</Text>
            <Text style={styles.factText}>{FUN_FACTS[currentFact].fact}</Text>
          </View>
        </Animated.View>

        {/* Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>💡 Tip: Clean containers before recycling!</Text>
        </View>
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'recycle' ? 'Scan Results ♻️' : 'Craft Ideas 🎨'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <View style={styles.imageBorder}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
              style={styles.imagePreview}
            />
          </View>
          <View style={styles.successBadge}>
            <CheckCircle size={20} color="white" />
            <Text style={styles.successText}>Scanned!</Text>
          </View>
        </View>

        {mode === 'recycle' ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>✅</Text>
            <Text style={styles.resultTitle}>{data.item}</Text>

            <View style={[
              styles.binBadge,
              data.bin === 'green' && { backgroundColor: '#DCFCE7' },
              data.bin === 'black' && { backgroundColor: '#F3F4F6' },
              data.bin === 'special' && { backgroundColor: '#FEF3C7' },
            ]}>
              <Text style={[
                styles.binText,
                data.bin === 'green' && { color: '#166534' },
                data.bin === 'black' && { color: '#1F2937' },
                data.bin === 'special' && { color: '#92400E' },
              ]}>
                {data.bin === 'blue' ? '♻️ Blue Bin' :
                  data.bin === 'green' ? '🥬 Green Bin' :
                    data.bin === 'black' ? '🗑️ Trash' :
                      data.bin === 'special' ? '⚠️ Special' : '❓ Unknown'}
              </Text>
            </View>

            <Text style={styles.resultDesc}>{data.description}</Text>

            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>You earned</Text>
              <Text style={styles.pointsValue}>+{data.points} pts 🌟</Text>
            </View>

            <View style={styles.impactCard}>
              <Text style={styles.impactTitle}>🌍 Your Impact</Text>
              <Text style={styles.impactText}>{data.impact}</Text>
            </View>

            {/* Read Aloud Button */}
            <TouchableOpacity style={styles.readAloudBtn} onPress={readAloud} activeOpacity={0.7}>
              <Volume2 size={20} color={isSpeaking ? COLORS.primary : COLORS.text} />
              <Text style={[styles.readAloudText, isSpeaking && { color: COLORS.primary }]}>
                {isSpeaking ? 'Stop Reading' : 'Read Aloud 🔊'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.craftContainer}>
            <Text style={styles.craftTitle}>Trash to Treasure! ✨</Text>
            <Text style={styles.craftSubtitle}>Here are some fun projects you can make:</Text>

            {data.recipes.map((recipe, index) => (
              <View key={index} style={styles.recipeCard}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    <View style={[
                      styles.difficultyBadge,
                      recipe.difficulty === 'Easy' && { backgroundColor: '#D1FAE5' },
                      recipe.difficulty === 'Medium' && { backgroundColor: '#FEF3C7' },
                      recipe.difficulty === 'Hard' && { backgroundColor: '#FEE2E2' },
                    ]}>
                      <Text style={[
                        styles.difficultyText,
                        recipe.difficulty === 'Easy' && { color: '#16A34A' },
                        recipe.difficulty === 'Medium' && { color: '#CA8A04' },
                        recipe.difficulty === 'Hard' && { color: '#DC2626' },
                      ]}>{recipe.difficulty}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.recipeItems}>
                  Materials: {recipe.items.join(' • ')}
                </Text>
                <TouchableOpacity
                  style={styles.tryItBtn}
                  onPress={() => {
                    navigation.navigate('CraftDetail', { recipe, imageBase64 });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tryItText}>See Instructions 📝</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          title="Done 🎉"
          onPress={handleDone}
          isLoading={isNavigating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background, // Match app theme
    padding: 24,
  },
  loadingDecor1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  loadingDecor2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.secondary,
    opacity: 0.15,
  },
  loadingDecor3: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    opacity: 0.2,
  },

  // Scan Preview
  scanPreviewContainer: {
    width: 200,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
    backgroundColor: 'white',
    padding: 6,
    ...SHADOWS.card,
  },
  scanPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    borderRadius: 18,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  scanCorners: {
    ...StyleSheet.absoluteFillObject,
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
  },
  scanCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.primary,
    borderWidth: 4,
  },
  scanCornerTL: { top: 6, left: 6, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  scanCornerTR: { top: 6, right: 6, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  scanCornerBL: { bottom: 6, left: 6, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  scanCornerBR: { bottom: 6, right: 6, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },

  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...SHADOWS.button,
  },
  stepText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  // Progress Dots
  progressDots: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: COLORS.primaryLight,
  },

  // Fun Fact Card
  factCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.card,
  },
  factEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  factContent: {
    flex: 1,
  },
  factLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  factText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 22,
  },

  // Tip
  tipContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tipText: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.cardSmall,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  // Content
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageBorder: {
    padding: 6,
    backgroundColor: 'white',
    borderRadius: 28,
    ...SHADOWS.card,
  },
  imagePreview: {
    width: 180,
    height: 180,
    borderRadius: 22,
  },
  successBadge: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...SHADOWS.button,
  },
  successText: {
    color: 'white',
    fontWeight: '800',
    marginLeft: 6,
  },

  // Recycle Result
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  binBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  binText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 16,
  },
  resultDesc: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  pointsContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    width: '100%',
  },
  pointsLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 4,
  },
  impactCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    marginTop: 20,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6,
  },
  impactText: {
    color: '#166534',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  readAloudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  readAloudText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },

  // Craft Results
  craftContainer: {
    alignItems: 'center',
  },
  craftTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  craftSubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    marginBottom: 16,
    ...SHADOWS.card,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeEmoji: {
    fontSize: 40,
    marginRight: 14,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recipeItems: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  tryItBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    zIndex: 10,
  },
  tryItText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
});
