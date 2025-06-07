"""
Task Reminder Cog

Automatically checks tasks and sends reminder notifications on the corresponding channel
one day before a task's deadline at 9:00 AM.
"""

import discord
from discord.ext import commands, tasks
import aiohttp
import logging
from datetime import time
from typing import List, Dict, Any

from utils.config import config
from utils.auth_manager import AuthManager

logger = logging.getLogger(__name__)


class ReminderCog(commands.Cog):
    """Cog for handling task reminders"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.session = None
        self.auth_manager = AuthManager(config.api_base_url)
        self._authenticated = False
        
    async def cog_load(self):
        """Called when the cog is loaded"""
        # Create aiohttp session
        self.session = aiohttp.ClientSession()
        
        # Start the reminder task
        self.daily_reminder_check.start()
        logger.info("Reminder cog loaded and daily check started")
    
    async def cog_unload(self):
        """Called when the cog is unloaded"""
        # Stop the reminder task
        self.daily_reminder_check.cancel()
        
        # Close aiohttp session
        if self.session:
            await self.session.close()
        
        logger.info("Reminder cog unloaded")

    async def ensure_session(self):
        """确保 HTTP session 已经初始化"""
        if self.session is None:
            self.session = aiohttp.ClientSession()
            logger.info("Created new HTTP session")

    async def ensure_authenticated(self) -> bool:
        """确保已经通过后端 API 认证"""
        if not self._authenticated:
            success = await self.auth_manager.login(
                config.api_username, 
                config.api_password
            )
            if success:
                self._authenticated = True
                logger.info("Successfully authenticated with backend API")
            else:
                logger.error("Failed to authenticate with backend API")
            return success
        return True

    @tasks.loop(time=time(hour=9, minute=0))  # Run daily at 9:00 AM
    async def daily_reminder_check(self):
        """Check for tasks due tomorrow and send reminders"""
        try:
            logger.info("Starting daily reminder check...")
            
            # Fetch tasks due tomorrow from API
            tasks_data = await self.fetch_tomorrow_tasks()
            
            if not tasks_data or not tasks_data.get('tasks'):
                logger.info("No tasks due tomorrow")
                return
            
            # Group tasks by portfolio channel
            channel_tasks = self.group_tasks_by_channel(tasks_data['tasks'])
            
            # Send reminders to each channel
            for channel_id, tasks in channel_tasks.items():
                await self.send_channel_reminder(channel_id, tasks)
            
            logger.info(f"Sent reminders for {len(tasks_data['tasks'])} tasks across {len(channel_tasks)} channels")
            
        except Exception as e:
            logger.error(f"Error in daily reminder check: {e}")

    @daily_reminder_check.before_loop
    async def before_daily_reminder_check(self):
        """Wait for bot to be ready before starting the loop"""
        await self.bot.wait_until_ready()

    async def fetch_tomorrow_tasks(self) -> Dict[str, Any]:
        """Fetch tasks due tomorrow from the API"""
        try:
            # 确保 session 已经初始化
            await self.ensure_session()
            
            # 确保已经认证
            if not await self.ensure_authenticated():
                logger.error("Cannot fetch tasks: authentication failed")
                return {}
            
            url = f"{config.api_base_url}/api/v1/tasks/reminders/tomorrow"
            logger.info(f"Making request to: {url}")
            
            # 获取认证头
            headers = self.auth_manager.auth_headers
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    # 检查数据是否为 None 或空
                    if data is None:
                        logger.warning("API returned None data")
                        return {}
                    
                    logger.info(f"Fetched {data.get('total_count', 0)} tasks due tomorrow")
                    return data
                else:
                    logger.error(f"API request failed with status {response.status}")
                    # 尝试获取错误响应内容
                    try:
                        error_text = await response.text()
                        logger.error(f"Error response: {error_text}")
                    except:
                        pass
                    return {}
                    
        except Exception as e:
            logger.error(f"Error fetching tomorrow tasks: {e}")
            return {}

    def group_tasks_by_channel(self, tasks: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group tasks by their portfolio channel"""
        channel_tasks = {}
        
        for task in tasks:
            channel_id = task.get('portfolio_channel')
            if channel_id:
                if channel_id not in channel_tasks:
                    channel_tasks[channel_id] = []
                channel_tasks[channel_id].append(task)
        
        return channel_tasks

    async def send_channel_reminder(self, channel_id: str, tasks: List[Dict[str, Any]]):
        """Send reminder message to a specific channel"""
        try:
            channel = self.bot.get_channel(int(channel_id))
            if not channel:
                logger.warning(f"Channel {channel_id} not found")
                return
            
            # Create reminder embed
            embed = self.create_reminder_embed(tasks)
            
            # Send the reminder
            await channel.send(embed=embed)
            logger.info(f"Sent reminder to channel {channel.name} ({channel_id}) for {len(tasks)} tasks")
            
        except Exception as e:
            logger.error(f"Error sending reminder to channel {channel_id}: {e}")

    def create_reminder_embed(self, tasks: List[Dict[str, Any]]) -> discord.Embed:
        """Create a Discord embed for task reminders"""
        portfolio_name = tasks[0].get('portfolio_name', 'Unknown Portfolio')
        
        embed = discord.Embed(
            title="🔔 Task Reminder",
            description=f"**{portfolio_name}** has tasks due tomorrow!",
            color=discord.Color.orange()
        )
        
        for task in tasks:
            # Get assigned users
            assigned_users = task.get('assigned_users', [])
            user_mentions = []
            
            for user in assigned_users:
                discord_id = user.get('discord_id')
                if discord_id:
                    user_mentions.append(f"<@{discord_id}>")
                else:
                    user_mentions.append(user.get('username', 'Unknown'))
            
            users_text = ", ".join(user_mentions) if user_mentions else "No one assigned"
            
            # Format deadline
            deadline_local = task.get('deadline_local_date', 'Unknown')
            deadline_time = task.get('deadline_local_time', 'Unknown')
            
            # Priority emoji
            priority_emoji = {
                'high': '🔴',
                'medium': '🟡',
                'low': '🟢'
            }.get(task.get('priority', '').lower(), '⚪')
            
            # Status emoji
            status_emoji = {
                'not started': '⏸️',
                'in progress': '▶️',
                'completed': '✅',
                'on hold': '⏸️'
            }.get(task.get('status', '').lower(), '❓')
            
            field_value = (
                f"**Assigned to:** {users_text}\n"
                f"**Deadline:** {deadline_local} at {deadline_time}\n"
                f"**Priority:** {priority_emoji} {task.get('priority', 'Unknown')}\n"
                f"**Status:** {status_emoji} {task.get('status', 'Unknown')}\n"
                f"**Description:** {task.get('description', 'No description')[:100]}{'...' if len(task.get('description', '')) > 100 else ''}"
            )
            
            embed.add_field(
                name=f"📋 {task.get('title', 'Untitled Task')}",
                value=field_value,
                inline=False
            )
        
        embed.set_footer(text="Don't forget to complete your tasks on time! 💪")
        
        return embed

    @discord.slash_command(description="Manually trigger reminder check (Admin only)")
    @commands.has_permissions(administrator=True)
    async def check_reminders(self, ctx: discord.ApplicationContext):
        """Manually trigger the reminder check"""
        await ctx.defer()
        
        try:
            # Fetch tasks due tomorrow
            tasks_data = await self.fetch_tomorrow_tasks()
            
            if not tasks_data or not tasks_data.get('tasks'):
                await ctx.followup.send("No tasks due tomorrow found.", ephemeral=True)
                return
            
            # Group tasks by channel
            channel_tasks = self.group_tasks_by_channel(tasks_data['tasks'])
            
            # Send reminders
            sent_count = 0
            for channel_id, tasks in channel_tasks.items():
                await self.send_channel_reminder(channel_id, tasks)
                sent_count += len(tasks)
            
            await ctx.followup.send(
                f"✅ Sent reminders for {sent_count} tasks across {len(channel_tasks)} channels.",
                ephemeral=True
            )
            
        except Exception as e:
            logger.error(f"Error in manual reminder check: {e}")
            await ctx.followup.send(f"❌ Error checking reminders: {str(e)}", ephemeral=True)

    @discord.slash_command(description="Show next reminder time")
    async def next_reminder(self, ctx: discord.ApplicationContext):
        """Show when the next reminder check will occur"""
        if self.daily_reminder_check.is_running():
            next_iteration = self.daily_reminder_check.next_iteration
            if next_iteration:
                timestamp = int(next_iteration.timestamp())
                await ctx.respond(f"Next reminder check: <t:{timestamp}:F> (<t:{timestamp}:R>)", ephemeral=True)
            else:
                await ctx.respond("Next reminder time is not available.", ephemeral=True)
        else:
            await ctx.respond("Reminder task is not running.", ephemeral=True)

    @discord.slash_command(description="Test API connection (Admin only)")
    @commands.has_permissions(administrator=True)
    async def test_api(self, ctx: discord.ApplicationContext):
        """Test the API connection and response"""
        await ctx.defer()
        
        try:
            # 确保 session 已经初始化
            await self.ensure_session()
            
            # 确保已经认证
            if not await self.ensure_authenticated():
                await ctx.followup.send("❌ API 认证失败", ephemeral=True)
                return
            
            url = f"{config.api_base_url}/api/v1/tasks/reminders/tomorrow"
            
            # 获取认证头
            headers = self.auth_manager.auth_headers
            
            async with self.session.get(url, headers=headers) as response:
                status = response.status
                headers = dict(response.headers)
                
                try:
                    data = await response.json()
                    data_preview = str(data)[:500] + "..." if len(str(data)) > 500 else str(data)
                except Exception as json_error:
                    try:
                        text_data = await response.text()
                        data_preview = f"JSON解析失败: {json_error}\n原始响应: {text_data[:300]}..."
                    except:
                        data_preview = f"无法读取响应内容: {json_error}"
                
                embed = discord.Embed(
                    title="🔧 API 连接测试",
                    color=discord.Color.blue() if status == 200 else discord.Color.red()
                )
                
                embed.add_field(name="URL", value=url, inline=False)
                embed.add_field(name="状态码", value=str(status), inline=True)
                embed.add_field(name="Content-Type", value=headers.get('content-type', 'Unknown'), inline=True)
                embed.add_field(name="响应数据", value=f"```json\n{data_preview}\n```", inline=False)
                
                await ctx.followup.send(embed=embed, ephemeral=True)
                
        except Exception as e:
            await ctx.followup.send(f"❌ API 测试失败: {str(e)}", ephemeral=True)

    @discord.slash_command(description="Show configuration (Admin only)")
    @commands.has_permissions(administrator=True)
    async def show_config(self, ctx: discord.ApplicationContext):
        """显示当前配置信息"""
        embed = discord.Embed(
            title="🔧 机器人配置",
            color=discord.Color.blue()
        )
        
        embed.add_field(name="API Base URL", value=config.api_base_url, inline=False)
        embed.add_field(name="Session Status", value="✅ 已初始化" if self.session else "❌ 未初始化", inline=True)
        embed.add_field(name="Auth Status", value="✅ 已认证" if self._authenticated else "❌ 未认证", inline=True)
        embed.add_field(name="Daily Task Status", value="✅ 运行中" if self.daily_reminder_check.is_running() else "❌ 已停止", inline=True)
        
        await ctx.respond(embed=embed, ephemeral=True)


def setup(bot: commands.Bot):
    """Setup function required by discord.py extensions"""
    bot.add_cog(ReminderCog(bot)) 