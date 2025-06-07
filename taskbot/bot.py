"""
AI Society Task Bot

Main bot file responsible for initializing and managing Discord bot
"""

import discord
from discord.ext import commands
import logging
import asyncio
from pathlib import Path

from utils import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ensure Opus library is loaded (for voice features)
if not discord.opus.is_loaded():
    try:
        discord.opus.load_opus('libopus.so')  # Linux
    except OSError:
        try:
            discord.opus.load_opus('libopus.dylib')  # macOS
        except OSError:
            try:
                discord.opus.load_opus('opus.dll')  # Windows
            except OSError:
                logger.error("Opus library not found. Voice features may not work.")


class TaskBot(discord.Bot):
    """AI Society Task Bot main class"""
    
    def __init__(self):
        # Setup intents
        intents = discord.Intents.default()
        intents.message_content = True
        intents.voice_states = True
        
        super().__init__(intents=intents)
        
        # Store active voice connections
        self.voice_connections = {}
    
    async def on_ready(self):
        """Callback when bot is ready"""
        logger.info(f"Logged in as {self.user} (ID: {self.user.id})")
        
        # Sync commands
        try:
            synced = await self.sync_commands()
            logger.info(f"Synced {len(synced) if synced else 0} commands")
        except Exception as e:
            logger.error(f"Failed to sync commands: {e}")
        
        # Print loaded cogs
        logger.info(f"Loaded cogs: {list(self.cogs.keys())}")
    
    async def on_connect(self):
        """Callback when bot connects to Discord"""
        logger.info("Bot connected to Discord")
    
    async def on_disconnect(self):
        """Callback when bot disconnects from Discord"""
        logger.info("Bot disconnected from Discord")


def load_cogs(bot: TaskBot):
    """Load all cogs"""
    cogs_dir = Path(__file__).parent / "cogs"
    
    # Ensure cogs directory exists
    if not cogs_dir.exists():
        logger.warning("Cogs directory not found")
        return
    
    # Load all .py files (except __init__.py)
    for cog_file in cogs_dir.glob("*.py"):
        if cog_file.name.startswith("_"):
            continue
            
        cog_name = f"cogs.{cog_file.stem}"
        
        try:
            bot.load_extension(cog_name)
            logger.info(f"Loaded cog: {cog_name}")
        except Exception as e:
            logger.error(f"Failed to load cog {cog_name}: {e}")


def main():
    """Main function"""
    # Create bot instance
    bot = TaskBot()
    
    # Load all cogs
    load_cogs(bot)
    
    # Run bot
    try:
        bot.run(config.discord_token)
    except Exception as e:
        logger.error(f"Failed to run bot: {e}")


if __name__ == "__main__":
    main()
