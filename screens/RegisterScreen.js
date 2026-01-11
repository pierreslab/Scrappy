import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import { Mail, Lock, Eye, EyeOff, User, School, ArrowLeft, ChevronRight, Plus, Check, BookOpen } from 'lucide-react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../utils/supabase';

const AVATAR_OPTIONS = [
  '🧑‍🎓', '👧', '👦', '🧒', '👩‍🦱', '👨‍🦱', '🧑‍🦰', '👩‍🦳',
  '🦸', '🦹', '🧙', '🧚', '🦊', '🐼', '🐨', '🦁',
  '🌱', '🌻', '🌎', '🌈', '⭐', '🔥', '💎', '🎨',
];

export default function RegisterScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { refreshUserData } = useUser();

  // Steps: 1 = Basic Info, 2 = Avatar, 3 = School, 4 = Class
  const [step, setStep] = useState(1);

  // Basic info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Avatar
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍🎓');

  // School selection
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showNewSchoolModal, setShowNewSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('');

  // Class selection
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [grade, setGrade] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      loadClasses(selectedSchool.id);
    }
  }, [selectedSchool]);

  const loadSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name');
      if (data) setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
    }
  };

  const loadClasses = async (schoolId) => {
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
    }
  };

  const createSchool = async () => {
    if (!newSchoolName.trim()) {
      setError('Please enter a school name');
      return;
    }

    setIsLoading(true);
    try {
      // Check if school already exists
      const { data: existingSchool } = await supabase
        .from('schools')
        .select('id')
        .ilike('name', newSchoolName.trim())
        .single();

      if (existingSchool) {
        setError('This school already exists! Please select it from the list.');
        return;
      }

      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: newSchoolName.trim(),
          city: newSchoolCity.trim() || null,
          province: 'Ontario',
        })
        .select()
        .single();

      if (error) throw error;

      setSchools([...schools, data]);
      setSelectedSchool(data);
      setShowNewSchoolModal(false);
      setNewSchoolName('');
      setNewSchoolCity('');
    } catch (err) {
      console.error('Create school error:', err);
      setError('Failed to create school. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createClass = async () => {
    if (!newClassName.trim()) {
      setError('Please enter a class name');
      return;
    }

    setIsLoading(true);
    try {
      // Check if class already exists
      const { data: existingClass } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', selectedSchool.id)
        .ilike('name', newClassName.trim())
        .single();

      if (existingClass) {
        setError('This class already exists! Please select it from the list.');
        return;
      }

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: newClassName.trim(),
          school_id: selectedSchool.id,
        })
        .select()
        .single();

      if (error) throw error;

      setClasses([...classes, data]);
      setSelectedClass(data);
      setShowNewClassModal(false);
      setNewClassName('');
    } catch (err) {
      console.error('Create class error:', err);
      setError('Failed to create class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep1 = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && selectedSchool) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    } else {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    if (!grade) {
      setError('Please enter your grade');
      return;
    }

    if (!selectedClass) {
      setError('Please select your class');
      return;
    }

    setIsLoading(true);
    setIsRegistering(true);
    setError('');

    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            full_name: name.trim(),
            avatar_emoji: selectedAvatar,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with class, school, and avatar
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: name.trim(),
            class_id: selectedClass.id,
            school_id: selectedSchool.id,
            avatar_emoji: selectedAvatar,
            grade: grade ? parseInt(grade) : null,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Refresh user data in context to pick up the updated profile
        console.log('Profile updated, refreshing user data...');
        await refreshUserData();

        // Navigate to onboarding
        navigation.replace('Onboarding');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setIsRegistering(false);
    } finally {
      setIsLoading(false);
      // If error occurred, we need to reset isRegistering so user can try again
      // If success, we keep it true until navigation happens
      if (error) setIsRegistering(false);
    }
  };

  // Step 1: Basic Info
  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <Image source={require('../assets/scrappy_logo.png')} style={styles.logoImage} />
        <Text style={styles.title}>Join Scrappy!</Text>
        <Text style={styles.subtitle}>Let's start with your info</Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <User size={20} color={COLORS.textLight} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor={COLORS.textLight}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Mail size={20} color={COLORS.textLight} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Lock size={20} color={COLORS.textLight} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password (6+ characters)"
            placeholderTextColor={COLORS.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={COLORS.textLight} />
            ) : (
              <Eye size={20} color={COLORS.textLight} />
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />

        <PrimaryButton
          title="Next →"
          onPress={handleNext}
        />
      </View>
    </>
  );

  // Step 2: Avatar Selection
  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmojiLarge}>{selectedAvatar}</Text>
        </View>
        <Text style={styles.title}>Pick Your Avatar</Text>
        <Text style={styles.subtitle}>Choose an emoji that represents you!</Text>
      </View>

      <View style={styles.form}>
        <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
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
        </ScrollView>

        <View style={{ height: 24 }} />

        <PrimaryButton
          title="Next →"
          onPress={handleNext}
        />
      </View>
    </>
  );

  // Step 3: School Selection
  const renderStep3 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.logo}>🏫</Text>
        <Text style={styles.title}>Your School</Text>
        <Text style={styles.subtitle}>Select or add your school</Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {schools.map((school) => (
            <TouchableOpacity
              key={school.id}
              style={[
                styles.listItem,
                selectedSchool?.id === school.id && styles.selectedItem,
              ]}
              onPress={() => setSelectedSchool(school)}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemEmoji}>🏫</Text>
                <View style={styles.listItemText}>
                  <Text style={[
                    styles.listItemTitle,
                    selectedSchool?.id === school.id && styles.selectedText,
                  ]}>
                    {school.name}
                  </Text>
                  {school.city && (
                    <Text style={styles.listItemSubtitle}>{school.city}</Text>
                  )}
                </View>
              </View>
              {selectedSchool?.id === school.id && (
                <Check size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addNewBtn}
            onPress={() => setShowNewSchoolModal(true)}
          >
            <Plus size={20} color={COLORS.primary} />
            <Text style={styles.addNewText}>Add New School</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={{ height: 24 }} />

        <PrimaryButton
          title="Next →"
          onPress={handleNext}
          disabled={!selectedSchool}
        />
      </View>

      {/* New School Modal */}
      <Modal visible={showNewSchoolModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Your School</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { paddingLeft: 0 }]}
                placeholder="School Name"
                placeholderTextColor={COLORS.textLight}
                value={newSchoolName}
                onChangeText={setNewSchoolName}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { paddingLeft: 0 }]}
                placeholder="City (optional)"
                placeholderTextColor={COLORS.textLight}
                value={newSchoolCity}
                onChangeText={setNewSchoolCity}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNewSchoolModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={createSchool}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalConfirmText}>Add School</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  // Step 4: Class Selection
  const renderStep4 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.logo}>📚</Text>
        <Text style={styles.title}>Your Class</Text>
        <Text style={styles.subtitle}>Select your class at {selectedSchool?.name}</Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Grade Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <BookOpen size={20} color={COLORS.textLight} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Your Grade (e.g., 4)"
            placeholderTextColor={COLORS.textLight}
            value={grade}
            onChangeText={setGrade}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <Text style={styles.sectionLabel}>Select Class:</Text>

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {classes.length === 0 ? (
            <Text style={styles.emptyText}>No classes yet. Add one below!</Text>
          ) : (
            classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.listItem,
                  selectedClass?.id === cls.id && styles.selectedItem,
                ]}
                onPress={() => setSelectedClass(cls)}
              >
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemEmoji}>📖</Text>
                  <View style={styles.listItemText}>
                    <Text style={[
                      styles.listItemTitle,
                      selectedClass?.id === cls.id && styles.selectedText,
                    ]}>
                      {cls.name}
                    </Text>
                  </View>
                </View>
                {selectedClass?.id === cls.id && (
                  <Check size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity
            style={styles.addNewBtn}
            onPress={() => setShowNewClassModal(true)}
          >
            <Plus size={20} color={COLORS.primary} />
            <Text style={styles.addNewText}>Add New Class</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={{ height: 24 }} />

        <PrimaryButton
          title="Create Account 🌟"
          onPress={handleRegister}
          isLoading={isLoading}
          disabled={!selectedClass}
        />
      </View>

      {/* New Class Modal */}
      <Modal visible={showNewClassModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Your Class</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { paddingLeft: 0 }]}
                placeholder="Class Name (e.g., 4B, Grade 5)"
                placeholderTextColor={COLORS.textLight}
                value={newClassName}
                onChangeText={setNewClassName}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNewClassModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={createClass}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalConfirmText}>Add Class</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  if (isRegistering) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Creating your account...</Text>
        <Text style={styles.loadingSubText}>Please wait a moment 🌱</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 4 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 4 && styles.progressDotActive]} />
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.cardSmall,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressLine: {
    width: 30,
    height: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    ...SHADOWS.card,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  listContainer: {
    maxHeight: 280,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.cardSmall,
  },
  selectedItem: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textLight,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14,
    padding: 20,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addNewText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: COLORS.textLight,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.card,
  },
  avatarEmojiLarge: {
    fontSize: 50,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 20,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.cardSmall,
  },
  selectedAvatarOption: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarOptionEmoji: {
    fontSize: 32,
  },
  selectedCheck: {
    position: 'absolute',
    top: -4,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
