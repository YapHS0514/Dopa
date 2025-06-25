import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Load environment variables
load_dotenv()

# Initialize logging
logger = logging.getLogger(__name__)

# Supabase configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
project_ref = os.getenv("SUPABASE_PROJECT_REF")

# Debug logging for environment variables
logger.info("Environment variables check:")
logger.info(f"SUPABASE_URL: {'Present' if supabase_url else 'Missing'}")
logger.info(f"SUPABASE_ANON_KEY: {'Present' if supabase_anon_key else 'Missing'}")
logger.info(f"SUPABASE_SERVICE_ROLE_KEY: {'Present' if supabase_service_key else 'Missing'}")
logger.info(f"SUPABASE_PROJECT_REF: {'Present' if project_ref else 'Missing'}")

if not all([supabase_url, supabase_anon_key]):
    raise ValueError("Missing required Supabase environment variables")

# Initialize Supabase clients
try:
    supabase = create_client(supabase_url, supabase_anon_key)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Supabase client: {str(e)}")
    raise

try:
    if supabase_service_key:
        logger.info("Initializing Supabase admin client with service role key")
        supabase_admin = create_client(supabase_url, supabase_service_key)
        logger.info("Supabase admin client initialized successfully")
    else:
        logger.warning("No service role key provided - admin operations will not be available")
        supabase_admin = None
except Exception as e:
    logger.error(f"Error initializing Supabase admin client: {str(e)}")
    raise

def get_supabase_client() -> Client:
    return supabase

def get_supabase_admin_client() -> Client:
    if not supabase_admin:
        raise ValueError("Supabase admin client not initialized")
    return supabase_admin 