"""Entry point for the API and Discord bot."""

import asyncio
import logging

import uvicorn

from app.bot import start_bot

logging.basicConfig(level=logging.INFO)


async def start_api() -> None:
    logging.info("Starting API server on http://0.0.0.0:8000 ...")
    config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
    server = uvicorn.Server(config)
    await server.serve()


async def main() -> None:
    await asyncio.gather(start_api(), start_bot())


if __name__ == "__main__":
    asyncio.run(main())
