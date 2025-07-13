# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies required for audio processing and Discord bot
RUN apt-get update && apt-get install -y \
    # Audio processing dependencies
    libopus0 \
    libopus-dev \
    ffmpeg \
    # PostgreSQL client libraries
    libpq-dev \
    # Build tools for some Python packages
    gcc \
    g++ \
    # Audio file format support
    libsndfile1 \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r taskbot && useradd -r -g taskbot taskbot

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for recordings and logs
RUN mkdir -p recordings logs && \
    chown -R taskbot:taskbot /app

# Switch to non-root user
USER taskbot

# Set default command
CMD ["python", "bot.py"] 