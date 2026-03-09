#!/usr/bin/env python3
"""
Fresh test for user type system - uses unique emails
"""

import requests
import json
from datetime import datetime, timedelta
import random
import string

API_URL = "http://localhost:8000"

def random_email():
    """Generate random email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{rand}@example.com"

def print_result(test_name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {test_name}")
    if message:
        print(f"   {message}")
    print()

print("=" * 60)
print("USER TYPE SYSTEM - COMPREHENSIVE TEST")
print("=" * 60)
print()

# Test 1: Register as attendee
print("TEST 1: Register as attendee")
print("-" * 60)
attendee_email = random_email()
try:
    response = requests.post(f"{API_URL}/register", json={
        "email": attendee_email,
        "name": "Test Attendee",
        "password": "password123",
        "user_type": "attendee"
    })

    if response.status_code == 200:
        data = response.json()
        print_result("✓ Registration successful", data.get('user_type') == 'attendee',
                    f"User type: {data.get('user_type')}")
    else:
        print_result("✗ Registration failed", False, f"Status: {response.status_code}")
except Exception as e:
    print_result("✗ Registration failed", False, str(e))

# Test 2: Register as host
print("TEST 2: Register as host")
print("-" * 60)
host_email = random_email()
try:
    response = requests.post(f"{API_URL}/register", json={
        "email": host_email,
        "name": "Test Host",
        "password": "password123",
        "user_type": "host"
    })

    if response.status_code == 200:
        data = response.json()
        print_result("✓ Registration successful", data.get('user_type') == 'host',
                    f"User type: {data.get('user_type')}")
        host_token = None
    else:
        print_result("✗ Registration failed", False, f"Status: {response.status_code}")
        host_token = None
except Exception as e:
    print_result("✗ Registration failed", False, str(e))
    host_token = None

# Test 3: Login returns user_type
print("TEST 3: Login includes user_type in response")
print("-" * 60)
try:
    response = requests.post(f"{API_URL}/login", data={
        "username": host_email,
        "password": "password123"
    })

    if response.status_code == 200:
        data = response.json()
        has_type = 'user_type' in data and data['user_type'] == 'host'
        print_result("✓ Login response correct", has_type,
                    f"User type: {data.get('user_type')}")
        host_token = data.get('access_token')
    else:
        print_result("✗ Login failed", False, f"Status: {response.status_code}")
        host_token = None
except Exception as e:
    print_result("✗ Login failed", False, str(e))
    host_token = None

# Test 4: Host can create event
print("TEST 4: Host creates event")
print("-" * 60)
if host_token:
    try:
        event_date = (datetime.now() + timedelta(days=7)).isoformat()
        response = requests.post(
            f"{API_URL}/events",
            json={
                "title": "User Type Test Event",
                "description": "Testing",
                "event_date": event_date,
                "expected_guests": ["Alice", "Bob"]
            },
            headers={"Authorization": f"Bearer {host_token}"}
        )

        if response.status_code == 200:
            data = response.json()
            invite_code = data.get('invite_code')
            print_result("✓ Event created", True, f"Invite code: {invite_code}")
        else:
            print_result("✗ Event creation failed", False, f"Status: {response.status_code}")
            invite_code = None
    except Exception as e:
        print_result("✗ Event creation failed", False, str(e))
        invite_code = None
else:
    print_result("✗ No host token", False, "Skipped")
    invite_code = None

# Test 5: Invite link registration creates attendee
print("TEST 5: Register via invite link (should be attendee)")
print("-" * 60)
if invite_code:
    invite_email = random_email()
    try:
        response = requests.post(f"{API_URL}/register", json={
            "email": invite_email,
            "name": "Invite User",
            "password": "password123",
            "invite_code": invite_code,
            "display_name": "Party Guest",
            "user_type": "attendee"
        })

        if response.status_code == 200:
            data = response.json()
            is_attendee = data.get('user_type') == 'attendee'
            print_result("✓ Invite registration", is_attendee,
                        f"User type: {data.get('user_type')}")
        else:
            print_result("✗ Registration failed", False, f"Status: {response.status_code}")
    except Exception as e:
        print_result("✗ Registration failed", False, str(e))
else:
    print_result("✗ No invite code", False, "Skipped")

# Test 6: Attendee upgrades to host
print("TEST 6: Attendee upgrades to host")
print("-" * 60)
try:
    # Login as attendee
    response = requests.post(f"{API_URL}/login", data={
        "username": attendee_email,
        "password": "password123"
    })

    if response.status_code == 200:
        attendee_token = response.json().get('access_token')

        # Upgrade
        response = requests.post(
            f"{API_URL}/users/become-host",
            headers={"Authorization": f"Bearer {attendee_token}"}
        )

        if response.status_code == 200:
            data = response.json()
            upgraded = data.get('user_type') == 'host'
            print_result("✓ Upgrade successful", upgraded,
                        f"New type: {data.get('user_type')}")
        else:
            print_result("✗ Upgrade failed", False, f"Status: {response.status_code}")
    else:
        print_result("✗ Login failed", False, "Cannot test upgrade")
except Exception as e:
    print_result("✗ Upgrade failed", False, str(e))

# Test 7: Host can't upgrade again
print("TEST 7: Host can't upgrade again (should error)")
print("-" * 60)
try:
    response = requests.post(
        f"{API_URL}/users/become-host",
        headers={"Authorization": f"Bearer {attendee_token}"}
    )

    expected_error = response.status_code == 400
    print_result("✓ Correct error response", expected_error,
                f"Status: {response.status_code} (expected 400)")
except Exception as e:
    print_result("✗ Test failed", False, str(e))

print("=" * 60)
print("TESTING COMPLETE")
print("=" * 60)
