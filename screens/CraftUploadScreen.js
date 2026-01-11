import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SHADOWS } from '../data/theme';
import { X, Camera, Check, RotateCcw } from 'lucide-react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useCrafts } from '../context/CraftsContext';
import { useCelebration } from '../context/CelebrationContext';
import { useUser } from '../context/UserContext';
import SoundEffects from '../utils/sounds';

export default function CraftUploadScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [savedCraft, setSavedCraft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addCraft, getTotalCrafts, getTotalCraftPoints } = useCrafts();
  const { celebratePoints } = useCelebration();
  const { refreshUserData } = useUser();
  const { recipe } = route.params || {};

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setPhoto(result);
    } catch (error) {
      console.error("Photo error:", error);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  const submitCraft = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Convert photo URI to base64 if needed
      let photoBase64 = null;
      if (photo?.base64) {
        photoBase64 = `data:image/jpeg;base64,${photo.base64}`;
      } else if (photo?.uri) {
        photoBase64 = photo.uri;
      }

      const craft = await addCraft({
        name: recipe?.name || 'My Awesome Craft',
        emoji: recipe?.emoji || '🎨',
        photoUri: photoBase64,
      });

      if (craft) {
        setSavedCraft(craft);

        // Refresh user data from database (points will be updated by trigger)
        await refreshUserData();

        // Play success sound!
        SoundEffects.playSuccess();

        // Trigger celebration!
        celebratePoints(craft.points, `Amazing ${recipe?.name || 'craft'}! 🎨`);

        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting craft:', error);
      alert('Failed to submit craft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isNavigating, setIsNavigating] = useState(false);

  const handleDone = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigation.navigate('Profile');
  };

  if (submitted) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.successTitle}>You Did It!</Text>
          <Text style={styles.successSubtitle}>Your craft has been added to your collection!</Text>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardEmoji}>{savedCraft?.emoji || recipe?.emoji || '🎨'}</Text>
            <Text style={styles.rewardName}>{savedCraft?.name || recipe?.name || 'Your Craft'}</Text>
            <View style={styles.rewardPointsContainer}>
              <Text style={styles.rewardLabel}>Points Earned:</Text>
              <Text style={styles.rewardPoints}>+{savedCraft?.points || 75}</Text>
            </View>
          </View>

          <Text style={styles.addedText}>
            ✨ Added to My Creations!
          </Text>

          <View style={styles.successStats}>
            <View style={styles.successStat}>
              <Text style={styles.statValue}>{getTotalCrafts()}</Text>
              <Text style={styles.statLabel}>Total Crafts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.successStat}>
              <Text style={styles.statValue}>{getTotalCraftPoints()}</Text>
              <Text style={styles.statLabel}>Craft Points</Text>
            </View>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <PrimaryButton
            title="See My Creations 🎨"
            onPress={handleDone}
            isLoading={isNavigating}
          />
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
        <Text style={styles.permissionText}>We need camera access to capture your craft!</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {photo ? 'Preview Your Craft' : 'Take a Photo'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Camera or Preview */}
      <View style={styles.cameraContainer}>
        {photo ? (
          <View style={styles.previewContainer}>
            <View style={styles.polaroidFrame}>
              <Image source={{ uri: photo.uri }} style={styles.preview} />
              <View style={styles.polaroidFooter}>
                <Text style={styles.polaroidText}>{recipe?.name || 'My Masterpiece'}</Text>
                <Text style={styles.polaroidDate}>{new Date().toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            {isFocused && (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
              />
            )}
            {/* Viewfinder Overlay */}
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* Craft Info Overlay */}
            <View style={styles.craftInfoOverlay}>
              <Text style={styles.craftEmoji}>{recipe?.emoji || '🎨'}</Text>
              <Text style={styles.craftName}>{recipe?.name || 'Your Craft'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
        {photo ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retakeBtn} onPress={retakePhoto}>
              <RotateCcw size={24} color={COLORS.text} />
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={submitCraft}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={24} color="white" />
                  <Text style={styles.submitBtnText}>Looks Great!</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.tipText}>📸 Snap a photo of your creation!</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 32,
    margin: 10,
    marginTop: 60,
  },
  camera: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#111',
  },
  polaroidFrame: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 24,
    borderRadius: 4,
    width: '100%',
    aspectRatio: 0.85,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    transform: [{ rotate: '-2deg' }],
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  polaroidFooter: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  polaroidText: {
    fontFamily: 'System', // Ideally a handwriting font
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  polaroidDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Viewfinder
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    margin: 20,
    justifyContent: 'space-between',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(255,255,255,0.8)',
    borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },

  craftInfoOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  craftEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  craftName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    flex: 1,
  },
  controls: {
    backgroundColor: 'black',
    padding: 24,
    alignItems: 'center',
  },
  tipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  captureBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    paddingHorizontal: 10,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  retakeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
    ...SHADOWS.button,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },

  // Success Screen
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 60,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    ...SHADOWS.card,
  },
  rewardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  rewardPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  rewardPoints: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },
  addedText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  successStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    ...SHADOWS.cardSmall,
  },
  successStat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    padding: 20,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});

