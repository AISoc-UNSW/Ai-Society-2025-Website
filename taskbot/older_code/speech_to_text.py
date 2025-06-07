from openai import OpenAI
from dotenv import load_dotenv
import os

# load .env file
load_dotenv()

def speech_to_text(audio_path):
    """
    Convert an audio file to text using gpt-4o-mini-transcribe.

    Args:
        audio_path (str): The path to the audio file.

    Returns:
        str: The text transcription of the audio file.
    """

    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    audio_file = open(audio_path, "rb")

    transcription = client.audio.transcriptions.create(
        model="gpt-4o-mini-transcribe", 
        file=audio_file
    )

    return transcription.text

if __name__ == "__main__":
    print(speech_to_text("harvard.wav"))

