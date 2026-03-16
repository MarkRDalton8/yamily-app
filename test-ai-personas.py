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
    def __init__(self, api_url, token):
        self.api_url = api_url.rstrip('/')
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        self.event_id = None
        self.ai_guest_names = []
        
    def create_event_with_ai_guests(self):
        """Step 1: Create an event with invited AI personas"""
        print_step(1, "Creating Event with AI Personas")
        
        # Event data
        event_date = (datetime.now() + timedelta(hours=1)).isoformat()
        
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
                }
            ]
        }
        
        print_info(f"Event name: {event_data['title']}")
        print_info(f"Inviting AI guests: Test Karen (karen), Test Gen Z (genz)")
        
        # Create event
        response = requests.post(
            f"{self.api_url}/events",
            headers=self.headers,
            json=event_data
        )
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            self.event_id = result['id']
            self.ai_guest_names = ['Test Karen', 'Test Gen Z']
            
            print_success(f"Event created successfully!")
            print_info(f"Event ID: {self.event_id}")
            print_info(f"Event URL: https://yamily.app/events/{self.event_id}")
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
    
    def post_ai_text_comment(self, persona_name, persona_type):
        """Step 3: Post AI text comment to live feed"""
        print_step(3, f"Posting AI Text Comment from {persona_name}")
        
        # Simulate what the background job does
        comments_by_type = {
            "karen": "Oh honey, this test event is... certainly something! Bless their hearts for trying. But what do I know!",
            "genz": "ngl this test is lowkey chaotic and i'm here for it fr fr 💀",
            "lightweight": "This is ALREADY the BEST test event EVER!!! I LOVE testing!!!"
        }
        
        comment_text = comments_by_type.get(persona_type, "Having a great time!")
        
        # Post comment to feed
        # Note: We need an endpoint that allows posting AI comments
        # For now, we'll use a workaround - post as regular comment with special format
        
        feed_data = {
            "item_type": "comment",
            "comment_text": f"[AI:{persona_name}] {comment_text}",
            "is_ai_generated": True,
            "ai_persona_type": persona_type,
            "ai_persona_name": persona_name
        }
        
        print_info(f"Comment: {comment_text}")
        
        response = requests.post(
            f"{self.api_url}/events/{self.event_id}/feed",
            headers=self.headers,
            json=feed_data
        )
        
        if response.status_code == 200 or response.status_code == 201:
            print_success(f"AI comment posted from {persona_name}")
            return True
        else:
            print_warning(f"Could not post AI comment (endpoint may not support AI flag)")
            print_info(f"Response: {response.status_code} - {response.text}")
            return False
    
    def upload_test_photo(self):
        """Step 4: Upload a test photo"""
        print_step(4, "Uploading Test Photo")
        
        # Create a simple test image
        img = Image.new('RGB', (400, 300), color=(73, 109, 137))
        
        # Add some text to make it interesting
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Draw some shapes
        draw.rectangle([50, 50, 350, 250], outline=(255, 255, 0), width=5)
        draw.ellipse([150, 100, 250, 200], fill=(255, 100, 100))
        
        # Convert to bytes
        img_byte_arr = BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        print_info("Created test photo (400x300 with shapes)")
        
        # Upload photo
        files = {
            'photo': ('test_photo.jpg', img_byte_arr, 'image/jpeg')
        }
        
        # Remove Content-Type header for file upload
        upload_headers = {
            'Authorization': f'Bearer {self.token}'
        }
        
        response = requests.post(
            f"{self.api_url}/events/{self.event_id}/feed/photo",
            headers=upload_headers,
            files=files
        )
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print_success("Photo uploaded successfully!")
            
            if 'photo_url' in result:
                print_info(f"Photo URL: {result['photo_url']}")
                return result.get('id'), result['photo_url']
            elif 'id' in result:
                return result['id'], None
            return True, None
        else:
            print_error(f"Failed to upload photo: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False, None
    
    def generate_ai_photo_reaction(self, photo_id, persona_name, persona_type):
        """Step 5: Generate AI photo reaction"""
        print_step(5, f"Generating AI Photo Reaction from {persona_name}")
        
        if not photo_id:
            print_warning("No photo ID available, skipping photo reaction")
            return False
        
        print_info(f"Attempting to generate reaction from {persona_name} ({persona_type})")
        
        # Try to call background job manually
        # This might not work from external script, but we can try
        
        admin_data = {
            "admin_password": "your_admin_password_here"  # User needs to provide this
        }
        
        response = requests.post(
            f"{self.api_url}/admin/process-ai-guests",
            headers={'Content-Type': 'application/json'},
            json=admin_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success("Background job executed successfully!")
            print_info(f"Text comments created: {result.get('text_comments_created', 0)}")
            print_info(f"Photo reactions created: {result.get('photo_reactions_created', 0)}")
            return True
        else:
            print_warning("Could not execute background job (may need admin password)")
            print_info(f"Response: {response.status_code}")
            print_info("Photo reaction would normally happen via cron job")
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
        
        # Get feed items
        response = requests.get(
            f"{self.api_url}/events/{self.event_id}/feed",
            headers=self.headers
        )
        
        if response.status_code == 200:
            feed_items = response.json()
            ai_comments = [item for item in feed_items 
                          if item.get('item_type') == 'comment' and item.get('is_ai_generated')]
            
            print_info(f"Total feed items: {len(feed_items)}")
            print_info(f"AI-generated comments: {len(ai_comments)}")
            
            if ai_comments:
                print_success(f"✅ Found {len(ai_comments)} AI-generated comment(s)!")
                for comment in ai_comments:
                    persona_name = comment.get('ai_persona_name', 'Unknown')
                    print_info(f"  - {persona_name}: {comment.get('comment_text', '')[:80]}...")
        
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
        
        # Step 3: Post AI text comments
        self.post_ai_text_comment("Test Karen", "karen")
        time.sleep(1)
        self.post_ai_text_comment("Test Gen Z", "genz")
        time.sleep(1)
        
        # Step 4: Upload photo
        photo_id, photo_url = self.upload_test_photo()
        time.sleep(1)
        
        # Step 5: Generate photo reactions (optional - may not work without admin password)
        if photo_id:
            self.generate_ai_photo_reaction(photo_id, "Test Karen", "karen")
            time.sleep(1)
        
        # Step 6: End event and trigger auto-reviews
        if not self.end_event_and_trigger_reviews():
            print_error("Test failed at Step 6")
            return False
        
        time.sleep(2)
        
        # Step 7: Verify results
        self.verify_results()
        
        # Final summary
        print(f"\n{Colors.BOLD}{Colors.OKGREEN}")
        print("="*60)
        print("  TEST COMPLETE!")
        print("="*60)
        print(f"{Colors.ENDC}\n")
        
        print_info(f"Event ID: {self.event_id}")
        print_info(f"Event URL: https://yamily.app/events/{self.event_id}")
        print_info(f"View this event to see all AI persona activity!")
        
        return True

def main():
    parser = argparse.ArgumentParser(
        description='Test Yamily AI Persona functionality',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test with production API
  python test_ai_personas.py --api-url https://api.yamily.app --token YOUR_JWT_TOKEN
  
  # Test with local API
  python test_ai_personas.py --api-url http://localhost:8000 --token YOUR_JWT_TOKEN
        """
    )
    
    parser.add_argument(
        '--api-url',
        required=True,
        help='Yamily API URL (e.g., https://api.yamily.app)'
    )
    
    parser.add_argument(
        '--token',
        required=True,
        help='Your JWT authentication token'
    )
    
    args = parser.parse_args()
    
    # Run the test
    tester = YamilyAITester(args.api_url, args.token)
    success = tester.run_full_test()
    
    exit(0 if success else 1)

if __name__ == '__main__':
    main()
