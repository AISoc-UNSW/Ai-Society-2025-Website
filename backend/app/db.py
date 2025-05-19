import os
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY
import bcrypt
from fastapi import HTTPException
# Get the URL and KEY of Supabase from environment variables


# Create a Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_user(discord_id: str):
    """
    Query whether the user already exists in the database based on discord_id.
    If present, return user data, otherwise return None.
    """
    response = supabase.table("users").select("*").eq("discord_id", discord_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def create_user(discord_id: str, username: str, password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="密Password length is at least 8 characters")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    data = {
        "discord_id": discord_id,
        "username": username,
        "password": hashed_password
    }
    response = supabase.table("users").insert(data).execute()
    return response.data