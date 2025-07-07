from openai import OpenAI
from dotenv import load_dotenv
import os

# Changed this file to use gpt-4o-mini-transcribe for audio transcription
# and gpt-4o for summarization.

# First, load .env file and get client (which can be used for both models)
load_dotenv()
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def speech_to_text(audio_path):
    """
    Convert an audio file to text using gpt-4o-mini-transcribe.
    Will also return a summary of the transcription.

    Args:
        audio_path (str): The path to the audio file.

    Returns:
        str: The text transcription of the audio file.
    """
    audio_file = open(audio_path, "rb")

    transcription = client.audio.transcriptions.create(
        model="gpt-4o-mini-transcribe", 
        file=audio_file
    )

    summary_of_transcript = summary(transcription.text)
    
    return transcription.text, summary_of_transcript

def summary(transcript):
    """
    Writes a 500-1000 word summary of the meeting transcript using OpenAI GPT-4o.

    Args:
        transcript (str): The text transcription of the audio file.

    Returns:
        str: The text summary of the transcription.
    """
    if not transcript:
        return "Error: No transcript exists to summarize."
    
    prompt = (
        """You are a professional meeting-minutes assistant. After reading the transcript below, write a structured summary (approximately 500-1000 words) that:\n
        1. **Context (1-2 sentences)** — State the meeting's purpose, date, and key participants.\n
        2. **Discussion Highlights** — Capture the main topics in logical order, grouping related points.\n
        3. **Decisions Made** — List each decision, including the rationale and the person/team responsible.\n
        4. **Action Items** — For every task, specify the owner, deadline, and any dependencies.\n
        5. **Open Questions / Follow-Ups** — Note unresolved issues or items requiring clarification.\n
        6. **Next Steps** — Summarize immediate priorities and timelines.\n\n
        Style & Constraints:\n
        1. Write in concise, professional prose (no bullet-point fragments longer than two lines).\n
        2. Paraphrase rather than quote verbatim unless wording is critical.\n
        3. Avoid filler, repetition, or speaker IDs.\n
        4. Keep the total length under 1000 words.\n\n
        Exceptions:
        1. If the transcript is within the length of 200-500 words, in which case you can write a summary of 200-300 words following the above constraints.\n
        2. If the transcript is less than 200 words but above 100 words, write a summary of 100-150 words following the above constraints.\n
        3. If the transcript is less than 100 words, write a summary of 50-100 words following the above constraints.\n\n
        Transcript:\n{transcript}"""
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes meeting transcripts. Ensure that the meeting summary does not consist of swear words or words that are racist, rude, or harmful towards any individual."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2048,
        temperature=0.3,
    )

    return response.choices[0].message.content.strip()



