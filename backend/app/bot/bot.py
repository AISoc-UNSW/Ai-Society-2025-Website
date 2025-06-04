"""Discord bot entry and configuration."""

import logging
import discord
from discord.ext import commands

from app.core.config import settings
from .cogs.task_cog import TaskCog
from .cogs.reminder_cog import ReminderCog
from .cogs.meeting_cog import MeetingCog

logger = logging.getLogger(__name__)

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    logger.info(f"Logged in as {bot.user} (ID: {bot.user.id})")


async def start_bot():
    bot.add_cog(TaskCog(bot))
    bot.add_cog(ReminderCog(bot))
    bot.add_cog(MeetingCog(bot))

    token = settings.DISCORD_BOT_TOKEN
    if not token:
        logger.warning("DISCORD_BOT_TOKEN not set; bot will not start")
        return

    logger.info("Starting Discord bot...")
    await bot.start(token)
