import json

import psycopg2
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai import types
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from utils.config import config

# No global configure needed for the client approach: since everything is called from config (?) check ts

# Updated function signature to accept context IDs
def generate_tasks(script: str, source_meeting_id: int, portfolio_id: int | None = None):
    """
    Generate tasks from a meeting script using an AI model.

    Args:
      script (str): The meeting transcript.
      source_meeting_id (int): The ID of the meeting this script is from.
      portfolio_id (int, optional): The ID of the portfolio these tasks belong to. Defaults to None.

    Returns:
      list[dict]: A list of task dictionaries with nested subtasks. Each dictionary contains keys
                  like 'title', 'description', potentially 'deadline', 'priority',
                  and includes 'source_meeting_id' and 'portfolio_id' if provided.
                  Tasks may also contain a 'subtasks' field with nested task objects.
    """
    # Import datetime here to avoid name conflict
    from datetime import datetime, timedelta

    # Define the prompt for the AI with updated instructions for nested subtasks
    current_date = datetime.now().strftime("%Y-%m-%d")
    prompt = f"""
Analyze the following meeting transcript and extract actionable tasks.

For each task:
1. Create a SPECIFIC 'title' that clearly states the action required (use verb-noun format)
2. Write a DETAILED 'description' including context, requirements, and expected outcomes
3. Extract any deadline information into a 'deadline' field - ALWAYS use ISO 8601 format (YYYY-MM-DD) 
   when possible, calculating actual dates based on the current date {current_date}
4. Assign a priority level ('High', 'Medium', or 'Low') to EVERY task based on urgency mentioned 
   or implied in the transcript
5. If a task has subtasks, include them in a 'subtasks' array field

IMPORTANT - AVOID DUPLICATE TASKS:
- Before creating a new task, check if it's semantically similar to tasks you've already identified
- Consolidate similar tasks into a single, comprehensive task with clear subtasks
- If multiple people mention the same task or similar requirements, combine them into one task
- Focus on unique actions rather than creating separate tasks for slight variations of the same work

Group related tasks together, with main tasks containing their subtasks. For example, if "Create My Tasks page" 
is a main task, and "Add checkbox for task completion" is a detail of that task, make the second one a subtask 
of the first.

If priority or deadline is not explicitly mentioned, make a reasonable inference based on context.
NEVER return null for priority - always assign a value.

Format the output as a JSON list of objects, where each object represents a task.
Ensure the output is only the JSON list, without any introductory text or explanations.
Example format:
[
  {{
    "title": "Create My Tasks Page",
    "description": "Develop a new page to display tasks assigned to the current user.",
    "deadline": "YYYY-MM-DD",
    "priority": "High",
    "subtasks": [
      {{
        "title": "Add Task Completion Checkbox",
        "description": "Implement checkbox functionality for marking tasks as complete on the My Tasks page.",
        "deadline": "YYYY-MM-DD",
        "priority": "Medium"
      }}
    ]
  }}
]

Meeting Transcript:
---
{script}
---

Extracted Tasks (JSON):
"""

    try:
        # Initialize the client inside the function or globally if preferred
        # Ensure the API key is loaded correctly
        api_key = config.gemini_api_key
        if not api_key:
            print("Error: GEMINI_API_KEY not found in environment variables.")
            return []
        client = genai.Client(api_key=api_key)

        model_name = "gemini-1.5-flash"  # Or try "gemini-pro" if flash isn't found

        response = client.models.generate_content(
            model=model_name,  # Pass model name here
            contents=prompt,  # Pass prompt as contents
            config=types.GenerateContentConfig(
                max_output_tokens=8192, temperature=0.1, top_p=0.95, top_k=40
            ),
        )

        # Extract and parse the JSON response
        # Adding checks for safety
        if not response.candidates:
            print("Warning: No candidates received from AI.")
            print(f"Full response: {response}")  # Log full response for debugging
            return []

        # Accessing the text directly
        try:
            # Check if parts exist, common in newer structures even with Client
            if response.candidates[0].content and response.candidates[0].content.parts:
                json_text = response.candidates[0].content.parts[0].text
            else:
                # Fallback or alternative structure check if needed
                json_text = response.text  # Assuming response.text works directly
        except AttributeError:
            # If the above structure fails, try accessing response.text directly
            print(
                "Warning: Could not access response.candidates[0].content.parts[0].text, trying response.text."
            )
            if hasattr(response, "text"):
                json_text = response.text
            else:
                print("Error: Cannot extract text from AI response.")
                print(f"Full response: {response}")
                return []
        except IndexError:
            print("Error: Response candidates list is empty.")
            print(f"Full response: {response}")
            return []

        try:
            # Clean up the response text to remove markdown code block markers if present
            json_text = json_text.strip()
            if json_text.startswith("```") and json_text.endswith("```"):
                # Extract content between the markdown code block markers
                json_text = json_text[json_text.find("\n") + 1 : json_text.rfind("```")].strip()
            elif json_text.startswith("```json"):
                # Handle case with language specifier
                json_text = json_text[7 : json_text.rfind("```")].strip()

            # Attempt to parse the JSON string
            tasks = json.loads(json_text)
            if not isinstance(tasks, list):  # Ensure the top level is a list
                print(f"Warning: AI response was not a JSON list. Got: {type(tasks)}")
                return []
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from AI response: {e}")
            print(f"Raw response text: {json_text}")
            return []  # Return empty list on error
        except Exception as e:  # Catch other potential errors during loading
            print(f"An unexpected error occurred during JSON parsing: {e}")
            print(f"Raw response text: {json_text}")
            return []

        # Process tasks but keep the nested structure
        def process_task(task):
            # Add basic fields
            task["source_meeting_id"] = source_meeting_id
            if portfolio_id:
                task["portfolio_id"] = portfolio_id

            # Ensure optional fields exist
            task.setdefault("deadline", None)
            task.setdefault("priority", "Medium")  # Default to Medium priority

            # Convert relative deadlines to actual dates
            if task.get("deadline") == "This week":
                today = datetime.now()
                days_until_friday = (4 - today.weekday()) % 7  # 4 = Friday
                friday = today + timedelta(days=days_until_friday)
                task["deadline"] = friday.strftime("%Y-%m-%d")

            # Process subtasks recursively if they exist
            if "subtasks" in task and isinstance(task["subtasks"], list):
                for subtask in task["subtasks"]:
                    process_task(subtask)

            return task

        # Process all top-level tasks
        processed_tasks = []
        for task in tasks:
            if isinstance(task, dict) and "title" in task and "description" in task:
                processed_task = process_task(task)
                processed_tasks.append(processed_task)
            else:
                print(f"Warning: Skipping invalid task format in AI response: {task}")

        return processed_tasks

    except Exception as e:
        # Handle potential API errors or other exceptions during generation
        print(f"An error occurred during task generation: {e}")
        # Log the type of exception for better debugging
        print(f"Exception type: {type(e)}")
        return []


