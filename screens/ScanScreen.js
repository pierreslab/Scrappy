import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import * as Speech from 'expo-speech';
import { X, Camera, Sparkles } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import SoundEffects from '../utils/sounds';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_SIZE = 300; // Bigger viewfinder

const FUN_FACTS = [
  "Recycling one aluminum can saves enough energy to power a TV for 3 hours! 📺",
  "A glass bottle can take up to 1 million years to decompose in a landfill. ⏳",
  "Recycling 1 ton of paper saves 17 trees and 7,000 gallons of water! 🌳",
  "Plastic bottles can be recycled into clothing, like t-shirts and jackets! 👕",
  "Aluminum can be recycled forever without losing its quality! ♾️",
  "Recycling one glass bottle saves enough energy to power a lightbulb for 4 hours! 💡",
];

export default function ScanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [mode, setMode] = useState(route.params?.mode || 'recycle');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [currentFact, setCurrentFact] = useState(FUN_FACTS[0]);

  // Update mode if coming from navigation with a mode param
  useEffect(() => {
    if (route.params?.mode) {
      setMode(route.params.mode);
    }
  }, [route.params?.mode]);

  // Rotate fun facts during scanning
  useEffect(() => {
    let interval;
    if (scanning) {
      setCurrentFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
      interval = setInterval(() => {
        setCurrentFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleScan = async () => {
    if (!cameraRef.current) return;
    setScanning(true);

    try {
      SoundEffects.playScanning();
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });

      // Calculate crop area (center of image, square)
      const imgWidth = photo.width;
      const imgHeight = photo.height;

      // The viewfinder is centered, so crop the center portion
      const cropSize = Math.min(imgWidth, imgHeight) * 0.7; // 70% of the smaller dimension
      const originX = (imgWidth - cropSize) / 2;
      const originY = (imgHeight - cropSize) / 2;

      // Crop the image to just the viewfinder area
      const croppedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: originX,
              originY: originY,
              width: cropSize,
              height: cropSize,
            },
          },
          { resize: { width: 512, height: 512 } }, // Resize for faster upload
        ],
        { base64: true, compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      navigation.navigate('Result', {
        imageBase64: croppedImage.base64,
        mode: mode,
        accessibilityMode: accessibilityMode
      });
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setScanning(false);
    }
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    if (accessibilityMode) {
      Speech.speak(`Switched to ${newMode === 'recycle' ? 'Recycle Check' : 'Trash to Treasure'} mode.`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {isFocused && permission && permission.granted ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            {/* Viewfinder Frame */}
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanHint}>
                {scanning ? "✨ Analyzing..." : "📷 Point at an item"}
              </Text>
              {scanning && (
                <View style={styles.factContainer}>
                  <Text style={styles.factTitle}>Eco Fun Fact:</Text>
                  <Text style={styles.factText}>{currentFact}</Text>
                </View>
              )}
            </View>
          </CameraView>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <View style={styles.placeholderIcon}>
              <Camera size={48} color="#6B7280" />
            </View>
            <Text style={styles.placeholderTitle}>
              {permission && !permission.granted ? "Camera Access Needed" : "Starting Camera..."}
            </Text>
            <Text style={styles.placeholderSubtitle}>
              We need your camera to scan items
            </Text>
            {permission && !permission.granted && (
              <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                <Text style={styles.permissionBtnText}>Enable Camera</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Top Controls */}
      <View style={[styles.topBar, { top: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <X size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'recycle' && styles.modeBtnActive]}
            onPress={() => toggleMode('recycle')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeBtnEmoji}>♻️</Text>
            <Text style={[styles.modeBtnText, mode === 'recycle' && styles.modeBtnTextActive]}>Recycle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'craft' && styles.modeBtnActive]}
            onPress={() => toggleMode('craft')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeBtnEmoji}>🎨</Text>
            <Text style={[styles.modeBtnText, mode === 'craft' && styles.modeBtnTextActive]}>Craft</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.accessBtn, accessibilityMode && styles.accessBtnActive]}
          onPress={() => {
            setAccessibilityMode(!accessibilityMode);
            Speech.speak(accessibilityMode ? "Audio mode off" : "Audio mode on");
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.accessIcon}>🗣️</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 24 }]}>
        {/* Mode Description */}
        <View style={styles.modeDescription}>
          <Text style={styles.modeDescEmoji}>{mode === 'recycle' ? '♻️' : '✨'}</Text>
          <Text style={styles.modeDescText}>
            {mode === 'recycle'
              ? "Scan to check if it's recyclable"
              : "Scan to get DIY craft ideas"}
          </Text>
        </View>

        {/* Capture Button */}
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleScan}
          disabled={scanning}
          activeOpacity={0.8}
        >
          <View style={[styles.captureBtnInner, scanning && styles.captureBtnScanning]}>
            {scanning ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Sparkles size={28} color={COLORS.primary} />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.captureHint}>Tap to scan</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },

  // Viewfinder
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderWidth: 0,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  factContainer: {
    position: 'absolute',
    bottom: -120,
    left: -20,
    right: -20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  factTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  factText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
    borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  scanHint: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 24,
    overflow: 'hidden',
  },

  // Placeholder
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  placeholderTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.cardSmall,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 5,
    ...SHADOWS.cardSmall,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeBtnEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  modeBtnText: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: 14,
  },
  modeBtnTextActive: {
    color: 'white',
  },
  accessBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.cardSmall,
  },
  accessBtnActive: {
    backgroundColor: COLORS.accent,
  },
  accessIcon: {
    fontSize: 22,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  modeDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 20,
  },
  modeDescEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  modeDescText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  captureBtnInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  captureBtnScanning: {
    borderColor: COLORS.textLight,
  },
  captureHint: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    fontWeight: '600',
    fontSize: 13,
  },
});
