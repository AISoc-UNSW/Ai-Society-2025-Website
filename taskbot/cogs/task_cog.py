import discord
from discord.ext import commands


class TaskCog(commands.Cog):
    """Commands for basic task management. Just a Template for now."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @discord.slash_command(description="Create a task")
    async def create_task(self, ctx: discord.ApplicationContext):
        """Create a new task (placeholder)"""
        await ctx.respond("Task creation functionality coming soon!", ephemeral=True)


def setup(bot: commands.Bot):
    """Setup function required by discord.py extensions"""
    bot.add_cog(TaskCog(bot))
