import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../data/theme';
import { ArrowLeft, Sparkles, Clock, Users, Lightbulb, RefreshCw, Volume2 } from 'lucide-react-native';
import PrimaryButton from '../components/PrimaryButton';
import { GOOGLE_API_KEY } from '../data/config';
import TTS from '../utils/tts';

// Step colors for visual variety
const STEP_COLORS = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#E0E7FF', '#FEE2E2', '#D1FAE5', '#DBEAFE'];
const STEP_EMOJIS = ['📦', '✂️', '🧩', '🎨', '🖍️', '⚙️', '✨', '📸'];

export default function CraftDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { recipe, imageBase64 } = route.params;

  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [instructions, setInstructions] = useState(null);
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(true);
  const [proTip, setProTip] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    generateInstructions();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const generateInstructions = async () => {
    setIsLoadingInstructions(true);
    try {
      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

      const prompt = `You are a fun, kid-friendly craft instructor! Create step-by-step instructions for making a "${recipe.name}" using these recycled materials: ${recipe.items.join(', ')}.

Return a JSON object with this EXACT format (no markdown, just pure JSON):
{
  "steps": [
    {
      "title": "Step title (fun and engaging)",
      "description": "2-3 sentence description for kids aged 8-12"
    }
  ],
  "proTip": "A fun safety or creativity tip for kids"
}

Requirements:
- Create exactly 6-8 steps
- Use simple language kids understand
- Make it fun and encouraging
- Include when to ask an adult for help
- Be specific to the actual craft and materials
- Keep descriptions 2-3 sentences max`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        }
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textContent && isMounted.current) {
        const parsed = JSON.parse(textContent);

        // Add colors and emojis to steps
        const stepsWithStyle = parsed.steps.map((step, index) => ({
          ...step,
          color: STEP_COLORS[index % STEP_COLORS.length],
          emoji: STEP_EMOJIS[index % STEP_EMOJIS.length],
        }));

        setInstructions(stepsWithStyle);
        setProTip(parsed.proTip || "Be creative and have fun! 🎨");
      }
    } catch (error) {
      console.error("Instructions generation error:", error);
      if (isMounted.current) {
        // Fallback to default instructions
        setInstructions(getDefaultInstructions());
        setProTip("Ask an adult for help with scissors! ✂️");
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingInstructions(false);
      }
    }
  };

  const getDefaultInstructions = () => {
    return [
      { title: "Gather Your Materials", description: `Collect all your recycled items: ${recipe.items.join(', ')}. Make sure they're clean and dry!`, color: "#DBEAFE", emoji: "📦" },
      { title: "Prepare Your Workspace", description: "Cover your table with newspaper or an old sheet. Get your scissors, glue, and markers ready!", color: "#D1FAE5", emoji: "🗞️" },
      { title: "Cut & Shape", description: "Carefully cut your materials into the shapes you need. Ask an adult for help with tricky cuts!", color: "#FEF3C7", emoji: "✂️" },
      { title: "Assemble", description: "Start putting the pieces together! Use glue or tape to attach them firmly.", color: "#FCE7F3", emoji: "🧩" },
      { title: "Decorate", description: "Add colors, stickers, googly eyes, or any fun decorations to make it YOUR creation!", color: "#E0E7FF", emoji: "🎨" },
      { title: "Let It Dry", description: "If you used paint or glue, let your craft dry completely. About 30 minutes!", color: "#D1FAE5", emoji: "⏳" },
      { title: "Show It Off!", description: "Your masterpiece is complete! Take a photo to share with your class! 🌟", color: "#DBEAFE", emoji: "📸" },
    ];
  };

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      // Build the prompt for realistic craft visualization
      const promptText = `Using the recycled materials shown in this photo, create a photorealistic image of a finished DIY craft project: "${recipe.name}". 

Requirements:
- Show the actual completed craft made from these exact materials: ${recipe.items.join(', ')}
- Make it look realistic and achievable, like a real photo of a finished craft project
- The craft should look handmade but polished, like something a kid could actually make
- Good lighting, clean background, professional product-style photography
- Show the craft from a clear angle so viewers can see how it was assembled`;

      // Build request parts
      const requestParts = [{ text: promptText }];

      // Add the input image for reference if available
      if (imageBase64) {
        requestParts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: imageBase64
          }
        });
      }

      // Use Google Nano Banana Pro Image Gen for high-fidelity realistic generation
      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_API_KEY}`;

      const payload = {
        contents: [{
          parts: requestParts
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      };

      console.log("Calling Gemini Image API...");
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error) {
        console.error("API Error:", data.error);
        throw new Error(data.error.message);
      }

      // Find the image part in the response (handle both camelCase and snake_case)
      const responseParts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = responseParts.find(p => p.inlineData || p.inline_data);

      if (imagePart && isMounted.current) {
        // Handle both camelCase (JS SDK) and snake_case (REST API) responses
        const imageData = imagePart.inlineData || imagePart.inline_data;
        if (imageData?.data) {
          const base64Image = imageData.data;
          const mimeType = imageData.mimeType || imageData.mime_type || 'image/png';
          setGeneratedImage(`data:${mimeType};base64,${base64Image}`);
        } else {
          throw new Error("Image data missing");
        }
      } else if (isMounted.current) {
        console.log("Response parts:", JSON.stringify(responseParts.map(p => Object.keys(p))));
        throw new Error("No image in response");
      }

    } catch (error) {
      console.error("Image Generation Error:", error);
      if (isMounted.current) {
        Alert.alert("Oops!", "Couldn't create the image right now. Try again! 🍌");
      }
    } finally {
      if (isMounted.current) {
        setIsGenerating(false);
      }
    }
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Craft Project</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleCard}>
          <Text style={styles.emoji}>{recipe.emoji}</Text>
          <Text style={styles.title}>{recipe.name}</Text>

          <View style={styles.metaRow}>
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

            <View style={styles.metaItem}>
              <Clock size={14} color={COLORS.textLight} />
              <Text style={styles.metaText}>30-45 min</Text>
            </View>

            <View style={styles.metaItem}>
              <Users size={14} color={COLORS.textLight} />
              <Text style={styles.metaText}>Ages 6+</Text>
            </View>
          </View>
        </View>

        {/* AI Image Generation Section */}
        <View style={styles.imageSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Preview Your Creation ✨</Text>
          {generatedImage ? (
            <View style={styles.generatedImageContainer}>
              <Image source={{ uri: generatedImage }} style={styles.generatedImage} />
              <View style={styles.imageOverlay}>
                <Sparkles size={14} color="white" />
                <Text style={styles.watermark}>Nano Banana Pro 🍌✨</Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              {isGenerating ? (
                <View style={styles.generatingContent}>
                  <Text style={styles.generatingEmoji}>🍌🎨</Text>
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 12 }} />
                  <Text style={styles.generatingText}>Mixing the magic paint...</Text>
                  <Text style={styles.generatingSubtext}>Almost ready to show you! 🌟</Text>
                </View>
              ) : (
                <View style={styles.placeholderContent}>
                  <View style={styles.sparkleContainer}>
                    <Sparkles size={40} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.placeholderTitle}>See What You'll Make!</Text>
                  <Text style={styles.placeholderText}>Our AI will show you what your finished craft could look like</Text>
                  <TouchableOpacity style={styles.generateBtn} onPress={generateImage}>
                    <Sparkles size={18} color="white" />
                    <Text style={styles.generateBtnText}>Show Me! ✨</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Materials List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>What You'll Need 🧰</Text>
          <View style={styles.materialsList}>
            <Text style={styles.materialsSubtitle}>Recycled Items:</Text>
            {recipe.items.map((item, index) => (
              <View key={index} style={styles.materialItem}>
                <View style={[styles.bullet, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.materialText}>{item}</Text>
                <Text style={styles.checkEmoji}>♻️</Text>
              </View>
            ))}

            <Text style={[styles.materialsSubtitle, { marginTop: 16 }]}>Craft Supplies:</Text>
            <View style={styles.materialItem}>
              <View style={[styles.bullet, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.materialText}>Scissors (kid-safe)</Text>
              <Text style={styles.checkEmoji}>✂️</Text>
            </View>
            <View style={styles.materialItem}>
              <View style={[styles.bullet, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.materialText}>Glue or Tape</Text>
              <Text style={styles.checkEmoji}>🧴</Text>
            </View>
            <View style={styles.materialItem}>
              <View style={[styles.bullet, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.materialText}>Markers or Paint</Text>
              <Text style={styles.checkEmoji}>🖍️</Text>
            </View>
            <View style={styles.materialItem}>
              <View style={[styles.bullet, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.materialText}>Your Imagination!</Text>
              <Text style={styles.checkEmoji}>💡</Text>
            </View>
          </View>
        </View>

        {/* Step by Step Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Step-by-Step Guide 📋</Text>
            <View style={styles.headerButtons}>
              {!isLoadingInstructions && (
                <TouchableOpacity
                  onPress={() => {
                    if (isSpeaking) {
                      TTS.stop();
                      setIsSpeaking(false);
                    } else if (instructions) {
                      const stepsText = instructions.map((step, i) =>
                        `Step ${i + 1}: ${step.title}. ${step.description}`
                      ).join('. ');
                      TTS.speak(stepsText, () => setIsSpeaking(true), () => setIsSpeaking(false));
                    }
                  }}
                  style={styles.readBtn}
                >
                  <Volume2 size={18} color={isSpeaking ? COLORS.primary : COLORS.textLight} />
                </TouchableOpacity>
              )}
              {!isLoadingInstructions && (
                <TouchableOpacity onPress={generateInstructions} style={styles.refreshBtn}>
                  <RefreshCw size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isLoadingInstructions ? (
            <View style={styles.loadingInstructions}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>✨ Creating custom instructions...</Text>
              <Text style={styles.loadingSubtext}>Making it perfect for your craft!</Text>
            </View>
          ) : (
            instructions?.map((step, index) => (
              <View key={index} style={[styles.stepCard, { borderLeftColor: step.color }]}>
                <View style={[styles.stepHeader, { backgroundColor: step.color }]}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Pro Tip */}
        {!isLoadingInstructions && proTip && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Lightbulb size={20} color="#CA8A04" />
              <Text style={styles.tipTitle}>Pro Tip!</Text>
            </View>
            <Text style={styles.tipText}>{proTip}</Text>
          </View>
        )}

        {/* Safety Reminder */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyEmoji}>⚠️</Text>
          <View style={styles.safetyContent}>
            <Text style={styles.safetyTitle}>Safety First!</Text>
            <Text style={styles.safetyText}>Always ask an adult for help when using scissors or sharp objects. Have fun and stay safe!</Text>
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          title="I Made This! 📸"
          onPress={() => navigation.navigate('CraftUpload', { recipe })}
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
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },

  // Title Card
  titleCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.card,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },

  // Image Section
  imageSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readBtn: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    ...SHADOWS.cardSmall,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    ...SHADOWS.cardSmall,
  },
  loadingInstructions: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  loadingSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textLight,
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    ...SHADOWS.card,
  },
  placeholderContent: {
    alignItems: 'center',
  },
  sparkleContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    ...SHADOWS.buttonSecondary,
  },
  generateBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  generatingContent: {
    alignItems: 'center',
  },
  generatingEmoji: {
    fontSize: 50,
  },
  generatingText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 20,
  },
  generatingSubtext: {
    marginTop: 8,
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: '500',
  },
  generatedImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  watermark: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },

  // Materials
  section: {
    marginBottom: 24,
  },
  materialsList: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.card,
  },
  materialsSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  materialText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  checkEmoji: {
    fontSize: 18,
  },

  // Tip Card
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  tipText: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
    fontWeight: '500',
  },

  // Steps
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderLeftWidth: 4,
    ...SHADOWS.cardSmall,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepContent: {
    padding: 14,
    paddingTop: 0,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Safety Card
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    padding: 18,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  safetyEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.background,
  },
});
