import { Audio } from 'expo-av';
import { ELEVENLABS_API_KEY } from '../data/config';

// ElevenLabs voice ID - using a friendly voice
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - friendly and clear

let currentSound = null;
let isSpeaking = false;

// Stop any currently playing audio
export const stopSpeaking = async () => {
    if (currentSound) {
        try {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
        } catch (e) {
            console.log('Error stopping speech:', e);
        }
        currentSound = null;
    }
    isSpeaking = false;
};

// Check if currently speaking
export const isCurrentlySpeaking = () => isSpeaking;

// Speak text using ElevenLabs API
export const speakWithElevenLabs = async (text, onStart, onComplete) => {
    if (!text || text.trim().length === 0) return;

    // Stop any current playback
    await stopSpeaking();

    try {
        isSpeaking = true;
        if (onStart) onStart();

        // Set audio mode for iOS
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });

        // Call ElevenLabs API directly
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.5,
                        use_speaker_boost: true,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API error:', errorText);
            throw new Error('TTS API failed');
        }

        // Get audio as blob/arraybuffer
        const audioData = await response.arrayBuffer();
        const base64Audio = arrayBufferToBase64(audioData);

        // Create and play the sound
        const { sound } = await Audio.Sound.createAsync(
            { uri: `data:audio/mpeg;base64,${base64Audio}` },
            { shouldPlay: true, volume: 1.0 }
        );

        currentSound = sound;

        // Handle playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                isSpeaking = false;
                currentSound = null;
                if (onComplete) onComplete();
                sound.unloadAsync();
            }
        });

    } catch (error) {
        console.error('ElevenLabs TTS error:', error);
        isSpeaking = false;
        if (onComplete) onComplete();
    }
};

// Helper to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export default {
    speak: speakWithElevenLabs,
    stop: stopSpeaking,
    isSpeaking: isCurrentlySpeaking,
};
