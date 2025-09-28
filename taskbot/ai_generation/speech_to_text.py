import os
import subprocess
import tempfile
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI
import asyncio

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _compress_for_stt(src_path: str) -> str:
    """
    Downmix and compress audio to a small, STT-friendly format to avoid request-size errors.
    - Mono, 16 kHz, ~64 kbps AAC in .m4a
    """
    tmp_dir = tempfile.mkdtemp(prefix="stt_")
    dst_path = os.path.join(tmp_dir, "audio.m4a")
    # Requires ffmpeg in PATH
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i", src_path,
            "-ac", "1",            # mono
            "-ar", "16000",        # 16 kHz
            "-b:a", "64k",         # ~64 kbps
            dst_path,
        ],
        check=True,
        capture_output=True,
    )
    return dst_path

async def _compress_for_stt_async(src_path: str) -> str:
    """
    Async variant of audio compression using ffmpeg via subprocess without blocking the event loop.
    Returns the destination path.
    """
    tmp_dir = tempfile.mkdtemp(prefix="stt_")
    dst_path = os.path.join(tmp_dir, "audio.m4a")

    process = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-y",
        "-i", src_path,
        "-ac", "1",
        "-ar", "16000",
        "-b:a", "64k",
        dst_path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()
    rc = process.returncode if process.returncode is not None else -1
    if rc != 0:
        raise subprocess.CalledProcessError(rc, "ffmpeg", output=stdout, stderr=stderr)
    return dst_path

def speech_to_text(audio_path: str):
    """
    Convert an audio file to text using gpt-4o-transcribe, then summarize it.
    Returns (transcript, summary).
    """
    src = audio_path
    # If it's a big file or a raw WAV, compress before upload
    should_compress = (
        Path(src).suffix.lower() == ".wav"
        or os.path.getsize(src) > 20 * 1024 * 1024  # ~20MB heuristic
    )

    comp = None
    try:
        comp = _compress_for_stt(src) if should_compress else src
        with open(comp, "rb") as f:
            transcription = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=f,
            )
        text = transcription.text or ""
        if not text:
            raise RuntimeError("Empty transcription from STT")
        summary_of_transcript = summary(text)
        return transcription.text, summary_of_transcript
    finally:
        if comp and comp != src:
            # Clean up temp file
            try:
                os.remove(comp)
            except OSError:
                pass

def summary(transcript: str) -> str:
    """
    Writes a 500-1000 word summary of the meeting transcript.
    """
    if not transcript:
        return "Error: No transcript exists to summarize."

    prompt = (
        f"""You are a professional meeting-minutes assistant. After reading the transcript below, write a structured summary (approximately 500-1000 words) that:

        1. Context (1-2 sentences) — State the meeting's purpose, date, and key participants.
        2. Discussion Highlights — Capture the main topics in logical order, grouping related points.
        3. Decisions Made — List each decision, including the rationale and the person/team responsible.
        4. Action Items — For every task, specify the owner, deadline, and any dependencies.
        5. Open Questions / Follow-Ups — Note unresolved issues or items requiring clarification.
        6. Next Steps — Summarize immediate priorities and timelines.

        Style & Constraints:
        1. Write in concise, professional prose (no bullet-point fragments longer than two lines).
        2. Paraphrase rather than quote verbatim unless wording is critical.
        3. Avoid filler, repetition, or speaker IDs.
        4. Keep the total length under 1000 words.

        Exceptions:
        1. If the transcript is within the length of 200-500 words, in which case you can write a summary of 200-300 words following the above constraints.
        2. If the transcript is less than 200 words but above 100 words, write a summary of 100-150 words following the above constraints.
        3. If the transcript is less than 100 words, write a summary of 50-100 words following the above constraints.

        Transcript:
{transcript}"""
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes meeting transcripts. Ensure that the meeting summary does not consist of swear words or words that are racist, rude, or harmful towards any individual."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=2048,
        temperature=0.3,
    )
    content = response.choices[0].message.content or ""
    return content.strip()

async def summary_async(transcript: str) -> str:
    """
    Async version of summary generation using Chat Completions.
    """
    if not transcript:
        return "Error: No transcript exists to summarize."

    prompt = (
        f"""You are a professional meeting-minutes assistant. After reading the transcript below, write a structured summary (approximately 500-1000 words) that:

        1. Context (1-2 sentences) — State the meeting's purpose, date, and key participants.
        2. Discussion Highlights — Capture the main topics in logical order, grouping related points.
        3. Decisions Made — List each decision, including the rationale and the person/team responsible.
        4. Action Items — For every task, specify the owner, deadline, and any dependencies.
        5. Open Questions / Follow-Ups — Note unresolved issues or items requiring clarification.
        6. Next Steps — Summarize immediate priorities and timelines.

        Style & Constraints:
        1. Write in concise, professional prose (no bullet-point fragments longer than two lines).
        2. Paraphrase rather than quote verbatim unless wording is critical.
        3. Avoid filler, repetition, or speaker IDs.
        4. Keep the total length under 1000 words.

        Exceptions:
        1. If the transcript is within the length of 200-500 words, in which case you can write a summary of 200-300 words following the above constraints.
        2. If the transcript is less than 200 words but above 100 words, write a summary of 100-150 words following the above constraints.
        3. If the transcript is less than 100 words, write a summary of 50-100 words following the above constraints.

        Transcript:
{transcript}"""
    )

    response = await async_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes meeting transcripts. Ensure that the meeting summary does not consist of swear words or words that are racist, rude, or harmful towards any individual."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=2048,
        temperature=0.3,
    )
    content = response.choices[0].message.content or ""
    return content.strip()

async def speech_to_text_async(audio_path: str):
    """
    Async version of speech_to_text to avoid blocking the event loop.
    Converts audio to text using gpt-4o-mini-transcribe, then summarizes it.
    Returns (transcript, summary).
    """
    src = audio_path
    should_compress = (
        Path(src).suffix.lower() == ".wav"
        or os.path.getsize(src) > 20 * 1024 * 1024
    )

    comp = None
    try:
        comp = await _compress_for_stt_async(src) if should_compress else src
        # Opening the file handle is cheap; leave as sync I/O
        with open(comp, "rb") as f:
            transcription = await async_client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=f,
            )
        text = getattr(transcription, "text", "") or ""
        if not text:
            raise RuntimeError("Empty transcription from STT")
        summary_of_transcript = await summary_async(text)
        return text, summary_of_transcript
    finally:
        if comp and comp != src:
            try:
                os.remove(comp)
            except OSError:
                pass



