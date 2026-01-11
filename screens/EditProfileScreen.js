import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import { ArrowLeft, Check, ChevronDown, X } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';

const AVATAR_OPTIONS = [
  '🧑‍🎓', '👧', '👦', '🧒', '👩‍🦱', '👨‍🦱', '🧑‍🦰', '👩‍🦳',
  '🦸', '🦹', '🧙', '🧚', '🦊', '🐼', '🐨', '🦁',
  '🌱', '🌻', '🌎', '🌈', '⭐', '🔥', '💎', '🎨',
];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, loading, refreshUserData } = useUser();

  const [username, setUsername] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🧑‍🎓');
  const [isSaving, setIsSaving] = useState(false);

  // Class selection
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  useEffect(() => {
    if (user?.schoolId) {
      loadClasses(user.schoolId);
    }
  }, [user?.schoolId]);

  // Initialize selected class from user data
  useEffect(() => {
    if (user && classes.length > 0) {
      const currentClass = classes.find(c => c.name === user.class);
      if (currentClass) {
        setSelectedClass(currentClass);
      }
    }
  }, [user, classes]);

  const loadClasses = async (schoolId) => {
    setIsLoadingClasses(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name');

      if (data) setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Show loading state while user data is being fetched
  if (loading || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert("Oops!", "Please enter a username 😊");
      return;
    }

    setIsSaving(true);

    // Update user context
    setTimeout(async () => {
      try {
        // Update profile in Supabase first
        if (selectedClass && selectedClass.name !== user.class) {
          const { error } = await supabase
            .from('profiles')
            .update({
              first_name: username.trim(),
              avatar_emoji: selectedAvatar,
              class_id: selectedClass.id
            })
            .eq('id', user.id);

          if (error) throw error;

          // Refresh user data to get the new class info
          await refreshUserData();
        } else {
          // Just update name/avatar
          updateProfile(username.trim(), selectedAvatar);
        }

        setIsSaving(false);
        Alert.alert(
          "Profile Updated! 🎉",
          "Your changes have been saved!",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        console.error('Error updating profile:', error);
        setIsSaving(false);
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    }, 500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile ✏️</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Current Avatar Display */}
        <View style={styles.avatarPreview}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{selectedAvatar}</Text>
          </View>
          <Text style={styles.previewLabel}>Your Avatar</Text>
        </View>

        {/* Username Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textLight}
              maxLength={20}
            />
            <Text style={styles.charCount}>{username.length}/20</Text>
          </View>
        </View>

        {/* Avatar Selection */}
        <View style={styles.avatarSection}>
          <Text style={styles.inputLabel}>Choose Your Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((avatar, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.avatarOption,
                  selectedAvatar === avatar && styles.selectedAvatarOption,
                ]}
                onPress={() => setSelectedAvatar(avatar)}
              >
                <Text style={styles.avatarOptionEmoji}>{avatar}</Text>
                {selectedAvatar === avatar && (
                  <View style={styles.selectedCheck}>
                    <Check size={12} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Class Info */}
        <View style={styles.infoSection}>
          <Text style={styles.inputLabel}>Class</Text>
          <TouchableOpacity
            style={styles.classSelector}
            onPress={() => setShowClassModal(true)}
          >
            <View style={styles.classSelectorContent}>
              <Text style={styles.classEmoji}>🏫</Text>
              <Text style={styles.classText}>
                {selectedClass ? selectedClass.name : (user.class || "Select Class")}
              </Text>
            </View>
            <ChevronDown size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Class Selection Modal */}
      <Modal visible={showClassModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Class</Text>
              <TouchableOpacity onPress={() => setShowClassModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {isLoadingClasses ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.classList} showsVerticalScrollIndicator={false}>
                {classes.map((cls) => (
                  <TouchableOpacity
                    key={cls.id}
                    style={[
                      styles.classItem,
                      selectedClass?.id === cls.id && styles.selectedClassItem
                    ]}
                    onPress={() => {
                      setSelectedClass(cls);
                      setShowClassModal(false);
                    }}
                  >
                    <Text style={[
                      styles.classItemText,
                      selectedClass?.id === cls.id && styles.selectedClassItemText
                    ]}>{cls.name}</Text>
                    {selectedClass?.id === cls.id && (
                      <Check size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>



      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          title="Save Changes ✓"
          onPress={handleSave}
          isLoading={isSaving}
        />
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '600',
  },
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
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  avatarEmoji: {
    fontSize: 60,
  },
  previewLabel: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  avatarSection: {
    marginBottom: 24,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    ...SHADOWS.card,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedAvatarOption: {
    backgroundColor: '#DCFCE7',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarOptionEmoji: {
    fontSize: 28,
  },
  selectedCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  infoEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoNote: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  classSelector: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  classSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classEmoji: {
    fontSize: 24,
  },
  classText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  classList: {
    maxHeight: 400,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...SHADOWS.cardSmall,
  },
  selectedClassItem: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  classItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedClassItemText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

