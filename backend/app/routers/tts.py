from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import os
import logging
from typing import Optional
from ..schemas.user import User
from ..dependencies.auth import get_current_user

router = APIRouter(prefix="/api/tts", tags=["text-to-speech"])
logger = logging.getLogger(__name__)

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default voice ID
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

@router.post("/generate")
async def generate_tts(
    text: str,
    voice_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Generate text-to-speech audio using ElevenLabs API"""
    
    if not ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="ElevenLabs API key not configured"
        )
    
    if not text or len(text.strip()) == 0:
        raise HTTPException(
            status_code=400, 
            detail="Text is required"
        )
    
    # Use provided voice_id or default
    target_voice_id = voice_id or ELEVENLABS_VOICE_ID
    
    try:
        logger.info(f"Generating TTS for user {user.id}, text length: {len(text)}")
        
        # Prepare request to ElevenLabs
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{target_voice_id}"
        
        payload = {
            "text": text,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        # Make request to ElevenLabs
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"ElevenLabs API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"TTS generation failed: {response.text}"
                )
            
            # Return the audio data as a streaming response
            return StreamingResponse(
                iter([response.content]),
                media_type="audio/mpeg",
                headers={
                    "Content-Length": str(len(response.content)),
                    "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
                }
            )
            
    except httpx.TimeoutException:
        logger.error("ElevenLabs API timeout")
        raise HTTPException(
            status_code=504,
            detail="TTS generation timed out"
        )
    except Exception as e:
        logger.error(f"Error generating TTS: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"TTS generation failed: {str(e)}"
        )

@router.get("/voices")
async def get_available_voices(user: User = Depends(get_current_user)):
    """Get available voices from ElevenLabs"""
    
    if not ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="ElevenLabs API key not configured"
        )
    
    try:
        url = f"{ELEVENLABS_BASE_URL}/voices"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"ElevenLabs voices API error: {response.status_code}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to fetch available voices"
                )
            
            return response.json()
            
    except Exception as e:
        logger.error(f"Error fetching voices: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch voices: {str(e)}"
        ) 