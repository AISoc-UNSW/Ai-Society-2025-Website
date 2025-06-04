import os
import discord
from discord.ext import commands

from ..utils import speech_to_text, generate_summary, generate_tasks


class MeetingCog(commands.Cog):
    """Join voice channels and record meetings."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._recordings = {}

    @commands.slash_command(description="Join the user's voice channel")
    async def join_meeting(self, ctx: discord.ApplicationContext):
        voice = ctx.author.voice
        if voice:
            await voice.channel.connect()
            await ctx.respond("Joined the meeting")
        else:
            await ctx.respond("You are not in a voice channel", ephemeral=True)

    @commands.slash_command(description="Leave the voice channel")
    async def leave_meeting(self, ctx: discord.ApplicationContext):
        if ctx.guild.voice_client:
            await ctx.guild.voice_client.disconnect()
            await ctx.respond("Disconnected")
        else:
            await ctx.respond("I am not connected", ephemeral=True)

    @commands.slash_command(description="Start recording")
    async def start_record(self, ctx: discord.ApplicationContext, meeting_name: str, portfolio_id: int):
        voice = ctx.author.voice
        if not voice:
            await ctx.respond("Join a voice channel first", ephemeral=True)
            return
        vc = await voice.channel.connect()
        self._recordings[ctx.guild.id] = (vc, meeting_name, portfolio_id)
        vc.start_recording(discord.sinks.WaveSink(), self._finished_callback, ctx.channel)
        await ctx.respond("Recording started")

    async def _finished_callback(self, sink: discord.sinks.WaveSink, channel: discord.TextChannel, *args):
        info = self._recordings.get(channel.guild.id)
        if not info:
            return
        vc, meeting_name, portfolio_id = info
        file_path = f"meeting_{channel.guild.id}.wav"
        with open(file_path, "wb") as f:
            f.write(list(sink.audio_data.values())[0].file.getbuffer())

        transcript = speech_to_text(file_path)
        summary = generate_summary(transcript)
        tasks = generate_tasks(transcript)
        # Placeholder: send short message
        await channel.send("Recording saved (processing not implemented)")
        os.remove(file_path)
        await vc.disconnect()

    @commands.slash_command(description="Stop recording")
    async def stop_record(self, ctx: discord.ApplicationContext):
        info = self._recordings.get(ctx.guild.id)
        if not info:
            await ctx.respond("Not recording", ephemeral=True)
            return
        vc, _, _ = info
        vc.stop_recording()
        del self._recordings[ctx.guild.id]
        await ctx.respond("Stopped recording")
