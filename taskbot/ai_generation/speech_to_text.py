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
        "Summarize the following meeting transcript in 500-1000 words. "
        "Focus on the main points, decisions, and action items. "
        "Be concise but thorough.\n\n"
        f"Transcript:\n{transcript}"
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

if __name__ == "__main__":
    print(speech_to_text("harvard.wav"))


