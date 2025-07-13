FROM python:3.11

WORKDIR /app

# libopus0 for py-cord[voice] and ffmpeg for audio processing
RUN apt-get update && apt-get install -y libopus0 ffmpeg git

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "bot.py"] 