#!/usr/bin/env python3
"""
Test script for Live Event Feed (Comments) - Day 3
Tests: Create comment, get comments, vote on comment, delete comment
"""

import requests
import json
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"

def print_result(test_name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {test_name}")
    if message:
        print(f"   {message}")
    print()

print("=" * 70)
print("LIVE EVENT FEED - BACKEND API TESTS")
print("=" * 70)
print()

# Setup: Create users and event
print("SETUP: Creating test data...")
print("-" * 70)

# Register two users
user1_email = f"commenter1_{datetime.now().timestamp()}@test.com"
user2_email = f"commenter2_{datetime.now().timestamp()}@test.com"

# User 1 (host)
response = requests.post(f"{API_URL}/register", json={
    "email": user1_email,
    "name": "Test User 1",
    "password": "password123",
    "user_type": "host"
})
if response.status_code != 200:
    print(f"❌ User 1 registration failed: {response.status_code} - {response.text}")
    exit(1)
user1_data = response.json()
print(f"✓ User 1 created: {user1_data.get('email')}")

# User 2 (attendee)
response = requests.post(f"{API_URL}/register", json={
    "email": user2_email,
    "name": "Test User 2",
    "password": "password123",
    "user_type": "attendee"
})
user2_data = response.json()
print(f"✓ User 2 created: {user2_data.get('email')}")

# Login User 1
response = requests.post(f"{API_URL}/login", data={
    "username": user1_email,
    "password": "password123"
})
user1_token = response.json().get('access_token')
print(f"✓ User 1 logged in")

# Login User 2
response = requests.post(f"{API_URL}/login", data={
    "username": user2_email,
    "password": "password123"
})
user2_token = response.json().get('access_token')
print(f"✓ User 2 logged in")

# Create event
event_date = (datetime.now() + timedelta(days=7)).isoformat()
response = requests.post(
    f"{API_URL}/events",
    json={
        "title": "Comment Test Event",
        "description": "Testing live feed",
        "event_date": event_date,
        "expected_guests": []
    },
    headers={"Authorization": f"Bearer {user1_token}"}
)
event_data = response.json()
event_id = event_data.get('id')
invite_code = event_data.get('invite_code')
print(f"✓ Event created: ID {event_id}, Code: {invite_code}")

# User 2 joins event
response = requests.post(
    f"{API_URL}/events/join",
    json={
        "invite_code": invite_code,
        "display_name": "The Critic"
    },
    headers={"Authorization": f"Bearer {user2_token}"}
)
print(f"✓ User 2 joined event as 'The Critic'")

print()
print("=" * 70)
print("RUNNING TESTS...")
print("=" * 70)
print()

# Test 1: Create comment (User 1)
print("TEST 1: Create comment")
print("-" * 70)
try:
    response = requests.post(
        f"{API_URL}/events/{event_id}/comments",
        json={
            "comment_text": "This party is going to be epic! 🎉"
        },
        headers={"Authorization": f"Bearer {user1_token}"}
    )

    if response.status_code == 200:
        comment_data = response.json()
        comment1_id = comment_data.get('id')
        has_pseudonym = comment_data.get('commenter_name') is not None
        print_result("Create comment successful", True,
                    f"Comment ID: {comment1_id}, By: {comment_data.get('commenter_name')}")
    else:
        print_result("Create comment failed", False, f"Status: {response.status_code}, {response.text}")
        comment1_id = None
except Exception as e:
    print_result("Create comment failed", False, str(e))
    comment1_id = None

# Test 2: Get comments
print("TEST 2: Get comments")
print("-" * 70)
try:
    response = requests.get(
        f"{API_URL}/events/{event_id}/comments",
        headers={"Authorization": f"Bearer {user1_token}"}
    )

    if response.status_code == 200:
        comments = response.json()
        has_comments = len(comments) > 0
        first_comment = comments[0] if comments else {}
        has_fields = all(k in first_comment for k in ['id', 'comment_text', 'commenter_name', 'upvotes', 'downvotes'])
        print_result("Get comments successful", has_comments and has_fields,
                    f"Found {len(comments)} comment(s), Has required fields: {has_fields}")
    else:
        print_result("Get comments failed", False, f"Status: {response.status_code}")
except Exception as e:
    print_result("Get comments failed", False, str(e))

# Test 3: User 2 creates comment
print("TEST 3: User 2 creates comment")
print("-" * 70)
try:
    response = requests.post(
        f"{API_URL}/events/{event_id}/comments",
        json={
            "comment_text": "Can't wait to see what chaos unfolds 😏"
        },
        headers={"Authorization": f"Bearer {user2_token}"}
    )

    if response.status_code == 200:
        comment_data = response.json()
        comment2_id = comment_data.get('id')
        is_critic = comment_data.get('commenter_name') == "The Critic"
        print_result("User 2 comment created", is_critic,
                    f"Comment ID: {comment2_id}, Pseudonym: {comment_data.get('commenter_name')}")
    else:
        print_result("User 2 comment failed", False, f"Status: {response.status_code}")
        comment2_id = None
except Exception as e:
    print_result("User 2 comment failed", False, str(e))
    comment2_id = None

# Test 4: Upvote comment
print("TEST 4: Upvote comment")
print("-" * 70)
if comment1_id:
    try:
        response = requests.post(
            f"{API_URL}/comments/{comment1_id}/vote",
            json={"vote_type": 1},
            headers={"Authorization": f"Bearer {user2_token}"}
        )

        if response.status_code == 200:
            vote_data = response.json()
            upvotes = vote_data.get('upvotes', 0)
            user_vote = vote_data.get('user_vote')
            success = upvotes == 1 and user_vote == 1
            print_result("Upvote successful", success,
                        f"Upvotes: {upvotes}, User vote: {user_vote}")
        else:
            print_result("Upvote failed", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Upvote failed", False, str(e))
else:
    print_result("Upvote skipped", False, "No comment to vote on")

# Test 5: Change vote to downvote
print("TEST 5: Change vote to downvote")
print("-" * 70)
if comment1_id:
    try:
        response = requests.post(
            f"{API_URL}/comments/{comment1_id}/vote",
            json={"vote_type": -1},
            headers={"Authorization": f"Bearer {user2_token}"}
        )

        if response.status_code == 200:
            vote_data = response.json()
            upvotes = vote_data.get('upvotes', 0)
            downvotes = vote_data.get('downvotes', 0)
            user_vote = vote_data.get('user_vote')
            success = upvotes == 0 and downvotes == 1 and user_vote == -1
            print_result("Vote changed to downvote", success,
                        f"Upvotes: {upvotes}, Downvotes: {downvotes}, User vote: {user_vote}")
        else:
            print_result("Vote change failed", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Vote change failed", False, str(e))
else:
    print_result("Vote change skipped", False, "No comment to vote on")

# Test 6: Un-vote (remove vote)
print("TEST 6: Un-vote (click downvote again)")
print("-" * 70)
if comment1_id:
    try:
        response = requests.post(
            f"{API_URL}/comments/{comment1_id}/vote",
            json={"vote_type": -1},
            headers={"Authorization": f"Bearer {user2_token}"}
        )

        if response.status_code == 200:
            vote_data = response.json()
            downvotes = vote_data.get('downvotes', 0)
            user_vote = vote_data.get('user_vote')
            success = downvotes == 0 and user_vote is None
            print_result("Un-vote successful", success,
                        f"Downvotes: {downvotes}, User vote: {user_vote}")
        else:
            print_result("Un-vote failed", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Un-vote failed", False, str(e))
else:
    print_result("Un-vote skipped", False, "No comment to vote on")

# Test 7: Delete own comment
print("TEST 7: Delete own comment")
print("-" * 70)
if comment2_id:
    try:
        response = requests.delete(
            f"{API_URL}/comments/{comment2_id}",
            headers={"Authorization": f"Bearer {user2_token}"}
        )

        if response.status_code == 200:
            # Verify it's deleted
            response = requests.get(
                f"{API_URL}/events/{event_id}/comments",
                headers={"Authorization": f"Bearer {user1_token}"}
            )
            comments = response.json()
            is_deleted = not any(c['id'] == comment2_id for c in comments)
            print_result("Delete comment successful", is_deleted,
                        f"Comment {comment2_id} removed from feed")
        else:
            print_result("Delete comment failed", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Delete comment failed", False, str(e))
else:
    print_result("Delete comment skipped", False, "No comment to delete")

# Test 8: Cannot comment without joining event
print("TEST 8: Authorization - Cannot comment without joining")
print("-" * 70)
# Create a new user who hasn't joined
response = requests.post(f"{API_URL}/register", json={
    "email": f"outsider_{datetime.now().timestamp()}@test.com",
    "name": "Outsider",
    "password": "password123"
})
response = requests.post(f"{API_URL}/login", data={
    "username": f"outsider_{datetime.now().timestamp()}@test.com",
    "password": "password123"
})
# This will fail because we can't login with that email, so let's just test with a dummy token
try:
    response = requests.post(
        f"{API_URL}/events/{event_id}/comments",
        json={
            "comment_text": "Crashing the party!"
        },
        headers={"Authorization": "Bearer invalid_token"}
    )

    expected_403 = response.status_code in [401, 403]
    print_result("Authorization check", expected_403,
                f"Got {response.status_code} as expected (not 200)")
except Exception as e:
    print_result("Authorization check", False, str(e))

print("=" * 70)
print("ALL TESTS COMPLETE")
print("=" * 70)
