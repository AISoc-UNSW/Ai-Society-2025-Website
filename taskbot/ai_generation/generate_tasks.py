import json
from openai import OpenAI, AsyncOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

# No global configure needed for the client approach: since everything is called from config (?) check ts
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
async_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
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
        # Use OpenAI Chat Completions with gpt-4.1-nano (follow summary() pattern)
        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[
                {
                    "role": "system",
                    "content": "You extract actionable tasks from meeting transcripts and return only valid JSON (a top-level list of task objects). Avoid profanity or harmful content.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.1,
        )

        # Extract and parse the JSON response
        try:
            content = response.choices[0].message.content
            if not content:
                print("Warning: Empty content in AI response.")
                print(f"Full response: {response}")
                return []
            if not isinstance(content, str):
                print("Warning: Non-string content in AI response.")
                print(f"Full response: {response}")
                return []
            json_text = content.strip()
        except Exception:
            print("Error: Could not extract text from AI response.")
            print(f"Full response: {response}")
            return []

        try:
            # Clean up the response text to remove markdown code block markers if present
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

async def generate_tasks_async(script: str, source_meeting_id: int, portfolio_id: int | None = None):
    """
    Async variant of generate_tasks to avoid blocking the event loop.
    """
    from datetime import datetime, timedelta

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
  {
    "title": "Create My Tasks Page",
    "description": "Develop a new page to display tasks assigned to the current user.",
    "deadline": "YYYY-MM-DD",
    "priority": "High",
    "subtasks": [
      {
        "title": "Add Task Completion Checkbox",
        "description": "Implement checkbox functionality for marking tasks as complete on the My Tasks page.",
        "deadline": "YYYY-MM-DD",
        "priority": "Medium"
      }
    ]
  }
]

Meeting Transcript:
---
{script}
---

Extracted Tasks (JSON):
"""

    try:
        response = await async_client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[
                {
                    "role": "system",
                    "content": "You extract actionable tasks from meeting transcripts and return only valid JSON (a top-level list of task objects). Avoid profanity or harmful content.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.1,
        )

        try:
            content = response.choices[0].message.content
            if not content or not isinstance(content, str):
                return []
            json_text = content.strip()
        except Exception:
            return []

        try:
            if json_text.startswith("```") and json_text.endswith("```"):
                json_text = json_text[json_text.find("\n") + 1 : json_text.rfind("```")].strip()
            elif json_text.startswith("```json"):
                json_text = json_text[7 : json_text.rfind("```")].strip()

            tasks = json.loads(json_text)
            if not isinstance(tasks, list):
                return []
        except Exception:
            return []

        def process_task(task: dict):
            task["source_meeting_id"] = source_meeting_id
            if portfolio_id:
                task["portfolio_id"] = portfolio_id
            task.setdefault("deadline", None)
            task.setdefault("priority", "Medium")

            if task.get("deadline") == "This week":
                today = datetime.now()
                days_until_friday = (4 - today.weekday()) % 7
                friday = today + timedelta(days=days_until_friday)
                task["deadline"] = friday.strftime("%Y-%m-%d")

            if "subtasks" in task and isinstance(task["subtasks"], list):
                for subtask in task["subtasks"]:
                    process_task(subtask)
            return task

        processed_tasks: list[dict] = []
        for task in tasks:
            if isinstance(task, dict) and "title" in task and "description" in task:
                processed_tasks.append(process_task(task))
        return processed_tasks
    except Exception:
        return []

