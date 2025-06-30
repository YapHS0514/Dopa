import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_8e4eadd01f1343b2cbdc9dd0fa08362702caa59106533049';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'iCrDUkL56s3C8sCRl7wb';
const ELEVENLABS_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`;

/**
 * Split long text into ~300-character chunks by sentence
 */
function splitTextIntoChunks(text: string, maxLength = 300): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current += sentence + ' ';
    } else {
      if (current.trim()) chunks.push(current.trim());
      current = sentence + ' ';
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Fetch TTS audio from ElevenLabs for a given chunk of text
 */
async function fetchTTSChunk(text: string): Promise<Uint8Array> {
  const response = await fetch(ELEVENLABS_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`TTS chunk failed: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Combine multiple audio Uint8Arrays into one
 */
function combineAudioBuffers(buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    combined.set(buf, offset);
    offset += buf.length;
  }
  return combined;
}

/**
 * Save audio to file using expo-file-system
 */
async function saveAudioToFile(data: Uint8Array): Promise<string> {
  const path = FileSystem.cacheDirectory + `tts_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(path, Buffer.from(data).toString('base64'), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}

/**
 * Main function: split, fetch, combine, save, and play TTS audio for long text
 */
export async function playCombinedTTS(text: string) {
  const chunks = splitTextIntoChunks(text);
  const audioBuffers: Uint8Array[] = [];

  for (const chunk of chunks) {
    try {
      const audioData = await fetchTTSChunk(chunk);
      audioBuffers.push(audioData);
    } catch (err) {
      console.error('Failed to fetch chunk:', chunk, err);
      throw err;
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error('No audio data fetched for TTS.');
  }

  const combinedBuffer = combineAudioBuffers(audioBuffers);
  const uri = await saveAudioToFile(combinedBuffer);

  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();

  // Clean up to prevent memory leaks
  sound.setOnPlaybackStatusUpdate((status) => {
    if ('isLoaded' in status && status.isLoaded && 'didJustFinish' in status && status.didJustFinish) {
      sound.unloadAsync();
    }
  });
} 