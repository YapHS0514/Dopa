from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from ..schemas.content import ContentRequest
from ..schemas.user import User, UserRole
from ..dependencies.auth import get_current_user, require_role
from ..services.supabase import get_supabase_client, get_supabase_admin_client
import logging

router = APIRouter(prefix="/api/contents", tags=["contents"])
logger = logging.getLogger(__name__)

@router.get("")
async def get_contents(
    limit: int = 20,
    offset: int = 0,
    topic_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get personalized content based on user's topic preferences, excluding already-interacted content"""
    try:
        logger.info(f"Fetching personalized content for auth user {user.id}")
        supabase = get_supabase_client()
        
        # Step 1: Get user's preferred topics (points > 50)
        logger.info("Step 1: Getting user's preferred topics with points > 50")
        prefs_response = supabase.table("user_topic_preferences").select(
            "topic_id, points"
        ).eq("user_id", user.id).gte("points", 50).execute()
        
        logger.info(f"User preferences response: {prefs_response.data}")
        
        preferred_topic_ids = [pref["topic_id"] for pref in prefs_response.data] if prefs_response.data else []
        logger.info(f"Preferred topic IDs: {preferred_topic_ids}")
        
        # Step 2: Get content IDs that user has already interacted with (to exclude them)
        logger.info("Step 2: Getting content IDs user has already interacted with")
        interactions_response = supabase.table("user_interactions").select(
            "content_id"
        ).eq("user_id", user.id).execute()
        
        interacted_content_ids = list(set([
            interaction["content_id"] for interaction in interactions_response.data
        ])) if interactions_response.data else []
        
        logger.info(f"User has interacted with {len(interacted_content_ids)} pieces of content")
        
        # Enhanced logging: Show sample of interacted content IDs for verification
        if interacted_content_ids:
            sample_interacted = interacted_content_ids[:5]  # Show first 5 for brevity
            logger.info(f"📋 Sample interacted content IDs: {sample_interacted}{'...' if len(interacted_content_ids) > 5 else ''}")
        else:
            logger.info("📋 No previous interactions found - user will see all available content")
        
        if not preferred_topic_ids:
            # If user has no preferences with >50 points, return general content (excluding interacted)
            logger.info("No preferred topics found, returning general content (excluding interacted)")
            if interacted_content_ids:
                # Use NOT IN to exclude interacted content
                logger.info(f"🔍 Applying NOT IN filter to exclude {len(interacted_content_ids)} interacted content pieces")
                response = supabase.table("contents").select(
                    "id, title, summary, content_type, media_url, source_url, created_at"
                ).not_.in_("id", interacted_content_ids).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                logger.info(f"✅ Filter applied successfully - query excluded {len(interacted_content_ids)} content pieces")
            else:
                # No interactions yet, return all content
                logger.info("🆕 No interactions to filter - returning all available content")
                response = supabase.table("contents").select(
                    "id, title, summary, content_type, media_url, source_url, created_at"
                ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        else:
            # Step 3: Get content IDs linked to preferred topics via content_topics
            logger.info("Step 3: Getting content IDs for preferred topics")
            content_topics_response = supabase.table("content_topics").select(
                "content_id"
            ).in_("topic_id", preferred_topic_ids).execute()
            
            logger.info(f"Content-topics response: {content_topics_response.data}")
            
            preferred_content_ids = list(set([
                ct["content_id"] for ct in content_topics_response.data
            ])) if content_topics_response.data else []
            
            logger.info(f"Preferred content IDs: {preferred_content_ids}")
            
            if not preferred_content_ids:
                # If no content found for preferred topics, return general content (excluding interacted)
                logger.info("No content found for preferred topics, returning general content (excluding interacted)")
                if interacted_content_ids:
                    logger.info(f"🔍 Fallback: Applying NOT IN filter to exclude {len(interacted_content_ids)} interacted content pieces")
                    response = supabase.table("contents").select(
                        "id, title, summary, content_type, media_url, source_url, created_at"
                    ).not_.in_("id", interacted_content_ids).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                    logger.info(f"✅ Fallback filter applied successfully")
                else:
                    logger.info("🆕 Fallback: No interactions to filter - returning all available content")
                    response = supabase.table("contents").select(
                        "id, title, summary, content_type, media_url, source_url, created_at"
                    ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            else:
                # Step 4: Filter out interacted content from preferred content
                logger.info("Step 4: Filtering preferred content to exclude interacted content")
                
                # Log the filtering process in detail
                filtered_out_content = [
                    content_id for content_id in preferred_content_ids 
                    if content_id in interacted_content_ids
                ]
                logger.info(f"🚫 Filtering out {len(filtered_out_content)} preferred content pieces user has already seen")
                if filtered_out_content:
                    sample_filtered = filtered_out_content[:3]
                    logger.info(f"🚫 Sample filtered content IDs: {sample_filtered}{'...' if len(filtered_out_content) > 3 else ''}")
                
                # Remove interacted content from preferred content list
                fresh_preferred_content_ids = [
                    content_id for content_id in preferred_content_ids 
                    if content_id not in interacted_content_ids
                ]
                
                logger.info(f"Fresh preferred content IDs (excluding interacted): {len(fresh_preferred_content_ids)} out of {len(preferred_content_ids)}")
                
                if not fresh_preferred_content_ids:
                    # User has interacted with all preferred content, fall back to general content (excluding interacted)
                    logger.info("User has interacted with all preferred content, falling back to general content")
                    if len(interacted_content_ids) < 1000:  # Safety check to prevent excluding too much content
                        logger.info(f"🔍 Complete fallback: Applying NOT IN filter to exclude {len(interacted_content_ids)} interacted content pieces")
                        response = supabase.table("contents").select(
                            "id, title, summary, content_type, media_url, source_url, created_at"
                        ).not_.in_("id", interacted_content_ids).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                        logger.info(f"✅ Complete fallback filter applied successfully")
                    else:
                        # If user has interacted with too much content, just return latest content
                        logger.warning("User has interacted with too much content, returning latest content without filtering")
                        logger.warning(f"⚠️ FILTERING DISABLED - user has {len(interacted_content_ids)} interactions (>1000 limit)")
                        response = supabase.table("contents").select(
                            "id, title, summary, content_type, media_url, source_url, created_at"
                        ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                else:
                    # Get fresh preferred content
                    logger.info(f"✅ Serving {len(fresh_preferred_content_ids)} fresh preferred content pieces")
                    if fresh_preferred_content_ids:
                        sample_fresh = fresh_preferred_content_ids[:3]
                        logger.info(f"📋 Sample fresh content IDs: {sample_fresh}{'...' if len(fresh_preferred_content_ids) > 3 else ''}")
                    response = supabase.table("contents").select(
                        "id, title, summary, content_type, media_url, source_url, created_at"
                    ).in_("id", fresh_preferred_content_ids).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        logger.info(f"Final content response: {response.data}")
        
        # 🔍 VERIFICATION: Check that returned content doesn't contain any interacted content
        returned_content_ids = [content["id"] for content in response.data] if response.data else []
        logger.info(f"📋 Returned content IDs: {returned_content_ids}")
        
        # Verify no overlap between returned and interacted content
        overlap = set(returned_content_ids) & set(interacted_content_ids)
        if overlap:
            logger.error(f"❌ FILTERING FAILED! Found overlap between returned and interacted content: {list(overlap)}")
            logger.error(f"❌ This indicates the NOT IN filtering is not working properly!")
        else:
            logger.info(f"✅ FILTERING VERIFIED! No overlap between returned ({len(returned_content_ids)}) and interacted ({len(interacted_content_ids)}) content")
            if returned_content_ids and interacted_content_ids:
                logger.info(f"✅ Filtering effectiveness: Successfully excluded {len(interacted_content_ids)} pieces, served {len(returned_content_ids)} fresh pieces")
        
        # Transform the data to match the expected frontend format
        transformed_data = []
        for content in response.data:
            media_url = content.get("media_url", "")
            content_type = content.get("content_type", "text")
            
            # Determine if this is video content based on media_url file extension
            is_video = media_url and any(media_url.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.webm', '.m4v'])
            
            # Handle carousel content type
            if content_type == "carousel":
                # Fetch carousel slides for this content
                try:
                    logger.info(f"🎠 Attempting to fetch slides for carousel content {content['id']}")
                    # Use admin client to bypass RLS for carousel slides
                    supabase_admin = get_supabase_admin_client()
                    slides_response = supabase_admin.table("carousel_slides").select(
                        "id, image_url, slide_index"
                    ).eq("content_id", content["id"]).order("slide_index").execute()
                    
                    logger.info(f"🎠 Slides response for {content['id']}: {slides_response.data}")
                    
                    slides = slides_response.data if slides_response.data else []
                    logger.info(f"🎠 Fetched {len(slides)} slides for carousel content {content['id']}")
                    
                    if slides:
                        logger.info(f"🎠 Sample slide URLs for {content['id']}: {[slide['image_url'][:80] + '...' for slide in slides[:2]]}")
                        transformed_content = {
                            "id": content["id"],
                            "hook": content["title"],  # title -> hook
                            "summary": content["summary"],  # Keep summary for metadata
                            "fullContent": content["summary"],  # Using summary as metadata
                            "image": "",  # Not used for carousel
                            "topic": "general",  # We could enhance this by joining with topics
                            "source": "Database",  # Could be enhanced with actual source name
                            "sourceUrl": content.get("source_url", ""),
                            "readTime": 2,  # Could be calculated or stored
                            "video_url": "",  # Not used for carousel
                            "tags": [],  # TODO: Add tags support when available in database
                            "contentType": "carousel",  # New content type
                            "slides": slides  # Add slides data for carousel
                        }
                        logger.info(f"✅ Successfully created carousel content for {content['id']} with {len(slides)} slides")
                    else:
                        logger.warning(f"⚠️ No slides found for carousel content {content['id']}, falling back to text")
                        # Fallback to regular text content if no slides found
                        transformed_content = {
                            "id": content["id"],
                            "hook": content["title"],
                            "summary": content["summary"],
                            "fullContent": content["summary"],
                            "image": "",
                            "topic": "general",
                            "source": "Database",
                            "sourceUrl": content.get("source_url", ""),
                            "readTime": 2,
                            "video_url": "",
                            "tags": [],
                            "contentType": "text"  # Fallback to text
                        }
                except Exception as e:
                    logger.error(f"❌ Error fetching slides for carousel {content['id']}: {str(e)}")
                    logger.error(f"❌ Exception type: {type(e)}")
                    import traceback
                    logger.error(f"❌ Traceback: {traceback.format_exc()}")
                    # Fallback to regular text content if slides fetch fails
                    transformed_content = {
                        "id": content["id"],
                        "hook": content["title"],
                        "summary": content["summary"],
                        "fullContent": content["summary"],
                        "image": "",
                        "topic": "general",
                        "source": "Database",
                        "sourceUrl": content.get("source_url", ""),
                        "readTime": 2,
                        "video_url": "",
                        "tags": [],
                        "contentType": "text"  # Fallback to text
                    }
            else:
                # Handle existing text and reel content types
                transformed_content = {
                    "id": content["id"],
                    "hook": content["title"],  # title -> hook
                    "summary": content["summary"],  # summary -> fullContent for swiping
                    "fullContent": content["summary"],  # Using summary as the swipeable content
                    "image": "" if is_video else media_url,  # Use media_url as image only for non-video content
                    "topic": "general",  # We could enhance this by joining with topics
                    "source": "Database",  # Could be enhanced with actual source name
                    "sourceUrl": content.get("source_url", ""),
                    "readTime": 2,  # Could be calculated or stored
                    "video_url": media_url if is_video else "",  # Use media_url as video_url for video content
                    "tags": [],  # TODO: Add tags support when available in database
                    "contentType": "reel" if is_video else "text"  # Determine content type
                }
            
            transformed_data.append(transformed_content)
        
        return {
            "data": transformed_data,
            "count": len(transformed_data),
            "offset": offset,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error fetching personalized content: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_content(
    content: ContentRequest,
    user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create new content (admin only)"""
    try:
        # Validate content data
        if not content.title or not content.summary:
            raise HTTPException(status_code=400, detail="Title and summary are required")
        
        if content.difficulty_level not in range(1, 6):
            raise HTTPException(status_code=400, detail="Difficulty level must be between 1 and 5")
        
        # Create content using admin client to bypass RLS
        supabase_admin = get_supabase_admin_client()
        response = supabase_admin.table("contents").insert({
            "title": content.title,
            "summary": content.summary,
            "content_type": content.content_type,
            "topic_id": content.topic_id,
            "tags": content.tags,
            "difficulty_level": content.difficulty_level,
            "estimated_read_time": content.estimated_read_time,
            # TODO: Add video_url support after database migration
            # "video_url": content.video_url,
            "ai_generated": True,
            "created_by": user.id
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create content")
        
        return {
            "data": response.data[0],
            "message": "Content created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 