# Example Usage which generates tasks and saves them to a file

# if __name__ == '__main__':
#   # Replace with actual script content and IDs
#   example_script = open('./sample_script.txt', 'r').read()
#   meeting_id = 1
#   portfolio_id = 101
#   generated_tasks = generate_tasks(example_script, meeting_id, portfolio_id)
#   print("Generated Tasks:")
#   import pprint
#   pprint.pprint(generated_tasks)

#   with open('tasks_output_5.json', 'w') as f:
#       json.dump(generated_tasks, f, indent=2)


def process_meeting_transcript(script, meeting_id, portfolio_id=None):
    """
    Process a meeting transcript to generate tasks and insert them into the database.

    Args:
        script (str): The meeting transcript text
        meeting_id (int): The ID of the meeting this script is from
        portfolio_id (int, optional): The ID of the portfolio these tasks belong to

    Returns:
        list: List of top-level task IDs that were created
    """
    # Import here to avoid circular imports
    from utils.insert_tasks_to_db import insert_tasks_to_db_direct

    # Load environment variables
    load_dotenv()

    # Generate tasks from the transcript
    tasks = generate_tasks(script, meeting_id, portfolio_id)

    if not tasks:
        print("No tasks were generated from the transcript.")
        return []

    # Get PostgreSQL connection parameters
    user = config.POSTGRES_USER
    password = config.POSTGRES_PASSWORD
    host = config.POSTGRES_HOST
    port = config.POSTGRES_PORT
    dbname = config.POSTGRES_DB

    if not password:
        print("Error: Database password not found in environment variables.")
        return []

    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(user=user, password=password, host=host, port=port, dbname=dbname)
        print("Database connection successful!")

        # Create an SQLAlchemy engine from your connection
        engine = create_engine("postgresql+psycopg2://", creator=lambda: conn)

        # Create a sessionmaker
        Session = sessionmaker(bind=engine)

        # Create a session
        session = Session()

        try:
            # Now use the session instead of the connection
            task_ids = insert_tasks_to_db_direct(tasks, session)

            # Close the session when done
            session.close()
            print("Database connection closed.")

            print(f"Successfully processed transcript and created {len(task_ids)} top-level tasks.")
            return task_ids

        except Exception as e:
            print(f"Error processing meeting transcript: {e}")
            return []

    except Exception as e:
        print(f"Error processing meeting transcript: {e}")
        return []


# Example Usage which generates tasks and saves them to the database

if __name__ == "__main__":
    # Replace with actual script content and IDs
    example_script = open("./sample_script.txt", "r").read()
    meeting_id = 1
    portfolio_id = 101
    process_meeting_transcript(example_script, meeting_id, portfolio_id)
