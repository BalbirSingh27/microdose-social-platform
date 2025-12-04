# backend/supabase_client.py

import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars. "
        "Set them in Render → mcrdse-api → Environment."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
