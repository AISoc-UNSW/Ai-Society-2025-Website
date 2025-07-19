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
from dotenv import load_dotenv

from utils import MeetingService
from ai_generation.speech_to_text import speech_to_text
from ai_generation.generate_tasks import generate_tasks
import json

from utils.config import config
from utils.auth_manager import AuthManager
import aiohttp

load_dotenv()


logger = logging.getLogger(__name__)


class MeetingRecord(commands.Cog):
    """Meeting recording functionality"""

    def __init__(self, bot):
        self.bot = bot
        self.meeting_service = MeetingService()
        self.session = None
        self.auth_manager = AuthManager(config.api_base_url)
        self._authenticated = False
        # Store ongoing recording session information
        self.recording_sessions = {}

    # Ensure aiohttp session is closed when cog is unloaded (avoided duplicating session creation, as it is handled in ensure_session)
    async def cog_unload(self):
        """Called when the cog is unloaded"""
        # Close aiohttp session
        if self.session:
            await self.session.close()

    async def ensure_session(self):
        """Ensure HTTP session is initialized"""
        if self.session is None:
            self.session = aiohttp.ClientSession()
            logger.info("Created new HTTP session")

    async def ensure_authenticated(self) -> bool:
        """Ensure authentication with backend API"""
        if not self._authenticated:
            success = await self.auth_manager.login(
                config.api_username, config.api_password
            )
            if success:
                self._authenticated = True
                logger.info("Successfully authenticated with backend API")
            else:
                logger.error("Failed to authenticate with backend API")
            return success
        return True

    @discord.slash_command(
        name="record_voice", description="Start recording voice meeting"
    )
    async def start_recording(
        self,
        ctx: discord.ApplicationContext,
        meeting_name: str = discord.Option(str, "Meeting name", required=True),
        portfolio_id: int = discord.Option(int, "Portfolio ID", required=True),
        user_can_see: bool = discord.Option(
            bool,
            "Whether users can see this meeting record",
            required=False,
            default=True,
        ),
    ):
        """Start recording command"""
        # Check if user is in voice channel
        if not ctx.author.voice:
            await ctx.respond(
                "❌ You need to join a voice channel first!", ephemeral=True
            )
            return

        voice_channel = ctx.author.voice.channel
        guild_id = ctx.guild.id

        # Ensure there is at least one non-bot user in the channel
        non_bot_members = [m for m in voice_channel.members if not m.bot]
        if not non_bot_members:
            await ctx.respond(
                "❌ There must be at least one non-bot user in the voice channel to start recording.",
                ephemeral=True,
            )
            return

        # Check if already recording
        if guild_id in self.recording_sessions:
            await ctx.respond(
                "⚠️ This server is already recording! Please stop current recording first.",
                ephemeral=True,
            )
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
                "user_can_see": user_can_see,
                "channel_name": voice_channel.name,
                "start_time": datetime.now(),
            }

            # Start recording
            vc.start_recording(
                discord.sinks.WaveSink(),
                self._create_recording_callback(guild_id),
                ctx.channel,
            )

            visibility_text = (
                "👁️ Visible to users" if user_can_see else "🔒 Hidden from users"
            )
            await ctx.respond(
                f"🎙️ Recording started!\n"
                f"**Meeting name**: {meeting_name}\n"
                f"**Portfolio ID**: {portfolio_id}\n"
                f"**Voice channel**: {voice_channel.name}\n"
                f"**Visibility**: {visibility_text}\n"
                f"Use `/stop_record` to end recording."
            )

            logger.info(
                f"Started recording in {voice_channel.name} for meeting: {meeting_name} (user_can_see: {user_can_see})"
            )

        except Exception:
            logger.exception("Failed to start recording")  # 打完整回溯
            await ctx.respond(
                "❌ Failed to start recording, check logs for details.", ephemeral=True
            )
            # Clean up session information
            if guild_id in self.recording_sessions:
                del self.recording_sessions[guild_id]

    @discord.slash_command(
        name="stop_record", description="Stop recording voice meeting"
    )
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

            await ctx.respond(
                "⏹️ Stopping recording and processing audio files, please wait..."
            )

        except Exception as e:
            logger.error(f"Failed to stop recording: {e}")
            await ctx.respond(f"❌ Failed to stop recording: {str(e)}", ephemeral=True)

    async def process_audio_files(self, sink, session, channel):
        """Process and merge audio files, return file_path or None"""
        await channel.send("🔄 Processing audio files...")
        segments = []
        temp_files = []
        for user_id, audio in sink.audio_data.items():
            raw_path = f"temp_{user_id}_raw.wav"
            fixed_path = f"temp_{user_id}_fixed.wav"
            temp_files.extend([raw_path, fixed_path])
            with open(raw_path, "wb") as f:
                f.write(audio.file.getbuffer())
            subprocess.run(
                ["ffmpeg", "-y", "-i", raw_path, fixed_path],
                check=True,
                capture_output=True,
            )
            seg = AudioSegment.from_wav(fixed_path)
            segments.append(seg)
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        if not segments:
            await channel.send("❌ No audio recorded!")
            return None
        combined = segments[0]
        for seg in segments[1:]:
            combined = combined.overlay(seg)
        file_path = self.meeting_service.get_recording_file_path(
            session["meeting_name"], session["portfolio_id"]
        )
        combined.export(file_path, format="wav")
        await channel.send(f"✅ Audio file saved: `{file_path}`")
        return file_path

    async def transcribe_audio(self, file_path, channel):
        """Transcribe audio file and return (transcript, summary) or (None, None)"""
        await channel.send(
            "📝 Converting audio to transcript and generating summary..."
        )
        try:
            transcript, summary = speech_to_text(file_path)
            await channel.send("✅ Transcript and Summary generated successfully!")
            return transcript, summary
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            await channel.send(f"❌ Transcription failed: {str(e)}")
            return None, None

    async def generate_and_save_tasks(self, meeting_id, transcript, session, channel):
        """Generate tasks from transcript, show preview, and save to backend"""
        await channel.send(
            "🤖 Based on the meeting transcript, the tasks are generated as follows..."
        )
        try:
            tasks = generate_tasks(
                transcript,
                source_meeting_id=meeting_id,
                portfolio_id=session["portfolio_id"],
            )
        except Exception as e:
            logger.error(f"Task generation failed: {e}")
            await channel.send(f"❌ Task generation failed: {str(e)}")
            return
        if not tasks:
            await channel.send("❌ No tasks generated for this meeting.")
            return
        tasks_preview = json.dumps(tasks, indent=2)
        await channel.send(
            f"**Generated Tasks:**\n```json\n{tasks_preview[:1000]}{'...' if len(tasks_preview) > 1800 else ''}\n```."
        )
        await self.ensure_session()
        if not await self.ensure_authenticated():
            await channel.send(
                "❌ Could not authenticate with backend API. Tasks not saved."
            )
            return

        await channel.send(
            f"✅ To make any changes to the tasks, access the taskbot website: {config.frontend_base_url}/taskbot/meeting/{meeting_id}/confirm"
        )
        url = f"{config.api_base_url}/api/v1/tasks/group"
        payload = {"tasks": tasks, "source_meeting_id": meeting_id}
        headers = self.auth_manager.auth_headers
        try:
            async with self.session.post(url, json=payload, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    await channel.send(
                        f"✅ Tasks have been saved to the database! ({data.get('total_created', 0)} tasks created)"
                    )
                else:
                    error = await resp.text()
                    await channel.send(
                        f"❌ Failed to save tasks to backend: {resp.status}\n{error}"
                    )
        except Exception as e:
            await channel.send(f"❌ Error while saving tasks to backend: {str(e)}")

    async def create_meeting_record_and_notify(
        self, session, file_path, summary, transcript, channel
    ):
        """Create meeting record and notify channel"""
        await channel.send("📝 Creating meeting record...")
        result = await self.meeting_service.create_meeting_record(
            meeting_name=session["meeting_name"],
            portfolio_id=session["portfolio_id"],
            recording_file_path=file_path,
            summary=summary,
            transcript=transcript,
            user_can_see=session[
                "user_can_see"
            ],  # Use the user_can_see value from the session
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
            return result
        else:
            error_data = {
                "meeting_name": session["meeting_name"],
                "portfolio_id": session["portfolio_id"],
                "recording_file_path": file_path,
                "meeting_date": datetime.now().date().isoformat(),
            }
            await channel.send(
                f"❌ **Failed to create meeting record!**\n"
                f"Audio file saved, but unable to create database record.\n"
                f"Please save the following information for manual retry:\n"
                f"```json\n{error_data}\n```"
            )
            return None

    async def _cleanup_recording_session(self, guild_id: int):
        """Helper method to clean up voice client and recording session"""
        session = self.recording_sessions.get(guild_id)
        if session and session["voice_client"].is_connected():
            try:
                await session["voice_client"].disconnect()
                logger.info(f"Disconnected voice client for guild {guild_id}")
            except Exception as e:
                logger.error(
                    f"Error disconnecting voice client for guild {guild_id}: {e}"
                )

        if guild_id in self.recording_sessions:
            del self.recording_sessions[guild_id]
            logger.info(f"Cleaned up recording session for guild {guild_id}")

    def _create_recording_callback(self, guild_id: int):
        """Create recording completion callback function
        # Modified the functions by breaking into smaller functions (for more clarity)
        # Now, functionality is as follows:
        # 1. Process and merge audio files from all participants
        # 2. Get transcript and summary from the audio files using AI
        # 3. Create meeting record in backend database to get meeting_id
        # 4. Generate tasks from the transcript and save to backend using the correct meeting_id
        # 5. Finally, disconnect the voice client and clean up session data
        """

        async def recording_finished_callback(
            sink: discord.sinks.WaveSink, channel: discord.TextChannel
        ):
            """Processing after recording completion"""
            try:
                session = self.recording_sessions.get(guild_id)
                if not session:
                    await channel.send("❌ Recording session information lost!")
                    return

                file_path = await self.process_audio_files(sink, session, channel)
                if not file_path:
                    # Clean up and disconnect
                    await self._cleanup_recording_session(guild_id)
                    return

                transcript, summary = await self.transcribe_audio(file_path, channel)
                if not transcript:
                    await self._cleanup_recording_session(guild_id)
                    return

                # First create meeting record to get meeting_id
                meeting_record = await self.create_meeting_record_and_notify(
                    session, file_path, summary, transcript, channel
                )
                if not meeting_record:
                    await self._cleanup_recording_session(guild_id)
                    return

                meeting_id = meeting_record.get("meeting_id")
                if meeting_id:
                    # Then generate and save tasks with the correct meeting_id
                    await self.generate_and_save_tasks(
                        meeting_id, transcript, session, channel
                    )
                else:
                    await channel.send(
                        "❌ Failed to get meeting_id, tasks will not be generated."
                    )

                # Clean up and disconnect after successful completion
                await self._cleanup_recording_session(guild_id)
            except Exception as e:
                logger.error(f"Error in recording callback: {e}")
                await channel.send(
                    f"❌ Error occurred while processing recording: {str(e)}"
                )
                # Clean up on exception
                await self._cleanup_recording_session(guild_id)

        return recording_finished_callback

    @commands.Cog.listener()
    async def on_voice_state_update(self, member, before, after):
        """Listen for voice state updates, handle bot being kicked from channel"""
        if member == self.bot.user and before.channel and not after.channel:
            # Bot was kicked from voice channel
            for guild_id, session in list(self.recording_sessions.items()):
                if session["voice_client"].channel == before.channel:
                    logger.warning(
                        f"Bot was disconnected from voice channel during recording"
                    )
                    del self.recording_sessions[guild_id]


def setup(bot):
    """Load Cog"""
    bot.add_cog(MeetingRecord(bot))
