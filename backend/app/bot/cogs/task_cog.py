import discord
from discord.ext import commands

from app.database.session import SessionLocal
from app.schemas.task import TaskCreateRequestBody
from app.crud import task as crud_task
from app.crud import task_assignment as crud_assignment


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
            task_in = TaskCreateRequestBody(
                title=title,
                description=description,
                deadline=deadline,
                portfolio_id=portfolio_id,
            )
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
