import discord
from discord.ext import commands


class TaskCog(commands.Cog):
    """Commands for basic task management. Just a Template for now."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.slash_command(description="Create a task")
    async def create_task(self):
        pass
