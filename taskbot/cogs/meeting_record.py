"""
Meeting Recording Cog

Responsible for handling Discord voice channel recording functionality
"""

import discord
from discord.ext import commands
import logging
import os
from datetime import datetime
from pydub import AudioSegment
import subprocess
import asyncio

from utils import MeetingService

logger = logging.getLogger(__name__)


class MeetingRecord(commands.Cog):
    """Meeting recording functionality"""
    
    def __init__(self, bot):
        self.bot = bot
        self.meeting_service = MeetingService()
        # Store ongoing recording session information
        self.recording_sessions = {}
    
    @discord.slash_command(name="record_voice", description="Start recording voice meeting")
    async def start_recording(
        self, 
        ctx: discord.ApplicationContext,
        meeting_name: str = discord.Option(str, "Meeting name", required=True),
        portfolio_id: int = discord.Option(int, "Portfolio ID", required=True)
    ):
        """Start recording command"""
        # Check if user is in voice channel
        if not ctx.author.voice:
            await ctx.respond("❌ You need to join a voice channel first!", ephemeral=True)
            return
        
        voice_channel = ctx.author.voice.channel
        guild_id = ctx.guild.id
        
        # Check if already recording
        if guild_id in self.recording_sessions:
            await ctx.respond("⚠️ This server is already recording! Please stop current recording first.", ephemeral=True)
            return
        
        try:
            # Connect to voice channel
            if ctx.guild.voice_client:
                await ctx.guild.voice_client.move_to(voice_channel)
                vc = ctx.guild.voice_client
            else:
                vc = await voice_channel.connect()
            
            # Save recording session information
            self.recording_sessions[guild_id] = {
                "voice_client": vc,
                "meeting_name": meeting_name,
                "portfolio_id": portfolio_id,
                "channel_name": voice_channel.name,
                "start_time": datetime.now()
            }
            
            # Start recording
            vc.start_recording(
                discord.sinks.WaveSink(),
                self._create_recording_callback(guild_id),
                ctx.channel
            )
            
            await ctx.respond(
                f"🎙️ Recording started!\n"
                f"**Meeting name**: {meeting_name}\n"
                f"**Portfolio ID**: {portfolio_id}\n"
                f"**Voice channel**: {voice_channel.name}\n"
                f"Use `/stop_record` to end recording."
            )
            
            logger.info(f"Started recording in {voice_channel.name} for meeting: {meeting_name}")
            
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            await ctx.respond(f"❌ Failed to start recording: {str(e)}", ephemeral=True)
            # Clean up session information
            if guild_id in self.recording_sessions:
                del self.recording_sessions[guild_id]
    
    @discord.slash_command(name="stop_record", description="Stop recording voice meeting")
    async def stop_recording(self, ctx: discord.ApplicationContext):
        """Stop recording command"""
        guild_id = ctx.guild.id
        
        # Check if recording
        if guild_id not in self.recording_sessions:
            await ctx.respond("⚠️ No ongoing recording found.", ephemeral=True)
            return
        
        try:
            session = self.recording_sessions[guild_id]
            vc = session["voice_client"]
            
            # Stop recording
            vc.stop_recording()
            
            await ctx.respond("⏹️ Stopping recording and processing audio files, please wait...")
            
        except Exception as e:
            logger.error(f"Failed to stop recording: {e}")
            await ctx.respond(f"❌ Failed to stop recording: {str(e)}", ephemeral=True)
    
    def _create_recording_callback(self, guild_id: int):
        """Create recording completion callback function"""
        async def recording_finished_callback(sink: discord.sinks.WaveSink, channel: discord.TextChannel):
            """Processing after recording completion"""
            try:
                session = self.recording_sessions.get(guild_id)
                if not session:
                    await channel.send("❌ Recording session information lost!")
                    return
                
                # Process audio files
                await channel.send("🔄 Processing audio files...")
                
                # Merge all users' audio
                segments = []
                temp_files = []
                
                for user_id, audio in sink.audio_data.items():
                    # Save temporary files
                    raw_path = f"temp_{user_id}_raw.wav"
                    fixed_path = f"temp_{user_id}_fixed.wav"
                    temp_files.extend([raw_path, fixed_path])
                    
                    with open(raw_path, "wb") as f:
                        f.write(audio.file.getbuffer())
                    
                    # Use ffmpeg to fix audio format
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", raw_path, fixed_path], 
                        check=True,
                        capture_output=True
                    )
                    
                    # Load audio segment
                    seg = AudioSegment.from_wav(fixed_path)
                    segments.append(seg)
                
                if not segments:
                    await channel.send("❌ No audio recorded!")
                    return
                
                # Merge audio
                combined = segments[0]
                for seg in segments[1:]:
                    combined = combined.overlay(seg)
                
                # Generate final file path
                file_path = self.meeting_service.get_recording_file_path(
                    session["meeting_name"],
                    session["portfolio_id"]
                )
                
                # Export audio file
                combined.export(file_path, format="wav")
                
                # Clean up temporary files
                for temp_file in temp_files:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                
                await channel.send(f"✅ Audio file saved: `{file_path}`")
                
                # Create meeting record
                await channel.send("📝 Creating meeting record...")
                
                result = await self.meeting_service.create_meeting_record(
                    meeting_name=session["meeting_name"],
                    portfolio_id=session["portfolio_id"],
                    recording_file_path=file_path
                )
                
                if result:
                    duration = datetime.now() - session["start_time"]
                    await channel.send(
                        f"✅ **Meeting recording completed!**\n"
                        f"**Meeting ID**: {result.get('meeting_id')}\n"
                        f"**Meeting name**: {session['meeting_name']}\n"
                        f"**Recording duration**: {duration.seconds // 60}min {duration.seconds % 60}sec\n"
                        f"**File path**: `{file_path}`"
                    )
                else:
                    # Send failure information and raw data
                    error_data = {
                        "meeting_name": session["meeting_name"],
                        "portfolio_id": session["portfolio_id"],
                        "recording_file_path": file_path,
                        "meeting_date": datetime.now().date().isoformat()
                    }
                    await channel.send(
                        f"❌ **Failed to create meeting record!**\n"
                        f"Audio file saved, but unable to create database record.\n"
                        f"Please save the following information for manual retry:\n"
                        f"```json\n{error_data}\n```"
                    )
                
                # Disconnect voice connection
                if session["voice_client"].is_connected():
                    await session["voice_client"].disconnect()
                
            except Exception as e:
                logger.error(f"Error in recording callback: {e}")
                await channel.send(f"❌ Error occurred while processing recording: {str(e)}")
            
            finally:
                # Clean up session information
                if guild_id in self.recording_sessions:
                    del self.recording_sessions[guild_id]
        
        return recording_finished_callback
    
    @commands.Cog.listener()
    async def on_voice_state_update(self, member, before, after):
        """Listen for voice state updates, handle bot being kicked from channel"""
        if member == self.bot.user and before.channel and not after.channel:
            # Bot was kicked from voice channel
            for guild_id, session in list(self.recording_sessions.items()):
                if session["voice_client"].channel == before.channel:
                    logger.warning(f"Bot was disconnected from voice channel during recording")
                    del self.recording_sessions[guild_id]


def setup(bot):
    """Load Cog"""
    bot.add_cog(MeetingRecord(bot)) 