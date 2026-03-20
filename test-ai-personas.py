#!/usr/bin/env python3
"""
Yamily AI Persona Test Script
==============================

This script simulates a complete event lifecycle with AI persona activity:
1. Creates an event with invited AI personas
2. Starts the event (live status)
3. Posts a text comment (simulates scheduled comment)
4. Uploads a photo
5. Generates AI photo reaction
6. Ends the event
7. Triggers auto-reviews

Everything is persisted to the production database.

Usage:
    python test_ai_personas.py --api-url https://api.yamily.app --token YOUR_JWT_TOKEN

Requirements:
    pip install requests pillow
"""

import argparse
import json
import requests
import time
from datetime import datetime, timedelta
from io import BytesIO
from PIL import Image
import base64

# Color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_step(step_num, title):
    """Print a step header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}")
    print(f"STEP {step_num}: {title}")
    print(f"{'='*60}{Colors.ENDC}\n")

def print_success(msg):
    """Print success message"""
    print(f"{Colors.OKGREEN}✅ {msg}{Colors.ENDC}")

def print_error(msg):
    """Print error message"""
    print(f"{Colors.FAIL}❌ {msg}{Colors.ENDC}")

def print_info(msg):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ️  {msg}{Colors.ENDC}")

def print_warning(msg):
    """Print warning message"""
    print(f"{Colors.WARNING}⚠️  {msg}{Colors.ENDC}")

class YamilyAITester:
    def __init__(self, api_url, token, keep_live=False):
        self.api_url = api_url.rstrip('/')
        self.token = token
        self.keep_live = keep_live
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        self.event_id = None
        self.ai_guest_names = []
        
    def create_event_with_ai_guests(self):
        """Step 1: Create an event with invited AI personas"""
        print_step(1, "Creating Event with AI Personas")
        
        # Event data - set to 1 hour ago so AI comments are immediately scheduled
        event_date = (datetime.now() - timedelta(hours=1)).isoformat()
        
        event_data = {
            "title": f"AI Persona Test Event - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "event_date": event_date,
            "description": "Automated test event for AI persona functionality",
            "categories": [
                {
                    "category_name": "Vibes",
                    "category_emoji": "✨"
                },
                {
                    "category_name": "Chaos",
                    "category_emoji": "🔥"
                },
                {
                    "category_name": "Entertainment",
                    "category_emoji": "🎉"
                }
            ],
            "ai_guests": [
                {
                    "ai_persona_type": "karen",
                    "ai_persona_name": "Test Karen"
                },
                {
                    "ai_persona_type": "genz",
                    "ai_persona_name": "Test Gen Z"
                },
                {
                    "ai_persona_type": "oversharer",
                    "ai_persona_name": "Test Linda"
                },
                {
                    "ai_persona_type": "planner",
                    "ai_persona_name": "Test Monica"
                },
                {
                    "ai_persona_type": "foodcritic",
                    "ai_persona_name": "Test Gordon"
                },
                {
                    "ai_persona_type": "dramadetector",
                    "ai_persona_name": "Test Sherlock"
                }
            ]
        }
        
        print_info(f"Event name: {event_data['title']}")
        print_info(f"Event date: {event_date} (set to past for immediate testing)")
        print_info(f"Inviting 7 AI guests:")
        print_info(f"  - Test Karen (karen)")
        print_info(f"  - Test Gen Z (genz)")
        print_info(f"  - Test Linda (oversharer) ← NEW!")
        print_info(f"  - Test Monica (planner) ← NEW!")
        print_info(f"  - Test Gordon (foodcritic) ← NEW!")
        print_info(f"  - Test Sherlock (dramadetector) ← NEW!")
        
        # Create event
        response = requests.post(
            f"{self.api_url}/events",
            headers=self.headers,
            json=event_data
        )
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            self.event_id = result['id']
            self.ai_guest_names = ['Test Karen', 'Test Gen Z', 'Test Linda', 'Test Monica', 'Test Gordon', 'Test Sherlock']
            
            print_success(f"Event created successfully!")
            print_info(f"Event ID: {self.event_id}")
            # Determine frontend URL based on API URL
            frontend_url = "http://localhost:3000" if "localhost" in self.api_url else "https://yamily.app"
            print_info(f"Event URL: {frontend_url}/events/{self.event_id}")
            return True
        else:
            print_error(f"Failed to create event: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    
    def start_event(self):
        """Step 2: Start the event (set status to live)"""
        print_step(2, "Starting Event (Setting Status to Live)")
        
        response = requests.post(
            f"{self.api_url}/events/{self.event_id}/start",
            headers=self.headers
        )
        
        if response.status_code == 200:
            print_success("Event started successfully!")
            print_info("Event status: LIVE")
            return True
        else:
            print_error(f"Failed to start event: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    
    def trigger_ai_comments(self):
        """Step 3: Trigger AI comment generation via background job"""
        print_step(3, "Triggering AI Comment Generation")

        print_info("Calling background job to generate scheduled AI comments...")

        # Call the admin endpoint to process AI guests
        response = requests.post(
            f"{self.api_url}/admin/process-ai-guests"
        )

        if response.status_code == 200:
            result = response.json()
            print_success("Background job executed successfully!")
            print_info(f"Comments generated: {result.get('comments_generated', 0)}")
            print_info(f"Photo reactions generated: {result.get('photo_reactions_generated', 0)}")

            if result.get('errors'):
                print_warning(f"Errors encountered: {len(result['errors'])}")
                for error in result['errors']:
                    print_warning(f"  - {error}")

            return result.get('comments_generated', 0) > 0
        else:
            print_error(f"Failed to trigger background job: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    
    def upload_test_photo(self):
        """Step 4: Upload a test photo as a comment"""
        print_step(4, "Uploading Test Photo")

        # Create a simple test image
        img = Image.new('RGB', (400, 300), color=(73, 109, 137))

        # Add some text to make it interesting
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)

        # Draw some shapes
        draw.rectangle([50, 50, 350, 250], outline=(255, 255, 0), width=5)
        draw.ellipse([150, 100, 250, 200], fill=(255, 100, 100))

        # Convert to base64 data URL
        img_byte_arr = BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr.seek(0)

        img_base64 = base64.b64encode(img_byte_arr.read()).decode('utf-8')
        photo_data_url = f"data:image/jpeg;base64,{img_base64}"

        print_info("Created test photo (400x300 with shapes)")
        print_info(f"Photo size: {len(photo_data_url)} characters")

        # Post as a comment with photo
        comment_data = {
            "comment_text": "Check out this cool photo! 📸",
            "photo_url": photo_data_url
        }

        response = requests.post(
            f"{self.api_url}/events/{self.event_id}/comments",
            headers=self.headers,
            json=comment_data
        )

        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print_success("Photo comment posted successfully!")
            print_info(f"Comment ID: {result.get('id')}")

            return result.get('id'), result.get('photo_url')
        else:
            print_error(f"Failed to upload photo: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False, None
    
    def generate_ai_photo_reaction(self):
        """Step 5: Generate AI photo reactions via background job"""
        print_step(5, "Triggering AI Photo Reactions")

        if not self.event_id:
            print_warning("No event ID available, skipping photo reaction")
            return False

        print_info("Calling background job to generate AI photo reactions...")

        # Call the admin endpoint to process AI guests (handles photo reactions)
        response = requests.post(
            f"{self.api_url}/admin/process-ai-guests"
        )

        if response.status_code == 200:
            result = response.json()
            print_success("Background job executed successfully!")
            print_info(f"Comments generated: {result.get('comments_generated', 0)}")
            print_info(f"Photo reactions generated: {result.get('photo_reactions_generated', 0)}")

            if result.get('errors'):
                print_warning(f"Errors encountered: {len(result['errors'])}")
                for error in result['errors']:
                    print_warning(f"  - {error}")

            return result.get('photo_reactions_generated', 0) > 0
        else:
            print_error(f"Failed to trigger background job: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    
    def end_event_and_trigger_reviews(self):
        """Step 6: End event and trigger auto-reviews"""
        print_step(6, "Ending Event & Triggering Auto-Reviews")
        
        print_info("Ending event...")
        
        response = requests.post(
            f"{self.api_url}/events/{self.event_id}/end",
            headers=self.headers
        )
        
        if response.status_code == 200:
            print_success("Event ended successfully!")
            print_info("Auto-reviews should have been generated for invited AI guests")
            return True
        else:
            print_error(f"Failed to end event: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    
    def verify_results(self):
        """Step 7: Verify everything worked"""
        print_step(7, "Verifying Results")
        
        print_info("Fetching event details...")
        
        # Get event details
        response = requests.get(
            f"{self.api_url}/events/{self.event_id}",
            headers=self.headers
        )
        
        if response.status_code != 200:
            print_error("Could not fetch event details")
            return False
        
        event = response.json()
        
        # Check status
        print_info(f"Event status: {event.get('status', 'unknown')}")
        
        # Get reviews
        response = requests.get(
            f"{self.api_url}/events/{self.event_id}/reviews",
            headers=self.headers
        )
        
        if response.status_code == 200:
            reviews = response.json()
            ai_reviews = [r for r in reviews if r.get('is_ai_generated')]
            
            print_info(f"Total reviews: {len(reviews)}")
            print_info(f"AI-generated reviews: {len(ai_reviews)}")
            
            if ai_reviews:
                print_success(f"✅ Found {len(ai_reviews)} AI-generated review(s)!")
                for review in ai_reviews:
                    persona_name = review.get('ai_persona_name', 'Unknown')
                    persona_type = review.get('ai_persona_type', 'unknown')
                    print_info(f"  - {persona_name} ({persona_type})")
                    
                    # Show snippet of review
                    review_text = review.get('review', review.get('memorable_moment', ''))
                    if review_text:
                        snippet = review_text[:100] + "..." if len(review_text) > 100 else review_text
                        print_info(f"    \"{snippet}\"")
            else:
                print_warning("No AI-generated reviews found")
                print_info("Expected reviews from: " + ", ".join(self.ai_guest_names))
        
        # Get comments
        response = requests.get(
            f"{self.api_url}/events/{self.event_id}/comments",
            headers=self.headers
        )

        if response.status_code == 200:
            comments = response.json()
            ai_comments = [c for c in comments if c.get('is_ai_generated')]

            print_info(f"Total comments: {len(comments)}")
            print_info(f"AI-generated comments: {len(ai_comments)}")

            if ai_comments:
                print_success(f"✅ Found {len(ai_comments)} AI-generated comment(s)!")
                for comment in ai_comments:
                    persona_name = comment.get('ai_persona_name', 'Unknown')
                    print_info(f"  - {persona_name}: {comment.get('comment_text', '')[:80]}...")
            else:
                print_warning("No AI-generated comments found")
                print_info("Expected comments from: " + ", ".join(self.ai_guest_names))
        
        return True
    
    def run_full_test(self):
        """Run the complete test suite"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}")
        print("="*60)
        print("  YAMILY AI PERSONA TEST SUITE")
        print("="*60)
        print(f"{Colors.ENDC}\n")
        
        print_info(f"API URL: {self.api_url}")
        print_info(f"Starting test at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Step 1: Create event with AI guests
        if not self.create_event_with_ai_guests():
            print_error("Test failed at Step 1")
            return False
        
        time.sleep(1)
        
        # Step 2: Start event
        if not self.start_event():
            print_error("Test failed at Step 2")
            return False
        
        time.sleep(1)

        # Step 3: Trigger AI comment generation
        self.trigger_ai_comments()
        time.sleep(2)

        # Step 4: Upload photo
        photo_id, photo_url = self.upload_test_photo()
        time.sleep(1)

        # Step 5: Generate AI photo reactions
        if photo_id:
            self.generate_ai_photo_reaction()
            time.sleep(1)

        # Step 6: End event and trigger auto-reviews (conditional)
        if self.keep_live:
            print_step(6, "Skipping Event End (--keep-live flag set)")
            print_info("Event will remain in LIVE status for admin dashboard testing")
            print_warning("Note: AI auto-reviews will NOT be generated (only triggered on event end)")
        else:
            if not self.end_event_and_trigger_reviews():
                print_error("Test failed at Step 6")
                return False
            time.sleep(2)

            # Step 7: Verify results (only if event ended)
            self.verify_results()

        # Final summary
        print(f"\n{Colors.BOLD}{Colors.OKGREEN}")
        print("="*60)
        print("  TEST COMPLETE!")
        print("="*60)
        print(f"{Colors.ENDC}\n")

        # Determine frontend URL based on API URL
        frontend_url = "http://localhost:3000" if "localhost" in self.api_url else "https://yamily.app"

        print_info(f"Event ID: {self.event_id}")
        print_info(f"Event URL: {frontend_url}/events/{self.event_id}")

        if self.keep_live:
            print_info(f"Admin Dashboard: {frontend_url}/admin/events")
            print_success("Event is LIVE! Check the admin dashboard to see it in action.")
        else:
            print_info(f"View this event to see all AI persona activity!")

        return True

def create_test_user_and_login(api_url):
    """Create a test user and get auth token for local testing"""
    print_step(0, "Setting Up Test User (Local Testing)")

    # Generate unique test user credentials
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    test_email = f"test_{timestamp}@example.com"
    test_password = "TestPassword123!"
    test_username = f"TestUser{timestamp}"
    test_name = f"Test User {timestamp}"

    print_info(f"Creating test user: {test_email}")

    # Register user
    register_data = {
        "email": test_email,
        "username": test_username,
        "name": test_name,
        "password": test_password
    }

    response = requests.post(
        f"{api_url}/register",
        json=register_data
    )

    if response.status_code not in [200, 201]:
        print_error(f"Failed to register test user: {response.status_code}")
        print_error(f"Response: {response.text}")
        return None

    print_success("Test user registered!")

    # Login to get token
    login_data = {
        "username": test_email,
        "password": test_password
    }

    response = requests.post(
        f"{api_url}/login",
        data=login_data  # FastAPI OAuth2 uses form data, not JSON
    )

    if response.status_code == 200:
        result = response.json()
        token = result.get('access_token')
        print_success("Logged in successfully!")
        print_info(f"Auth token obtained")
        return token
    else:
        print_error(f"Failed to login: {response.status_code}")
        print_error(f"Response: {response.text}")
        return None

def main():
    parser = argparse.ArgumentParser(
        description='Test Yamily AI Persona functionality',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test locally (easiest - auto-creates test user)
  python test-ai-personas.py --local

  # Or just run without arguments (defaults to local)
  python test-ai-personas.py

  # Keep event LIVE for admin dashboard testing
  python test-ai-personas.py --local --keep-live

  # Test with production API
  python test-ai-personas.py --api-url https://api.yamily.app --token YOUR_JWT_TOKEN
        """
    )

    parser.add_argument(
        '--api-url',
        default='http://localhost:8000',
        help='Yamily API URL (default: http://localhost:8000)'
    )

    parser.add_argument(
        '--token',
        help='Your JWT authentication token (optional for local testing)'
    )

    parser.add_argument(
        '--local',
        action='store_true',
        help='Local testing mode: auto-create test user and login'
    )

    parser.add_argument(
        '--keep-live',
        action='store_true',
        help='Keep event in LIVE status (do not end event) for admin dashboard testing'
    )

    args = parser.parse_args()

    # Get or create auth token
    token = args.token

    if args.local or (not token and args.api_url == 'http://localhost:8000'):
        print_info("Local testing mode: Creating test user automatically")
        token = create_test_user_and_login(args.api_url)
        if not token:
            print_error("Failed to create test user and get token")
            exit(1)
    elif not token:
        print_error("--token is required for non-local testing")
        print_info("Use --local flag for automatic local testing")
        exit(1)

    # Run the test
    tester = YamilyAITester(args.api_url, token, keep_live=args.keep_live)
    success = tester.run_full_test()

    exit(0 if success else 1)

if __name__ == '__main__':
    main()
