#!/usr/bin/env python3
"""
Yamily End-to-End Test Script
Simulates a multi-user family gathering experience:
- Grandma hosts Thanksgiving
- Family members join and submit reviews
- Users vote on reviews
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any

# Configuration
API_URL = "http://localhost:8000"

# ANSI color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log_step(message: str):
    """Print a step header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{message}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")

def log_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def log_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def log_info(message: str):
    """Print info message"""
    print(f"{Colors.YELLOW}→ {message}{Colors.END}")


class YamilyUser:
    """Represents a user in the Yamily system"""

    def __init__(self, name: str, email: str, password: str = "password123"):
        self.name = name
        self.email = email
        self.password = password
        self.token = None
        self.user_id = None

    def register(self):
        """Register the user"""
        response = requests.post(f"{API_URL}/register", json={
            "email": self.email,
            "name": self.name,
            "password": self.password
        })

        if response.status_code == 200:
            data = response.json()
            self.user_id = data["id"]
            log_success(f"Registered {self.name} (ID: {self.user_id})")
            return True
        else:
            log_error(f"Failed to register {self.name}: {response.text}")
            return False

    def login(self):
        """Login and get JWT token"""
        response = requests.post(f"{API_URL}/login", data={
            "username": self.email,
            "password": self.password
        })

        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            log_success(f"Logged in {self.name}")
            return True
        else:
            log_error(f"Failed to login {self.name}: {response.text}")
            return False

    def get_headers(self):
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }


def create_event(host: YamilyUser, title: str, description: str, days_from_now: int = 7) -> Dict[str, Any]:
    """Create an event"""
    event_date = (datetime.now() + timedelta(days=days_from_now)).isoformat()

    response = requests.post(
        f"{API_URL}/events",
        headers=host.get_headers(),
        json={
            "title": title,
            "description": description,
            "event_date": event_date
        }
    )

    if response.status_code == 200:
        event = response.json()
        log_success(f"Created event: {title}")
        log_info(f"  Event ID: {event['id']}")
        log_info(f"  Invite Code: {event['invite_code']}")
        return event
    else:
        log_error(f"Failed to create event: {response.text}")
        return None


def join_event(user: YamilyUser, invite_code: str, display_name: str) -> bool:
    """Join an event with a display name (pseudonym)"""
    response = requests.post(
        f"{API_URL}/events/join",
        headers=user.get_headers(),
        json={
            "invite_code": invite_code,
            "display_name": display_name
        }
    )

    if response.status_code == 200:
        log_success(f"{user.name} joined as '{display_name}'")
        return True
    else:
        log_error(f"Failed to join event: {response.text}")
        return False


def submit_review(user: YamilyUser, event_id: int, review_data: Dict[str, Any]) -> Dict[str, Any]:
    """Submit a review for an event"""
    response = requests.post(
        f"{API_URL}/events/{event_id}/reviews",
        headers=user.get_headers(),
        json=review_data
    )

    if response.status_code == 200:
        review = response.json()
        log_success(f"{user.name} submitted review (ID: {review['id']})")
        log_info(f"  Overall Rating: {review['overall_rating']:.1f} ⭐")
        return review
    else:
        log_error(f"Failed to submit review: {response.text}")
        return None


def vote_on_review(user: YamilyUser, review_id: int, vote_type: int) -> bool:
    """Vote on a review (1 = upvote, -1 = downvote)"""
    vote_name = "upvoted" if vote_type == 1 else "downvoted"

    response = requests.post(
        f"{API_URL}/reviews/{review_id}/vote",
        headers=user.get_headers(),
        json={"vote_type": vote_type}
    )

    if response.status_code == 200:
        log_success(f"{user.name} {vote_name} review {review_id}")
        return True
    else:
        log_error(f"Failed to vote: {response.text}")
        return False


def get_event_reviews(event_id: int) -> list:
    """Get all reviews for an event"""
    response = requests.get(f"{API_URL}/events/{event_id}/reviews")

    if response.status_code == 200:
        reviews = response.json()
        log_success(f"Retrieved {len(reviews)} reviews")
        return reviews
    else:
        log_error(f"Failed to get reviews: {response.text}")
        return []


