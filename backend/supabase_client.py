# backend/supabase_client.py

import os
from dotenv import load_dotenv          
from supabase import create_client, Client

# Load variables from .env file
load_dotenv()                           

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
