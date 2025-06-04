import discord
from discord.ext import commands, tasks
from datetime import datetime, timedelta

from app.database.session import SessionLocal
from app.crud import task as crud_task


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
