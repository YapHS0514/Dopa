# ElevenLabs TTS Integration Setup

## 🎯 Overview

This guide explains how to set up the ElevenLabs Text-to-Speech integration for dynamic AI voice narration.

## 🔧 Backend Setup

### 1. Environment Variables

Add the following environment variables to your backend:

```bash
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Optional: Default voice ID
```

### 2. Get ElevenLabs API Key

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Go to your profile settings
3. Copy your API key
4. Add it to your environment variables

### 3. Install Dependencies

The required dependencies are already in `requirements.txt`:

- `httpx==0.24.1` - For making HTTP requests to ElevenLabs API

### 4. Backend Endpoints

The following endpoints are now available:

- `POST /api/tts/generate` - Generate TTS audio

  - Query params: `text` (required), `voice_id` (optional)
  - Returns: Audio blob (MP3 format)

- `GET /api/tts/voices` - Get available voices
  - Returns: List of available ElevenLabs voices

## 🎨 Frontend Features

### Text Content Narration

- **Listen Button**: Tap to start AI voice narration
- **Loading State**: Shows hourglass icon while generating audio
- **Playing State**: Shows volume-high icon in gold when playing
- **Auto-Stop**: Narration stops when scrolling to different content
- **Single Audio**: Only one narration plays at a time

### Visual Feedback

- **Text Content**:

  - ⏳ Loading: `hourglass-outline` icon in gold
  - 🔊 Playing: `volume-high` icon in gold
  - ⚪ Idle: `volume-medium` icon in default color

- **Video Content**:
  - 🔴 Muted: `volume-mute` icon in red
  - 🟢 Unmuted: `volume-high` icon in green

## 🚀 Usage

### For Users

1. Navigate to any text content in the feed
2. Tap the sound button (volume icon)
3. Wait for audio generation (hourglass icon)
4. Listen to AI-generated narration
5. Tap again to stop, or scroll to different content

### For Developers

The integration uses:

- **Zustand Store**: `useTTSAudioStore` for state management
- **API Client**: `apiClient.generateTTS()` for backend calls
- **Expo Audio**: For audio playback
- **Auto-cleanup**: Stops audio when switching content

## 🔍 Technical Details

### Audio Flow

1. User taps listen button
2. Frontend calls `/api/tts/generate` with content text
3. Backend calls ElevenLabs API with text
4. ElevenLabs returns MP3 audio blob
5. Backend streams audio back to frontend
6. Frontend converts blob to data URL
7. Expo Audio plays the narration
8. Auto-stops when content changes or user taps again

### State Management

- **Currently Playing**: Tracks which content is being narrated
- **Loading State**: Shows generation progress
- **Audio Reference**: Manages Expo Audio instance
- **Auto-cleanup**: Stops audio on navigation/content change

## 🐛 Troubleshooting

### Common Issues

1. **"ElevenLabs API key not configured"**
   - Check that `ELEVENLABS_API_KEY` is set in environment
2. **"Permission to use speaker denied"**
   - User needs to grant audio permissions
3. **"TTS generation failed"**
   - Check ElevenLabs API key validity
   - Verify internet connection
   - Check ElevenLabs account credits

### Debug Logging

Enable debug logs to see:

- TTS generation requests
- Audio playback status
- State changes
- Error details

## 📝 Notes

- Audio is cached for 1 hour to reduce API calls
- Only one narration plays at a time across the app
- Audio automatically stops when navigating away
- Supports all ElevenLabs voices (configurable via voice_id)
