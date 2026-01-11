import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global sound enabled state
let soundEnabled = true;

// Load saved preference
const loadSoundPreference = async () => {
    try {
        const saved = await AsyncStorage.getItem('soundEffectsEnabled');
        if (saved !== null) {
            soundEnabled = saved === 'true';
        }
    } catch (e) {
        console.log('Error loading sound preference:', e);
    }
};

// Initialize on load
loadSoundPreference();

// Initialize audio mode for iOS
const initAudio = async () => {
    try {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });
    } catch (e) {
        console.log('Audio init error:', e);
    }
};

// Generate a WAV data URI for a sine wave tone
const generateToneDataUri = (frequency, durationMs) => {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * durationMs / 1000);
    const numChannels = 1;
    const bitsPerSample = 16;

    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, numSamples * 2, true);

    const samples = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const fadeOut = 1 - (i / numSamples);
        const sample = Math.sin(2 * Math.PI * frequency * t) * 32767 * fadeOut * 0.5;
        samples[i] = Math.floor(sample);
    }

    const wavBuffer = new Uint8Array(44 + numSamples * 2);
    wavBuffer.set(new Uint8Array(header), 0);
    wavBuffer.set(new Uint8Array(samples.buffer), 44);

    let binary = '';
    for (let i = 0; i < wavBuffer.length; i++) {
        binary += String.fromCharCode(wavBuffer[i]);
    }

    return 'data:audio/wav;base64,' + btoa(binary);
};

// Play a sound
const playSound = async (frequency = 800, duration = 150) => {
    if (!soundEnabled) return; // Check if sounds are enabled

    try {
        await initAudio();

        const { sound } = await Audio.Sound.createAsync(
            { uri: generateToneDataUri(frequency, duration) },
            { shouldPlay: true, volume: 1.0 }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (e) {
        console.log('Sound error:', e);
    }
};

// Play the nice "you did it" melody
const playSuccessMelody = async () => {
    if (!soundEnabled) return; // Check if sounds are enabled

    try {
        await initAudio();

        const notes = [
            { frequency: 523, duration: 100 },  // C5
            { frequency: 659, duration: 100 },  // E5
            { frequency: 784, duration: 180 },  // G5
        ];

        let delay = 0;
        for (const { frequency, duration } of notes) {
            setTimeout(() => {
                if (soundEnabled) playSound(frequency, duration);
            }, delay);
            delay += duration * 0.7;
        }
    } catch (e) {
        console.log('Melody error:', e);
    }
};

// Exported sound functions
export const SoundEffects = {
    init: initAudio,

    // Enable/disable sounds
    setEnabled: async (enabled) => {
        soundEnabled = enabled;
        try {
            await AsyncStorage.setItem('soundEffectsEnabled', enabled ? 'true' : 'false');
        } catch (e) {
            console.log('Error saving sound preference:', e);
        }
    },

    // Check if sounds are enabled
    isEnabled: () => soundEnabled,

    // No scanning beep
    playScanning: () => { },

    // Success melody - for crafts
    playSuccess: playSuccessMelody,

    // Points earned - use the nice melody
    playPoints: playSuccessMelody,

    // Badge unlocked - use the nice melody
    playBadge: playSuccessMelody,

    // No tap sound
    playTap: () => { },

    // Challenge complete - use the nice melody
    playComplete: playSuccessMelody,

    // No error sound
    playError: () => { },

    // No streak sound
    playStreak: () => { },
};

export default SoundEffects;
