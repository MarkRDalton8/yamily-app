#!/usr/bin/env python3
"""
Quick test script for AI Persona Invite feature (EN-010)
This bypasses normal timing constraints for immediate testing.
"""

import requests
import json
from datetime import datetime, timedelta

API_URL = "http://32.192.255.113:8000"

def test_ai_persona_invite():
    """Test the full AI persona invite flow"""

    print("=" * 60)
    print("AI PERSONA INVITE FEATURE TEST")
    print("=" * 60)
    print()

    # Get your auth token
    print("1. Login to get token...")
    email = input("   Enter your email: ")
    password = input("   Enter your password: ")

    login_response = requests.post(
        f"{API_URL}/login",
        data={"username": email, "password": password}
    )

    if login_response.status_code != 200:
        print(f"   ❌ Login failed: {login_response.text}")
        return

    token = login_response.json()["access_token"]
    print("   ✅ Logged in successfully")
    print()

    # Create event with AI guest
    print("2. Creating event with AI persona invite...")

    # Event time is NOW so scheduled comment will be due immediately
    event_time = datetime.now() - timedelta(hours=1)  # 1 hour ago

    event_data = {
        "title": "AI Persona Test Event",
        "description": "Testing the AI persona invite system",
        "event_date": event_time.isoformat(),
        "ai_guests": [
            {
                "ai_persona_type": "karen",
                "ai_persona_name": "Test Karen"
            }
        ]
    }

    create_response = requests.post(
        f"{API_URL}/events",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json=event_data
    )

    if create_response.status_code != 200:
        print(f"   ❌ Event creation failed: {create_response.text}")
        return

    event = create_response.json()
    event_id = event["id"]
    print(f"   ✅ Event created (ID: {event_id})")
    print()

    # Start the event
    print("3. Starting event (changing status to 'live')...")

    start_response = requests.post(
        f"{API_URL}/events/{event_id}/start",
        headers={"Authorization": f"Bearer {token}"}
    )

    if start_response.status_code != 200:
        print(f"   ❌ Failed to start event: {start_response.text}")
        return

    print("   ✅ Event started")
    print()

    # Manually trigger AI background job
    print("4. Triggering AI guest background job...")

    bg_response = requests.post(f"{API_URL}/admin/process-ai-guests")

    if bg_response.status_code == 200:
        result = bg_response.json()
        print(f"   ✅ Background job complete:")
        print(f"      - Comments generated: {result['comments_generated']}")
        print(f"      - Photo reactions: {result['photo_reactions_generated']}")
        print(f"      - Errors: {len(result['errors'])}")
        if result['errors']:
            for error in result['errors']:
                print(f"        • {error}")
    else:
        print(f"   ⚠️  Background job response: {bg_response.text}")
    print()

    # Check for comments
    print("5. Checking for AI comments...")

    comments_response = requests.get(
        f"{API_URL}/events/{event_id}/comments",
        headers={"Authorization": f"Bearer {token}"}
    )

    if comments_response.status_code == 200:
        comments = comments_response.json()
        ai_comments = [c for c in comments if c.get('is_ai_generated')]

        if ai_comments:
            print(f"   ✅ Found {len(ai_comments)} AI comment(s)!")
            for comment in ai_comments:
                print(f"      🤖 {comment['commenter_name']}: {comment['comment_text']}")
        else:
            print(f"   ℹ️  No AI comments yet (found {len(comments)} total comments)")
    else:
        print(f"   ⚠️  Failed to fetch comments: {comments_response.text}")
    print()

    # End event and check for auto-review
    print("6. Ending event (should auto-generate AI review)...")

    end_response = requests.post(
        f"{API_URL}/events/{event_id}/end",
        headers={"Authorization": f"Bearer {token}"}
    )

    if end_response.status_code == 200:
        print("   ✅ Event ended")
    else:
        print(f"   ❌ Failed to end event: {end_response.text}")
    print()

    # Check for reviews
    print("7. Checking for AI review...")

    reviews_response = requests.get(f"{API_URL}/events/{event_id}/reviews")

    if reviews_response.status_code == 200:
        reviews = reviews_response.json()
        ai_reviews = [r for r in reviews if r.get('is_ai_generated')]

        if ai_reviews:
            print(f"   ✅ Found {len(ai_reviews)} AI review(s)!")
            for review in ai_reviews:
                print(f"      🤖 {review['display_name']}")
                print(f"         Review: {review['review_text'][:100]}...")
        else:
            print(f"   ℹ️  No AI reviews yet (found {len(reviews)} total reviews)")
    else:
        print(f"   ⚠️  Failed to fetch reviews: {reviews_response.text}")
    print()

    print("=" * 60)
    print(f"View event at: https://yamily-app.vercel.app/events/{event_id}")
    print("=" * 60)


if __name__ == "__main__":
    test_ai_persona_invite()
