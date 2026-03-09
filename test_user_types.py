#!/usr/bin/env python3
"""
Test script for user type system (host/attendee)
Tests: normal registration, welcome screen flow, invite link registration, upgrade to host
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

# Test 1: Register as attendee (normal flow without welcome screen for testing)
print("=" * 60)
print("TEST 1: Register user as attendee (no welcome screen)")
print("=" * 60)
try:
    response = requests.post(f"{API_URL}/register", json={
        "email": "attendee@test.com",
        "name": "Test Attendee",
        "password": "password123",
        "user_type": "attendee"
    })

    if response.status_code == 200:
        data = response.json()
        print_result("Register attendee", True, f"User type: {data.get('user_type')}")
        attendee_created = data.get('user_type') == 'attendee'
    else:
        print_result("Register attendee", False, f"Status: {response.status_code}, Error: {response.text}")
        attendee_created = False
except Exception as e:
    print_result("Register attendee", False, str(e))
    attendee_created = False

# Test 2: Register as host (simulating welcome screen choice)
print("=" * 60)
print("TEST 2: Register user as host (simulating welcome screen)")
print("=" * 60)
try:
    response = requests.post(f"{API_URL}/register", json={
        "email": "host@test.com",
        "name": "Test Host",
        "password": "password123",
        "user_type": "host"
    })

    if response.status_code == 200:
        data = response.json()
        print_result("Register host", True, f"User type: {data.get('user_type')}")
        host_email = data.get('email')
    else:
        print_result("Register host", False, f"Status: {response.status_code}")
        host_email = None
except Exception as e:
    print_result("Register host", False, str(e))
    host_email = None

# Test 3: Login and check user_type in response
print("=" * 60)
print("TEST 3: Login should return user_type")
print("=" * 60)
try:
    response = requests.post(f"{API_URL}/login", data={
        "username": "host@test.com",
        "password": "password123"
    })

    if response.status_code == 200:
        data = response.json()
        has_user_type = 'user_type' in data
        print_result("Login returns user_type", has_user_type,
                    f"User type in response: {data.get('user_type')}")
        host_token = data.get('access_token')
    else:
        print_result("Login returns user_type", False, f"Login failed: {response.status_code}")
        host_token = None
except Exception as e:
    print_result("Login returns user_type", False, str(e))
    host_token = None

# Test 4: Create event as host
print("=" * 60)
print("TEST 4: Host creates event")
print("=" * 60)
if host_token:
    try:
        event_date = (datetime.now() + timedelta(days=7)).isoformat()
        response = requests.post(
            f"{API_URL}/events",
            json={
                "title": "User Type Test Event",
                "description": "Testing user type system",
                "event_date": event_date,
                "expected_guests": ["Alice", "Bob"]
            },
            headers={"Authorization": f"Bearer {host_token}"}
        )

        if response.status_code == 200:
            data = response.json()
            invite_code = data.get('invite_code')
            event_id = data.get('id')
            print_result("Host creates event", True, f"Invite code: {invite_code}")
        else:
            print_result("Host creates event", False, f"Status: {response.status_code}")
            invite_code = None
            event_id = None
    except Exception as e:
        print_result("Host creates event", False, str(e))
        invite_code = None
        event_id = None
else:
    print_result("Host creates event", False, "No host token available")
    invite_code = None
    event_id = None

# Test 5: Register via invite link (should be attendee)
print("=" * 60)
print("TEST 5: Register via invite link (should default to attendee)")
print("=" * 60)
if invite_code:
    try:
        response = requests.post(f"{API_URL}/register", json={
            "email": "inviteuser@test.com",
            "name": "Invite User",
            "password": "password123",
            "invite_code": invite_code,
            "display_name": "Party Crasher",
            "user_type": "attendee"  # Should be explicitly set to attendee
        })

        if response.status_code == 200:
            data = response.json()
            is_attendee = data.get('user_type') == 'attendee'
            print_result("Invite link user is attendee", is_attendee,
                        f"User type: {data.get('user_type')}")
        else:
            print_result("Invite link user is attendee", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("Invite link user is attendee", False, str(e))
else:
    print_result("Invite link user is attendee", False, "No invite code available")

# Test 6: Attendee upgrades to host
print("=" * 60)
print("TEST 6: Attendee upgrades to host")
print("=" * 60)
try:
    # Login as attendee
    response = requests.post(f"{API_URL}/login", data={
        "username": "attendee@test.com",
        "password": "password123"
    })

    if response.status_code == 200:
        attendee_token = response.json().get('access_token')

        # Try to upgrade
        response = requests.post(
            f"{API_URL}/users/become-host",
            headers={"Authorization": f"Bearer {attendee_token}"}
        )

        if response.status_code == 200:
            data = response.json()
            upgraded = data.get('user_type') == 'host'
            print_result("Attendee upgrades to host", upgraded,
                        f"New user type: {data.get('user_type')}")
        else:
            print_result("Attendee upgrades to host", False, f"Status: {response.status_code}")
    else:
        print_result("Attendee upgrades to host", False, "Could not login as attendee")
except Exception as e:
    print_result("Attendee upgrades to host", False, str(e))

# Test 7: Verify host can't upgrade again
print("=" * 60)
print("TEST 7: Host can't upgrade again (should get error)")
print("=" * 60)
try:
    # Try to upgrade attendee who is now a host
    response = requests.post(
        f"{API_URL}/users/become-host",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )

    if response.status_code == 400:
        print_result("Host can't upgrade again", True, "Got expected 400 error")
    else:
        print_result("Host can't upgrade again", False,
                    f"Expected 400, got {response.status_code}")
except Exception as e:
    print_result("Host can't upgrade again", False, str(e))

print("=" * 60)
print("ALL TESTS COMPLETE")
print("=" * 60)
