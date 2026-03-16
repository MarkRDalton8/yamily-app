"""
Helper functions for calling Anthropic API or OpenWebUI proxy.
"""
import os
import json
import requests

def generate_ai_review(system_prompt: str) -> dict:
    """
    Call Anthropic API or OpenWebUI to generate an AI review.

    Args:
        system_prompt: The formatted system prompt for the persona

    Returns:
        dict with keys: ratings, review, memorable_moment (optional)

    Raises:
        ValueError: If response is invalid JSON or missing required fields
        Exception: If API call fails
    """

    # Check if using OpenWebUI or direct Anthropic
    openwebui_endpoint = os.environ.get("OPENWEBUI_ENDPOINT")
    openwebui_key = os.environ.get("OPENWEBUI_API_KEY")
    openwebui_model = os.environ.get("OPENWEBUI_MODEL")

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")

    try:
        if openwebui_endpoint and openwebui_key:
            # Try OpenWebUI/OpenAI-compatible format first
            try:
                response_text = _call_openwebui(
                    endpoint=openwebui_endpoint,
                    api_key=openwebui_key,
                    model=openwebui_model or "claude-sonnet-4-20250514",
                    system_prompt=system_prompt
                )
            except Exception as openwebui_error:
                # If OpenWebUI fails with 405, try Anthropic SDK with base_url
                if "405" in str(openwebui_error):
                    response_text = _call_anthropic_with_proxy(
                        base_url=openwebui_endpoint,
                        api_key=openwebui_key,
                        model=openwebui_model or "claude-sonnet-4-20250514",
                        system_prompt=system_prompt
                    )
                else:
                    raise
        elif anthropic_key:
            # Use direct Anthropic API
            response_text = _call_anthropic(
                api_key=anthropic_key,
                system_prompt=system_prompt
            )
        else:
            raise Exception("No API key configured. Set either OPENWEBUI_API_KEY or ANTHROPIC_API_KEY")

        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        # Parse JSON response
        review_data = json.loads(response_text)

        # Validate structure
        if "ratings" not in review_data:
            raise ValueError("Response missing required 'ratings' field")
        if "review" not in review_data:
            raise ValueError("Response missing required 'review' field")

        return review_data

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {e}")
    except Exception as e:
        raise Exception(f"AI API error: {e}")


def _call_openwebui(endpoint: str, api_key: str, model: str, system_prompt: str) -> str:
    """Call OpenWebUI using OpenAI-compatible API format."""
    # Piano/Cxense OpenWebUI uses /api/chat/completions (not /v1/chat/completions)
    endpoint = endpoint.rstrip('/')
    api_url = f'{endpoint}/api/chat/completions'

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    payload = {
        'model': model,
        'messages': [
            {
                'role': 'system',
                'content': system_prompt
            },
            {
                'role': 'user',
                'content': 'Generate the review now in the JSON format specified. Output ONLY the JSON, nothing else.'
            }
        ],
        'max_tokens': 1000,
        'temperature': 0.7
    }

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content'].strip()
    except requests.exceptions.HTTPError as e:
        # Log detailed error for debugging
        error_detail = f"HTTP {e.response.status_code} from {api_url}"
        try:
            error_body = e.response.json()
            error_detail += f": {error_body}"
        except:
            error_detail += f": {e.response.text}"
        raise Exception(error_detail)


def _call_anthropic(api_key: str, system_prompt: str) -> str:
    """Call direct Anthropic API."""
    from anthropic import Anthropic

    client = Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": "Generate the review now in the JSON format specified. Output ONLY the JSON, nothing else."
            }
        ]
    )

    return message.content[0].text.strip()


def _call_anthropic_with_proxy(base_url: str, api_key: str, model: str, system_prompt: str) -> str:
    """Call Anthropic API through a proxy endpoint."""
    from anthropic import Anthropic

    client = Anthropic(api_key=api_key, base_url=base_url)

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

    return message.content[0].text.strip()
