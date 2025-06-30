from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import os
import logging
from typing import Optional, List
from ..schemas.user import User
from ..dependencies.auth import get_current_user
import re

router = APIRouter(prefix="/api/tts", tags=["text-to-speech"])
logger = logging.getLogger(__name__)

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "iCrDUkL56s3C8sCRl7wb")  # Default voice ID
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

def split_text(text: str, max_length: int) -> List[str]:
    # Split text into sentences
    sentences = re.findall(r'[^.!?]+[.!?]+', text) or [text]
    chunks = []
    current = ''
    for sentence in sentences:
        if len(current) + len(sentence) <= max_length:
            current += sentence + ' '
        else:
            if current.strip():
                chunks.append(current.strip())
            current = sentence + ' '
    if current.strip():
        chunks.append(current.strip())
    return chunks

@router.post("/generate")
async def generate_tts(
    text: str,
    voice_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Generate text-to-speech audio using ElevenLabs API, with chunking for long text"""
    
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
        
        # Split text into ~300-char chunks
        chunks = split_text(text, 300)
        logger.info(f"TTS text split into {len(chunks)} chunk(s)")
        
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{target_voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        audio_segments = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for idx, chunk in enumerate(chunks):
                payload = {
                    "text": chunk,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code != 200:
                    logger.error(f"ElevenLabs API error (chunk {idx+1}/{len(chunks)}): {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"TTS generation failed: {response.text}"
                    )
                audio_segments.append(response.content)
        # Concatenate all audio segments
        def audio_stream():
            for segment in audio_segments:
                yield segment
        total_length = sum(len(seg) for seg in audio_segments)
        return StreamingResponse(
            audio_stream(),
            media_type="audio/mpeg",
            headers={
                "Content-Length": str(total_length),
                "Cache-Control": "public, max-age=3600"
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