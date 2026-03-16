"""
Helper functions for calling Anthropic API.
"""
import os
import json
from anthropic import Anthropic

# Support both direct Anthropic API and OpenWebUI/proxy endpoints
api_key = os.environ.get("OPENWEBUI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
base_url = os.environ.get("OPENWEBUI_ENDPOINT")

if base_url:
    client = Anthropic(api_key=api_key, base_url=base_url)
else:
    client = Anthropic(api_key=api_key)

def generate_ai_review(system_prompt: str) -> dict:
    """
    Call Anthropic API to generate an AI review.

    Args:
        system_prompt: The formatted system prompt for the persona

    Returns:
        dict with keys: ratings, review, memorable_moment (optional)

    Raises:
        ValueError: If response is invalid JSON or missing required fields
        Exception: If Anthropic API call fails
    """

    try:
        # Use configured model or default to direct Anthropic model
        model = os.environ.get("OPENWEBUI_MODEL") or "claude-sonnet-4-20250514"

        message = client.messages.create(
            model=model,
            max_tokens=1000,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": "Generate the review now in the JSON format specified. Output ONLY the JSON, nothing else."
                }
            ]
        )

        # Extract the response text
        response_text = message.content[0].text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            # Remove ```json or ``` from start and ``` from end
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        # Parse JSON response
        review_data = json.loads(response_text)

        # Validate structure - ratings and review are required, memorable_moment is optional
        if "ratings" not in review_data:
            raise ValueError("Response missing required 'ratings' field")
        if "review" not in review_data:
            raise ValueError("Response missing required 'review' field")

        # memorable_moment is optional, so we don't check for it

        return review_data

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {e}")
    except Exception as e:
        raise Exception(f"Anthropic API error: {e}")
