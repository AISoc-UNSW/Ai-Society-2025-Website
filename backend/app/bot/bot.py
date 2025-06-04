import asyncio
import logging
import os

import discord
from discord.ext import commands, tasks

from app.core.config import settings
from app.database.session import SessionLocal
from app.crud import task as crud_task
from app.crud import task_assignment as crud_assignment


logger = logging.getLogger(__name__)


intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)


class TaskCog(commands.Cog):
    """Commands for basic task management."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.slash_command(description="Create a task")
    async def create_task(
        self,
        ctx: discord.ApplicationContext,
        title: str,
        description: str,
        deadline: str,
        portfolio_id: int,
    ):
        """Create a new task in the database."""
        db = SessionLocal()
        try:
            task_in = {
                "title": title,
                "description": description,
                "deadline": deadline,
                "portfolio_id": portfolio_id,
            }
            record = crud_task.create_task(db, obj_in=task_in)
            await ctx.respond(f"Task {record.task_id} created")
        finally:
            db.close()

    @commands.slash_command(description="Mark a task as complete")
    async def complete_task(self, ctx: discord.ApplicationContext, task_id: int):
        db = SessionLocal()
        try:
            obj = crud_task.get_by_id(db, task_id)
            if not obj:
                await ctx.respond("Task not found", ephemeral=True)
                return
            crud_task.update_task(db, db_obj=obj, obj_in={"status": "Completed"})
            await ctx.respond("Task marked as completed")
        finally:
            db.close()

    @commands.slash_command(description="Delete a task")
    async def delete_task(self, ctx: discord.ApplicationContext, task_id: int):
        db = SessionLocal()
        try:
            if crud_task.delete_task(db, task_id=task_id):
                await ctx.respond("Task deleted")
            else:
                await ctx.respond("Task not found", ephemeral=True)
        finally:
            db.close()

    @commands.slash_command(description="Assign user to a task")
    async def assign_task(self, ctx: discord.ApplicationContext, task_id: int, user_id: int):
        db = SessionLocal()
        try:
            crud_assignment.create_task_assignment(db, obj_in={"task_id": task_id, "user_id": user_id})
            await ctx.respond("User assigned to task")
        finally:
            db.close()


class ReminderCog(commands.Cog):
    """Background reminder loop."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.check_deadlines.start()

    def cog_unload(self):
        self.check_deadlines.cancel()

    @tasks.loop(minutes=60)
    async def check_deadlines(self):
        db = SessionLocal()
        try:
            from datetime import datetime, timedelta

            now = datetime.utcnow()
            upcoming = now + timedelta(hours=1)
            tasks_due = (
                db.query(crud_task.Task)
                .filter(crud_task.Task.deadline <= upcoming, crud_task.Task.status != "Completed")
                .all()
            )
            for t in tasks_due:
                channel = discord.utils.get(self.bot.get_all_channels(), name="general")
                if channel:
                    await channel.send(f"Reminder: task '{t.title}' is due soon!")
        finally:
            db.close()


class MeetingCog(commands.Cog):
    """Join voice channels and record meetings."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._recordings = {}

    @commands.slash_command(description="Join the user's voice channel")
    async def join_meeting(self, ctx: discord.ApplicationContext):
        if ctx.author.voice:
            await ctx.author.voice.channel.connect()
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
        # Placeholder processing. Replace with real STT and summary functions
        file_path = "meeting.wav"
        with open(file_path, "wb") as f:
            f.write(list(sink.audio_data.values())[0].file.getbuffer())
        await channel.send("Recording saved (processing not implemented)")
        os.remove(file_path)

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


async def start_bot():
    bot.add_cog(TaskCog(bot))
    bot.add_cog(ReminderCog(bot))
    bot.add_cog(MeetingCog(bot))

    token = settings.DISCORD_BOT_TOKEN
    if not token:
        logger.warning("DISCORD_BOT_TOKEN not set; bot will not start")
        return
    await bot.start(token)