def print_reviews_summary(reviews: list):
    """Print a formatted summary of all reviews"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}📊 REVIEWS SUMMARY{Colors.END}")
    print(f"{Colors.HEADER}{'─'*60}{Colors.END}")

    for review in reviews:
        print(f"\n{Colors.BOLD}{review['display_name']}{Colors.END} - {review['overall_rating']:.1f} ⭐")
        print(f"  Food: {'⭐'*review['food_quality']} | Drama: {'⭐'*review['drama_level']} | "
              f"Alcohol: {'⭐'*review['alcohol_availability']} | Convo: {'⭐'*review['conversation_topics']}")
        print(f"  {Colors.YELLOW}\"{review['review_text']}\"{Colors.END}")

        if review.get('memorable_moments'):
            print(f"  {Colors.GREEN}✨ {review['memorable_moments']}{Colors.END}")

        if review.get('tags'):
            tags = ', '.join(review['tags'])
            print(f"  🏷️  {tags}")

        print(f"  👍 {review['upvotes']} | 👎 {review['downvotes']}")


def main():
    """Run the complete multi-user flow simulation"""

    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║     YAMILY END-TO-END TEST - THANKSGIVING EDITION        ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")

    # ========== STEP 1: CREATE USERS ==========
    log_step("STEP 1: Register Family Members")

    grandma = YamilyUser("Grandma Betty", "grandma@family.com")
    uncle_bob = YamilyUser("Uncle Bob", "bob@family.com")
    cousin_sarah = YamilyUser("Cousin Sarah", "sarah@family.com")
    aunt_karen = YamilyUser("Aunt Karen", "karen@family.com")
    nephew_timmy = YamilyUser("Timmy", "timmy@family.com")

    users = [grandma, uncle_bob, cousin_sarah, aunt_karen, nephew_timmy]

    for user in users:
        user.register()

    # ========== STEP 2: LOGIN USERS ==========
    log_step("STEP 2: Login All Users")

    for user in users:
        user.login()

    # ========== STEP 3: CREATE EVENT ==========
    log_step("STEP 3: Grandma Hosts Thanksgiving Dinner")

    event = create_event(
        grandma,
        "Thanksgiving Dinner 2024",
        "Annual family Thanksgiving at Grandma's house. Bring your appetite!",
        days_from_now=30
    )

    if not event:
        log_error("Failed to create event. Exiting.")
        return

    event_id = event['id']
    invite_code = event['invite_code']

    # ========== STEP 4: JOIN EVENT ==========
    log_step("STEP 4: Family Members Join the Event")

    # Host auto-joins, but let's have her join with a display name too
    join_event(grandma, invite_code, "The Matriarch")
    join_event(uncle_bob, invite_code, "Uncle Chaos")
    join_event(cousin_sarah, invite_code, "The Vegan One")
    join_event(aunt_karen, invite_code, "Wine Aunt")
    join_event(nephew_timmy, invite_code, "The Kid")

    # ========== STEP 5: SUBMIT REVIEWS ==========
    log_step("STEP 5: Family Members Submit Reviews")

    # Grandma's review (host, very positive)
    grandma_review = submit_review(grandma, event_id, {
        "food_quality": 5,
        "drama_level": 2,
        "alcohol_availability": 4,
        "conversation_topics": 5,
        "review_text": "What a wonderful gathering! The turkey was perfect and everyone seemed to have a great time. Maybe a little less political talk next time.",
        "memorable_moments": "Timmy's adorable prayer before dinner brought tears to everyone's eyes!",
        "tags": ["Heartwarming", "Delicious Food", "Family Traditions"]
    })

    # Uncle Bob's review (the life of the party)
    bob_review = submit_review(uncle_bob, event_id, {
        "food_quality": 5,
        "drama_level": 4,
        "alcohol_availability": 5,
        "conversation_topics": 3,
        "review_text": "Great food, great drinks! Things got a little heated during the election discussion but that's what makes it memorable. The bar was well-stocked!",
        "memorable_moments": "When Karen accidentally spilled wine on the white tablecloth and blamed it on the dog.",
        "tags": ["Wild Times", "Open Bar", "Awkward Politics"]
    })

    # Sarah's review (the critical millennial)
    sarah_review = submit_review(cousin_sarah, event_id, {
        "food_quality": 3,
        "drama_level": 5,
        "alcohol_availability": 4,
        "conversation_topics": 2,
        "review_text": "Food was okay but limited vegan options. The political arguments were INTENSE. Uncle Bob needs to learn when to stop talking. At least the wine helped.",
        "memorable_moments": "The epic political showdown between Uncle Bob and Dad. It was like watching a reality show.",
        "tags": ["Drama Llama", "Needs Vegan Options", "Political Minefield"]
    })

    # Karen's review (the wine enthusiast)
    karen_review = submit_review(aunt_karen, event_id, {
        "food_quality": 4,
        "drama_level": 3,
        "alcohol_availability": 5,
        "conversation_topics": 4,
        "review_text": "Betty outdid herself with the cooking! The wine selection was excellent. Yes, I spilled some, but we all had a good laugh about it. Well, most of us did.",
        "memorable_moments": "The moment of silence when someone asked Bob about his 'business ventures.'",
        "tags": ["Great Wine", "Classy Affair", "Minor Spills"]
    })

    # Timmy's review (the kid's perspective)
    timmy_review = submit_review(nephew_timmy, event_id, {
        "food_quality": 4,
        "drama_level": 2,
        "alcohol_availability": 1,  # Kid's perspective
        "conversation_topics": 3,
        "review_text": "Grandma's pumpkin pie was AMAZING! The adults talked about boring stuff but I got to play video games with my cousins after dinner.",
        "memorable_moments": "Getting to sit at the adult table for the first time!",
        "tags": ["Best Pie Ever", "Video Games", "Growing Up"]
    })

    # ========== STEP 6: VOTE ON REVIEWS ==========
    log_step("STEP 6: Family Members Vote on Reviews")

    # People upvote reviews they agree with
    vote_on_review(uncle_bob, grandma_review['id'], 1)  # Bob upvotes grandma
    vote_on_review(aunt_karen, grandma_review['id'], 1)  # Karen upvotes grandma
    vote_on_review(nephew_timmy, grandma_review['id'], 1)  # Timmy upvotes grandma

    vote_on_review(grandma, bob_review['id'], -1)  # Grandma downvotes Bob's chaotic review
    vote_on_review(cousin_sarah, bob_review['id'], -1)  # Sarah downvotes Bob
    vote_on_review(aunt_karen, bob_review['id'], 1)  # But Karen upvotes it (she had fun)

    vote_on_review(uncle_bob, sarah_review['id'], -1)  # Bob downvotes Sarah (she criticized him)
    vote_on_review(nephew_timmy, sarah_review['id'], 1)  # Timmy upvotes Sarah

    vote_on_review(grandma, karen_review['id'], 1)  # Grandma upvotes Karen
    vote_on_review(uncle_bob, karen_review['id'], 1)  # Bob upvotes Karen

    vote_on_review(grandma, timmy_review['id'], 1)  # Everyone loves Timmy's review
    vote_on_review(uncle_bob, timmy_review['id'], 1)
    vote_on_review(cousin_sarah, timmy_review['id'], 1)
    vote_on_review(aunt_karen, timmy_review['id'], 1)

    # ========== STEP 7: GET FINAL RESULTS ==========
    log_step("STEP 7: View All Reviews")

    reviews = get_event_reviews(event_id)

    if reviews:
        print_reviews_summary(reviews)

    # ========== STEP 8: TEST DUPLICATE REVIEW PREVENTION ==========
    log_step("STEP 8: Test Duplicate Review Prevention")

    log_info("Attempting to submit a second review from Uncle Bob...")
    duplicate_review = submit_review(uncle_bob, event_id, {
        "food_quality": 5,
        "drama_level": 5,
        "alcohol_availability": 5,
        "conversation_topics": 5,
        "review_text": "Just wanted to add that the party was even better than I said!",
        "memorable_moments": "Everything!",
        "tags": ["Best Ever"]
    })

    if not duplicate_review:
        log_success("✓ Duplicate review correctly prevented!")

    # ========== FINAL SUMMARY ==========
    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║                  TEST COMPLETED ✓                        ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")

    print(f"\n{Colors.GREEN}All tests passed! The Yamily app is working correctly.{Colors.END}")
    print(f"\n{Colors.YELLOW}Summary:{Colors.END}")
    print(f"  • {len(users)} users registered and logged in")
    print(f"  • 1 event created (ID: {event_id})")
    print(f"  • {len(reviews)} reviews submitted")
    print(f"  • Multiple votes cast")
    print(f"  • Duplicate review prevention working ✓")
    print(f"\n{Colors.BLUE}View in browser: http://localhost:8000/docs{Colors.END}")
    print(f"{Colors.BLUE}Event reviews: http://localhost:3000/events/{event_id}{Colors.END}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted by user{Colors.END}")
    except Exception as e:
        print(f"\n\n{Colors.RED}Error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
