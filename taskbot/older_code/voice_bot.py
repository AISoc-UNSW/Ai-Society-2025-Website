import discord
import os
from discord.ext import commands
# # from discord import app_commands
import time
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import asyncio
import io
import wave
import numpy as np
import soundfile as sf
from scipy.io import wavfile
import subprocess


# Ensure Opus is loaded for voice features
if not discord.opus.is_loaded():
    try:
        discord.opus.load_opus('libopus.so')  # Linux
    except OSError:
        try:
            discord.opus.load_opus('libopus.dylib')  # macOS
        except OSError:
            try:
                discord.opus.load_opus('opus.dll')  # Windows
            except OSError:
                raise RuntimeError("Opus library not found. Please install opus and ensure it is in your library path.")

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True
bot = discord.Bot(intents=intents)
connections = {}


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    try:
        # Actually clear all global application commands from Discord
        await bot.http.bulk_overwrite_global_application_commands(bot.user.id, [])
        print("Cleared all global application commands from Discord.")
        # Now sync the current commands
        synced = await bot.sync_commands(force=True)
        if synced is not None:
            print(f"Synced {len(synced)} commands (forced).")
        else:
            print("Synced commands, but got None as result (possibly due to library version).")
    except Exception as e:
        print(f"Failed to sync commands: {e}")
    # Print all registered application commands
    print("Registered application commands:")
    for cmd in bot.application_commands:
        print(f"- {cmd.name} (type: {type(cmd)})")


@bot.listen()
async def on_connect():
    print("Bot has connected!")


class Voice(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.meeting_name = ""
        self.portfolio_id = ""

    async def finished_callback(self, sink: discord.sinks.WaveSink, channel: discord.TextChannel, *args):
        segments = []
        mention_strs = []

        for user_id, audio in sink.audio_data.items():
            raw_path = f"{user_id}_raw.wav"
            fixed_path = f"{user_id}_fixed.wav"

            with open(raw_path, "wb") as f:
                f.write(audio.file.getbuffer())

            # Fix with ffmpeg for compatibility (as pydub did not work well with raw wav audio)
            subprocess.run(["ffmpeg", "-y", "-i", raw_path, fixed_path], check=True)
            seg = AudioSegment.from_wav(fixed_path)

            segments.append(seg)
            mention_strs.append(f"<@{user_id}>")
            
            os.remove(raw_path)
            os.remove(fixed_path)

        if not segments:
            await channel.send("No audio recorded.")
            return

        # Overlay all user segments -> this will automatically handle silence 
        combined = segments[0]
        for seg in segments[1:]:
            combined = combined.overlay(seg)

        combined_file_name = f"meeting_{self.meeting_name}_{self.portfolio_id}.wav"
        combined.export(combined_file_name, format="wav")
        await self.upload_to_supabase(channel, combined_file_name)
        await channel.send(f"Merged audio for {', '.join(mention_strs)}:", file=discord.File(combined_file_name))
        os.remove(combined_file_name)

voice_instance = Voice(bot)

@bot.slash_command(name="record_voice")
async def record(interaction: discord.Interaction, meeting_name: str, portfolio_id: str):
    voice = interaction.user.voice
    channel = interaction.user.voice.channel
    voice_instance.portfolio_id = channel.category
    print(channel.category)  # This prints a VoiceState object, which is expected and correct.
    voice_instance.meeting_name = meeting_name
    # voice_instance.portfolio_id = portfolio_id

    if not voice:
        return await interaction.response.send_message("You're not in a VC!", ephemeral=True)

    vc = interaction.guild.voice_client
    connections[interaction.guild.id] = vc
    print(connections)

    # Start recording (even if already connected)
    vc.start_recording(
        discord.sinks.WaveSink(),
        voice_instance.finished_callback,
        interaction.channel
    )

    await interaction.response.send_message("Recording started. Use `/stop_record` to stop.")

@bot.slash_command(name="stop_record")
async def stop_recording(interaction: discord.Interaction):
    print(connections)
    if interaction.guild.id in connections:  # Check if the guild is in the cache.
        vc = connections[interaction.guild.id]
        vc.stop_recording()  # Stop recording, and call the callback (once_done).
        del connections[interaction.guild.id]  # Remove the guild from the cache.
        await interaction.response.send_message("Stopped recording and cleaned up.", ephemeral=True)
    else:
        await interaction.response.send_message("I am currently not recording here.", ephemeral=True)

@bot.slash_command(name="join_voice")
async def join(interaction: discord.Interaction):
    if interaction.user.voice:
        channel = interaction.user.voice.channel
        await channel.connect()
        await interaction.response.send_message(f"Joined {channel.name}!")
    else:
        await interaction.response.send_message("Join a voice channel first.", ephemeral=True)

@bot.slash_command(name="leave_voice")
async def leave(interaction: discord.Interaction):
    voice_client = interaction.guild.voice_client
    if voice_client:
        await voice_client.disconnect()
        await interaction.response.send_message("Disconnected.")
    else:
        await interaction.response.send_message("Not in a voice channel.", ephemeral=True)

@bot.slash_command(description="Manually clear all application commands (admin only).")
async def clear_commands(ctx):
    """Manually clear all application (slash) commands from Discord."""
    if not ctx.author.guild_permissions.administrator:
        await ctx.respond("You do not have permission to use this command.", ephemeral=True)
        return
    try:
        await bot.http.bulk_overwrite_global_application_commands(bot.user.id, [])
        await ctx.respond("All global application commands have been cleared. It may take a few minutes to propagate.", ephemeral=True)
    except Exception as e:
        await ctx.respond(f"Failed to clear commands: {e}", ephemeral=True)

bot.run(os.getenv("DISCORD_TOKEN"))