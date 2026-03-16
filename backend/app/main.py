import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import engine, get_db
from app import models, schemas, auth
from app.auth import get_current_user, oauth2_scheme, SECRET_KEY, ALGORITHM
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from app.ai_personas import get_persona_prompt
from app.ai_helper import generate_ai_review
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import random

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Yamily API", version="1.0.0")

# Get CORS origins from environment variable
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Add CORS middleware - allows frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Get current user if logged in, otherwise return None.
    Allows anonymous users to submit feedback.
    """
    # Try to get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except:
        return None


@app.get("/")
def root():
    return {"message": "Welcome to Yamily - Yelp for Families!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "yamily-api"}

@app.get("/test")
def test_endpoint():
    return {"message": "I just created this endpoint to test deployment!", "cool": True}

# User registration endpoint
@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user with optional auto-join to event"""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with hashed password
    hashed_password = auth.hash_password(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        user_type=user.user_type if user.user_type else "attendee"
    )

    # Save to database
    db.add(db_user)
    db.flush()  # Get user ID

    # If invite code provided, auto-join event
    if user.invite_code and user.display_name:
        event = db.query(models.Event).filter(
            models.Event.invite_code == user.invite_code
        ).first()

        if event:
            # Check if already joined (shouldn't happen on registration, but be safe)
            existing_guest = db.query(models.EventGuest).filter(
                models.EventGuest.event_id == event.id,
                models.EventGuest.user_id == db_user.id
            ).first()

            if not existing_guest:
                guest = models.EventGuest(
                    event_id=event.id,
                    user_id=db_user.id,
                    display_name=user.display_name
                )
                db.add(guest)

    db.commit()
    db.refresh(db_user)

    return db_user

@app.post("/users/become-host")
def become_host(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upgrade an attendee to host (free for now)"""

    if current_user.user_type == "host":
        raise HTTPException(status_code=400, detail="You are already a host")

    current_user.user_type = "host"
    db.commit()
    db.refresh(current_user)

    return {
        "message": "You are now a host!",
        "user_type": current_user.user_type
    }

# event endpoint
@app.post("/events", response_model=schemas.EventResponse)
def create_event(
        event: schemas.EventCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
    ):
    """Create a new event with an invite code and expected guests"""
    invite_code = auth.generate_invite_code()

    #check if the code exists (very unlikely but possible)
    while db.query(models.Event).filter(models.Event.invite_code == invite_code).first():
        invite_code = auth.generate_invite_code()

    #use authenticated user's id as host_id
    db_event = models.Event(
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        host_id=current_user.id,
        invite_code=invite_code
    )

    # Save to database
    db.add(db_event)
    db.flush()  # Get the event ID before creating related records

    # Create expected guests
    for guest_name in event.expected_guests:
        if guest_name.strip():  # Skip empty names
            expected_guest = models.ExpectedGuest(
                event_id=db_event.id,
                guest_name=guest_name.strip()
            )
            db.add(expected_guest)

    # Add categories
    if event.categories and len(event.categories) > 0:
        # Use custom categories
        for cat in event.categories:
            # Use custom scale if provided, otherwise use default
            scale_labels = cat.scale_labels if cat.scale_labels else {
                "1": "Terrible",
                "2": "Poor",
                "3": "Good",
                "4": "Great",
                "5": "Amazing"
            }

            category = models.EventCategory(
                event_id=db_event.id,
                category_name=cat.category_name,
                category_emoji=cat.category_emoji,
                display_order=cat.display_order,
                scale_labels=scale_labels
            )
            db.add(category)
    else:
        # Use default categories with themed scales
        default_categories = [
            {
                "name": "Food",
                "emoji": "🍽️",
                "order": 0,
                "scale": {
                    "1": "Terrible",
                    "2": "Poor",
                    "3": "Good",
                    "4": "Great",
                    "5": "Amazing"
                }
            },
            {
                "name": "Drama",
                "emoji": "🎭",
                "order": 1,
                "scale": {
                    "1": "Peaceful",
                    "2": "Minor Tension",
                    "3": "Awkward",
                    "4": "Arguments",
                    "5": "Jerry Springer"
                }
            },
            {
                "name": "Alcohol",
                "emoji": "🍷",
                "order": 2,
                "scale": {
                    "1": "Dry",
                    "2": "Limited",
                    "3": "Available",
                    "4": "Flowing",
                    "5": "Open Bar"
                }
            },
            {
                "name": "Conversation",
                "emoji": "💬",
                "order": 3,
                "scale": {
                    "1": "Awkward",
                    "2": "Small Talk",
                    "3": "Engaging",
                    "4": "Deep",
                    "5": "Unforgettable"
                }
            }
        ]
        for cat in default_categories:
            category = models.EventCategory(
                event_id=db_event.id,
                category_name=cat["name"],
                category_emoji=cat["emoji"],
                display_order=cat["order"],
                scale_labels=cat["scale"]
            )
            db.add(category)

    # Create AI guest invites
    if event.ai_guests and len(event.ai_guests) > 0:
        for ai_guest in event.ai_guests:
            # Schedule initial text comment at a random time during the event
            # Assume event lasts 3 hours, schedule comment sometime in first 2 hours
            hours_offset = random.uniform(0.5, 2.0)  # Random time 30min - 2hrs into event
            scheduled_time = event.event_date + timedelta(hours=hours_offset)

            ai_guest_record = models.EventAIGuest(
                event_id=db_event.id,
                ai_persona_type=ai_guest.ai_persona_type,
                ai_persona_name=ai_guest.ai_persona_name,
                text_comment_scheduled_time=scheduled_time,
                has_text_commented=False,
                has_reviewed=False
            )
            db.add(ai_guest_record)

    # Auto-join host to their own event
    host_guest = models.EventGuest(
        event_id=db_event.id,
        user_id=current_user.id,
        display_name=current_user.name  # Host uses real name as display name
    )
    db.add(host_guest)

    db.commit()
    db.refresh(db_event)

    return db_event

@app.get("/events/{event_id}")
def get_event_detail(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get full event details including host info and guests"""

    # Find event
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user is authorized (must be guest or host)
    is_host = event.host_id == current_user.id
    is_guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id,
        models.EventGuest.user_id == current_user.id
    ).first() is not None

    if not is_host and not is_guest:
        raise HTTPException(status_code=403, detail="You must join the event to view details")

    # Get host info
    host = db.query(models.User).filter(models.User.id == event.host_id).first()

    # Get guests with pseudonyms
    guests = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id
    ).all()

    # Get review count
    review_count = db.query(models.Review).filter(models.Review.event_id == event_id).count()

    # Get comment count
    comment_count = db.query(models.EventComment).filter(models.EventComment.event_id == event_id).count()

    # Get categories
    categories = db.query(models.EventCategory).filter(
        models.EventCategory.event_id == event_id
    ).order_by(models.EventCategory.display_order).all()

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date,
        "invite_code": event.invite_code,
        "status": event.status,
        "host": {
            "id": host.id if host else None,
            "name": host.name if host else "Unknown"
        },
        "guests": [
            {
                "id": guest.id,
                "user_id": guest.user_id,
                "display_name": guest.display_name,
                "joined_at": guest.joined_at
            }
            for guest in guests
        ],
        "categories": [
            {
                "id": cat.id,
                "category_name": cat.category_name,
                "category_emoji": cat.category_emoji,
                "display_order": cat.display_order,
                "scale_labels": cat.scale_labels
            }
            for cat in categories
        ],
        "review_count": review_count,
        "comment_count": comment_count,
        "created_at": event.created_at
    }

@app.post("/events/{event_id}/start")
def start_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Host starts an event (upcoming → live)"""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only host can start event
    if event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can start event")

    # Can only start if upcoming
    if event.status != "upcoming":
        raise HTTPException(status_code=400, detail="Event already started or ended")

    event.status = "live"
    db.commit()
    db.refresh(event)

    return {"message": "Event started", "status": event.status}


@app.post("/events/{event_id}/end")
def end_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Host ends an event (live → ended)"""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only host can end event
    if event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can end event")

    # Can only end if live
    if event.status != "live":
        raise HTTPException(status_code=400, detail="Event not currently live")

    event.status = "ended"
    db.commit()
    db.refresh(event)

    # Auto-generate reviews for any invited AI guests who haven't reviewed yet
    ai_guests = db.query(models.EventAIGuest).filter(
        models.EventAIGuest.event_id == event_id,
        models.EventAIGuest.has_reviewed == False
    ).all()

    for ai_guest in ai_guests:
        try:
            # Get event categories for the review
            categories = db.query(models.EventCategory).filter(
                models.EventCategory.event_id == event_id
            ).order_by(models.EventCategory.display_order).all()

            categories_list = [
                {
                    "category_name": cat.category_name,
                    "category_emoji": cat.category_emoji
                }
                for cat in categories
            ]

            # Get existing reviews for context
            existing_reviews = db.query(models.Review).filter(
                models.Review.event_id == event_id
            ).limit(3).all()

            existing_reviews_list = [
                {
                    "memorable_moment": review.memorable_moments,
                    "review_text": review.review_text
                }
                for review in existing_reviews
            ]

            # Generate AI review prompt
            from app.ai_personas import get_persona_prompt
            prompt = get_persona_prompt(
                persona_type=ai_guest.ai_persona_type,
                persona_name=ai_guest.ai_persona_name,
                event_name=event.title,
                event_date=event.event_date.strftime("%B %d, %Y"),
                categories=categories_list,
                existing_reviews=existing_reviews_list
            )

            # Generate the review
            review_data = generate_ai_review(prompt)

            # Create review record
            ai_review = models.Review(
                event_id=event_id,
                user_id=None,  # AI reviews have no user_id
                ratings=review_data["ratings"],
                review_text=review_data["review"],
                memorable_moments=review_data.get("memorable_moment", ""),
                tags=[],
                is_ai_generated=1,
                ai_persona_type=ai_guest.ai_persona_type,
                ai_persona_name=ai_guest.ai_persona_name
            )
            db.add(ai_review)

            # Mark AI guest as having reviewed
            ai_guest.has_reviewed = True

        except Exception as e:
            # Log error but don't fail the endpoint
            print(f"Failed to generate AI review for {ai_guest.ai_persona_name}: {e}")
            continue

    db.commit()

    return {"message": "Event ended", "status": event.status}

@app.get("/events/preview/{invite_code}", response_model=schemas.EventPreview)
def get_event_preview(
    invite_code: str,
    db: Session = Depends(get_db)
):
    """Get event preview for join page - shows event details and guest list"""

    # Find event by invite code
    event = db.query(models.Event).filter(models.Event.invite_code == invite_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get host name
    host = db.query(models.User).filter(models.User.id == event.host_id).first()

    # Get expected guests
    expected_guests = db.query(models.ExpectedGuest).filter(
        models.ExpectedGuest.event_id == event.id
    ).all()

    # Get joined guests (users who have joined this event)
    joined_guests = db.query(models.EventGuest, models.User).join(
        models.User, models.EventGuest.user_id == models.User.id
    ).filter(
        models.EventGuest.event_id == event.id
    ).all()

    # Format joined guests as list of dicts
    joined_list = [
        {"name": user.name, "display_name": guest.display_name}
        for guest, user in joined_guests
    ]

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date,
        "host_name": host.name if host else "Unknown",
        "expected_guests": [eg.guest_name for eg in expected_guests],
        "joined_guests": joined_list
    }

#review endpoint
@app.post("/events/{event_id}/reviews", response_model=schemas.ReviewResponse)
def create_review(
        event_id: int,
        review: schemas.ReviewCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
    ):

    """Submit a new review for an event with custom category ratings"""
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Reviews only allowed after event ends
    if event.status != "ended":
        raise HTTPException(
            status_code=400,
            detail="Reviews can only be submitted after event has ended"
        )

    # Check if a user has joined the event before they can create a review
    guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id,
        models.EventGuest.user_id == current_user.id
    ).first()

    if not guest:
        raise HTTPException(status_code=403,
        detail="You must join the event before submitting a review.  Please use the invite code to join."
        )

    # Check if user already reviewed this event
    existing_review = db.query(models.Review).filter(
        models.Review.event_id == event_id,
        models.Review.user_id == current_user.id
    ).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this event")

    # Get event categories
    categories = db.query(models.EventCategory).filter(
        models.EventCategory.event_id == event_id
    ).all()

    # Validate ratings match event categories
    expected_categories = {cat.category_name for cat in categories}
    provided_categories = set(review.ratings.keys())

    if expected_categories != provided_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Ratings must match event categories. Expected: {sorted(expected_categories)}"
        )

    # Validate rating values (1-5)
    for category, rating in review.ratings.items():
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail=f"Rating for '{category}' must be 1-5")

    # Create review with custom ratings
    db_review = models.Review(
        event_id=event_id,
        user_id=current_user.id,
        ratings=review.ratings,  # Store as JSON
        memorable_moments=review.memorable_moments,
        review_text=review.review_text,
        tags=review.tags
    )

    # Save to database
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return db_review

# Retrieve reviews for an event
@app.get("/events/{event_id}/reviews")
def get_event_reviews(event_id: int, db: Session = Depends(get_db)):
    """Get all reviews for an event with reviewer display names and vote counts"""
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all reviews for this event
    reviews = db.query(models.Review).filter(models.Review.event_id == event_id).all()
    
    # Enhance each review with display name and vote counts
    reviews_with_data = []
    for review in reviews:
        # Find the guest record for this reviewer at this event
        guest = db.query(models.EventGuest).filter(
            models.EventGuest.event_id == event_id,
            models.EventGuest.user_id == review.user_id
        ).first()
        
        # Calculate vote counts
        upvotes = db.query(models.ReviewVote).filter(
            models.ReviewVote.review_id == review.id,
            models.ReviewVote.vote_type == 1
        ).count()
        
        downvotes = db.query(models.ReviewVote).filter(
            models.ReviewVote.review_id == review.id,
            models.ReviewVote.vote_type == -1
        ).count()
        
        # Convert to dict and add all data
        review_dict = {
            "id": review.id,
            "event_id": review.event_id,
            "user_id": review.user_id,
            "ratings": review.ratings,  # Custom ratings as JSON
            "memorable_moments": review.memorable_moments,
            "review_text": review.review_text,
            "tags": review.tags,
            "created_at": review.created_at,
            "display_name": guest.display_name if guest and not review.is_ai_generated else (review.ai_persona_name if review.is_ai_generated else "Anonymous"),
            "upvotes": upvotes,
            "downvotes": downvotes,
            "is_ai_generated": bool(review.is_ai_generated),
            "ai_persona_type": review.ai_persona_type,
            "ai_persona_name": review.ai_persona_name
        }
        reviews_with_data.append(review_dict)
    
    return reviews_with_data


# AI Review Request Model
class AIReviewRequest(BaseModel):
    persona_type: str
    persona_name: str


# Generate AI persona review
@app.post("/events/{event_id}/ai-review")
def create_ai_review(
    event_id: int,
    request: AIReviewRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generate an AI review from a character persona.
    Available personas: karen, lightweight, genz
    """

    # Verify event exists and has ended
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != "ended":
        raise HTTPException(status_code=400, detail="AI reviews only available for ended events")

    # Verify persona_type is valid
    valid_personas = ["karen", "lightweight", "genz"]
    if request.persona_type not in valid_personas:
        raise HTTPException(status_code=400, detail=f"Invalid persona_type. Must be one of: {valid_personas}")

    # Get event categories
    categories = db.query(models.EventCategory).filter(
        models.EventCategory.event_id == event_id
    ).order_by(models.EventCategory.display_order).all()

    if not categories:
        raise HTTPException(status_code=400, detail="Event has no categories")

    # Get existing reviews for context (only real reviews, not AI)
    existing_reviews = db.query(models.Review).filter(
        models.Review.event_id == event_id,
        models.Review.is_ai_generated == 0  # Only real reviews
    ).all()

    # Format data for prompt
    categories_data = [
        {"category_name": cat.category_name, "category_emoji": cat.category_emoji}
        for cat in categories
    ]

    existing_reviews_data = [
        {"memorable_moment": rev.memorable_moments}
        for rev in existing_reviews if rev.memorable_moments
    ]

    # Get system prompt
    system_prompt = get_persona_prompt(
        persona_type=request.persona_type,
        persona_name=request.persona_name,
        event_name=event.title,
        event_date=event.event_date.isoformat(),
        categories=categories_data,
        existing_reviews=existing_reviews_data
    )

    # Call Anthropic API
    try:
        review_data = generate_ai_review(system_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate AI review: {str(e)}")

    # Validate ratings match categories
    expected_categories = {cat.category_name for cat in categories}
    provided_categories = set(review_data["ratings"].keys())

    if expected_categories != provided_categories:
        raise HTTPException(
            status_code=500,
            detail="AI generated ratings don't match event categories"
        )

    # Create the AI review
    ai_review = models.Review(
        event_id=event_id,
        user_id=None,  # AI reviews don't have a user
        ratings=review_data["ratings"],
        review_text=review_data["review"],  # Main review text (required)
        memorable_moments=review_data.get("memorable_moment"),  # Optional
        tags=[],  # AI reviews don't have tags
        is_ai_generated=1,  # Mark as AI
        ai_persona_type=request.persona_type,
        ai_persona_name=request.persona_name
    )

    db.add(ai_review)
    db.commit()
    db.refresh(ai_review)

    return {
        "id": ai_review.id,
        "event_id": ai_review.event_id,
        "ratings": ai_review.ratings,
        "review": ai_review.review_text,
        "memorable_moment": ai_review.memorable_moments,
        "is_ai_generated": True,
        "ai_persona_type": ai_review.ai_persona_type,
        "ai_persona_name": ai_review.ai_persona_name,
        "created_at": ai_review.created_at
    }


#login endpoint
from fastapi.security import OAuth2PasswordRequestForm

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
   """Login and get access token"""
    # Find user by email
   user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Check if user exists and password is correct
   if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Create access token with 7-day expiration
   from datetime import timedelta
   access_token = auth.create_access_token(
       data={"sub": user.email, "user_id": user.id, "name": user.name},
       expires_delta=timedelta(days=7)
   )

   return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "user_type": user.user_type
    }

@app.post("/events/join", response_model=schemas.EventGuestResponse)
def join_event(
    guest_data: schemas.EventGuestJoin,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Join an event using invite code and choose your display name"""
    # Find event by invite code
    event = db.query(models.Event).filter(
        models.Event.invite_code == guest_data.invite_code
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check if user already joined this event
    existing_guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event.id,
        models.EventGuest.user_id == current_user.id
    ).first()

    if existing_guest:
        raise HTTPException(status_code=400, detail="You already joined this event")

    # Create guest record with display name
    guest = models.EventGuest(
        event_id=event.id,
        user_id=current_user.id,
        display_name=guest_data.display_name
    )

    db.add(guest)
    db.commit()
    db.refresh(guest)

    return guest

@app.post("/events/join-after-login")
def join_event_after_login(
    invite_code: str,
    display_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Join an event after logging in (for users who clicked invite link)"""

    # Find event by invite code
    event = db.query(models.Event).filter(models.Event.invite_code == invite_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if already joined
    existing_guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event.id,
        models.EventGuest.user_id == current_user.id
    ).first()

    if existing_guest:
        raise HTTPException(status_code=400, detail="You have already joined this event")

    # Join event with pseudonym
    guest = models.EventGuest(
        event_id=event.id,
        user_id=current_user.id,
        display_name=display_name
    )
    db.add(guest)
    db.commit()

    return {"event_id": event.id, "message": "Successfully joined event"}

@app.post("/reviews/{review_id}/vote", response_model=schemas.VoteResponse)
def vote_on_review(
    review_id: int,
    vote: schemas.VoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upvote or downvote a review (1 = upvote, -1 = downvote)"""
    # Check if review exists
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Validate vote_type
    if vote.vote_type not in [1, -1]:
        raise HTTPException(status_code=400, detail="vote_type must be 1 (upvote) or -1 (downvote)")
    
    # Check if user already voted on this review
    existing_vote = db.query(models.ReviewVote).filter(
        models.ReviewVote.review_id == review_id,
        models.ReviewVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        # User already voted - update their vote
        existing_vote.vote_type = vote.vote_type
        db.commit()
        db.refresh(existing_vote)
        return existing_vote
    else:
        # Create new vote
        new_vote = models.ReviewVote(
            review_id=review_id,
            user_id=current_user.id,
            vote_type=vote.vote_type
        )
        db.add(new_vote)
        db.commit()
        db.refresh(new_vote)
        return new_vote
    
@app.get("/users/me/events")
def get_my_events(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get events created by and joined by the current user"""
    # Events I'm hosting
    hosted_events = db.query(models.Event).filter(models.Event.host_id == current_user.id).all()
    
    # Events I've joined (as a guest)
    joined_event_ids = db.query(models.EventGuest.event_id).filter(
        models.EventGuest.user_id == current_user.id
    ).all()
    joined_event_ids = [e[0] for e in joined_event_ids]
    
    joined_events = db.query(models.Event).filter(models.Event.id.in_(joined_event_ids)).all() if joined_event_ids else []
    
    # Convert to dict format
    return {
        "hosted": [
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "event_date": e.event_date,
                "invite_code": e.invite_code,
                "status": e.status,
                "created_at": e.created_at
            }
            for e in hosted_events
        ],
        "joined": [
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "event_date": e.event_date,
                "invite_code": e.invite_code,
                "status": e.status,
                "created_at": e.created_at
            }
            for e in joined_events
        ]
    }


# ============================================================================
# COMMENT ENDPOINTS - Live Event Feed
# ============================================================================

@app.post("/events/{event_id}/comments", response_model=schemas.CommentResponse)
def create_comment(
    event_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a comment on an event (must be a guest of the event)"""

    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user is a guest of this event
    guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id,
        models.EventGuest.user_id == current_user.id
    ).first()

    if not guest:
        raise HTTPException(status_code=403, detail="You must join the event to comment")

    # Validate photo if present
    if comment.photo_url:
        # Check if it's a valid base64 image
        if not comment.photo_url.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="Invalid image format. Must be data:image/...")

        # Check size - be more generous (10MB base64 = ~7MB actual)
        max_size = 10_000_000  # 10MB in chars
        if len(comment.photo_url) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large ({len(comment.photo_url)} chars). Max {max_size} chars (~7MB)"
            )

        # Validate it's actually a valid data URL
        if ',' not in comment.photo_url:
            raise HTTPException(status_code=400, detail="Invalid image data URL format")

    # Create comment
    db_comment = models.EventComment(
        event_id=event_id,
        user_id=current_user.id,
        comment_text=comment.comment_text,
        photo_url=comment.photo_url
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    # Return comment with pseudonym
    return {
        "id": db_comment.id,
        "event_id": db_comment.event_id,
        "user_id": db_comment.user_id,
        "comment_text": db_comment.comment_text,
        "photo_url": db_comment.photo_url,
        "created_at": db_comment.created_at,
        "upvotes": db_comment.upvotes,
        "downvotes": db_comment.downvotes,
        "commenter_name": guest.display_name,  # Use pseudonym!
        "user_vote": None
    }


@app.get("/events/{event_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all comments for an event (must be a guest)"""

    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if user is a guest
    guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id,
        models.EventGuest.user_id == current_user.id
    ).first()

    if not guest:
        raise HTTPException(status_code=403, detail="You must join the event to view comments")

    # Get all comments with commenter pseudonyms
    comments = db.query(models.EventComment).filter(
        models.EventComment.event_id == event_id
    ).order_by(models.EventComment.created_at.desc()).all()

    # Get user's votes for these comments
    comment_ids = [c.id for c in comments]
    user_votes = {}
    if comment_ids:
        votes = db.query(models.CommentVote).filter(
            models.CommentVote.comment_id.in_(comment_ids),
            models.CommentVote.user_id == current_user.id
        ).all()
        user_votes = {v.comment_id: v.vote_type for v in votes}

    # Build response with pseudonyms
    result = []
    for comment in comments:
        # Get commenter's pseudonym
        commenter_guest = db.query(models.EventGuest).filter(
            models.EventGuest.event_id == event_id,
            models.EventGuest.user_id == comment.user_id
        ).first()

        result.append({
            "id": comment.id,
            "event_id": comment.event_id,
            "user_id": comment.user_id,
            "comment_text": comment.comment_text,
            "photo_url": comment.photo_url,
            "created_at": comment.created_at,
            "upvotes": comment.upvotes,
            "downvotes": comment.downvotes,
            "commenter_name": commenter_guest.display_name if commenter_guest else "Unknown",
            "user_vote": user_votes.get(comment.id)
        })

    return result


@app.post("/comments/{comment_id}/vote")
def vote_on_comment(
    comment_id: int,
    vote: schemas.CommentVoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upvote or downvote a comment"""

    # Validate vote_type
    if vote.vote_type not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote must be 1 (upvote) or -1 (downvote)")

    # Check if comment exists
    comment = db.query(models.EventComment).filter(
        models.EventComment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Check if user is a guest of the event
    guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == comment.event_id,
        models.EventGuest.user_id == current_user.id
    ).first()

    if not guest:
        raise HTTPException(status_code=403, detail="You must join the event to vote")

    # Check for existing vote
    existing_vote = db.query(models.CommentVote).filter(
        models.CommentVote.comment_id == comment_id,
        models.CommentVote.user_id == current_user.id
    ).first()

    if existing_vote:
        # User already voted - update or remove
        if existing_vote.vote_type == vote.vote_type:
            # Same vote - remove it (un-vote)
            # Update counts
            if existing_vote.vote_type == 1:
                comment.upvotes = max(0, comment.upvotes - 1)
            else:
                comment.downvotes = max(0, comment.downvotes - 1)

            db.delete(existing_vote)
            db.commit()

            return {
                "message": "Vote removed",
                "upvotes": comment.upvotes,
                "downvotes": comment.downvotes,
                "user_vote": None
            }
        else:
            # Different vote - change it
            # Update counts (remove old, add new)
            if existing_vote.vote_type == 1:
                comment.upvotes = max(0, comment.upvotes - 1)
                comment.downvotes += 1
            else:
                comment.downvotes = max(0, comment.downvotes - 1)
                comment.upvotes += 1

            existing_vote.vote_type = vote.vote_type
            db.commit()

            return {
                "message": "Vote changed",
                "upvotes": comment.upvotes,
                "downvotes": comment.downvotes,
                "user_vote": vote.vote_type
            }
    else:
        # New vote
        new_vote = models.CommentVote(
            comment_id=comment_id,
            user_id=current_user.id,
            vote_type=vote.vote_type
        )

        # Update counts
        if vote.vote_type == 1:
            comment.upvotes += 1
        else:
            comment.downvotes += 1

        db.add(new_vote)
        db.commit()

        return {
            "message": "Vote recorded",
            "upvotes": comment.upvotes,
            "downvotes": comment.downvotes,
            "user_vote": vote.vote_type
        }


@app.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete own comment"""

    comment = db.query(models.EventComment).filter(
        models.EventComment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only the commenter can delete their comment
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted"}

# ============================================================
# FEEDBACK ENDPOINTS
# ============================================================

@app.post("/feedback", response_model=schemas.FeedbackResponse)
def submit_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Submit user feedback.
    Can be called by logged-in users or anonymous users.
    """
    
    # Create feedback entry
    new_feedback = models.Feedback(
        user_id=current_user.id if current_user else None,
        feedback_type=feedback.feedback_type,
        message=feedback.message,
        name=feedback.name if feedback.name else (current_user.name if current_user else "Anonymous"),
        email=feedback.email if feedback.email else (current_user.email if current_user else None),
        status="new"
    )
    
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    return new_feedback


@app.get("/admin/feedback")
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all feedback submissions.
    For now, any logged-in user can view. Add admin check later if needed.
    """
    feedback_list = db.query(models.Feedback).order_by(
        models.Feedback.created_at.desc()
    ).all()
    
    return feedback_list


# ============================================================
# EVENT SUMMARY & ADMIN ENDPOINTS
# ============================================================

@app.get("/events/{event_id}/summary")
def get_event_summary(event_id: int, db: Session = Depends(get_db)):
    """
    Get event summary - accessible without authentication.
    Perfect for sharing with people who didn't attend.
    """
    
    # Get event
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all guests
    guests = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id
    ).all()
    
    # Get all reviews
    reviews = db.query(models.Review).filter(
        models.Review.event_id == event_id
    ).all()
    
    # Get all comments
    comments = db.query(models.EventComment).filter(
        models.EventComment.event_id == event_id
    ).order_by(models.EventComment.created_at.desc()).all()

    # Get event categories
    categories = db.query(models.EventCategory).filter(
        models.EventCategory.event_id == event_id
    ).order_by(models.EventCategory.display_order).all()

    # Calculate average ratings for each custom category
    avg_ratings = {}
    if reviews:
        for category in categories:
            category_name = category.category_name
            # Calculate average for this category across all reviews
            ratings_for_category = [r.ratings.get(category_name, 0) for r in reviews if r.ratings.get(category_name)]
            if ratings_for_category:
                avg_ratings[category_name] = sum(ratings_for_category) / len(ratings_for_category)
            else:
                avg_ratings[category_name] = 0.0
    else:
        # No reviews yet - all averages are 0
        for category in categories:
            avg_ratings[category.category_name] = 0.0

    # Count photos
    photos = [c for c in comments if c.photo_url]

    # Get display names for reviews and comments
    review_data = []
    for r in reviews:
        guest = db.query(models.EventGuest).filter(
            models.EventGuest.event_id == event_id,
            models.EventGuest.user_id == r.user_id
        ).first()
        review_data.append({
            "id": r.id,
            "display_name": guest.display_name if guest else "Anonymous",
            "ratings": r.ratings,  # Custom ratings as JSON
            "memorable_moment": r.memorable_moments,
            "created_at": r.created_at
        })
    
    comment_data = []
    for c in comments:
        guest = db.query(models.EventGuest).filter(
            models.EventGuest.event_id == event_id,
            models.EventGuest.user_id == c.user_id
        ).first()
        comment_data.append({
            "id": c.id,
            "display_name": guest.display_name if guest else "Anonymous",
            "comment_text": c.comment_text,
            "photo_url": c.photo_url,
            "created_at": c.created_at
        })
    
    # Build summary
    summary = {
        "event": {
            "id": event.id,
            "event_name": event.title,
            "event_date": event.event_date,
            "status": event.status,
            "description": event.description
        },
        "summary": {
            "total_attendees": len(guests),
            "total_reviews": len(reviews),
            "total_comments": len(comments),
            "total_photos": len(photos),
            "categories": [
                {
                    "category_name": cat.category_name,
                    "category_emoji": cat.category_emoji
                }
                for cat in categories
            ],
            "avg_ratings": avg_ratings,  # Dynamic custom category averages
            "reviews": review_data,
            "comments": comment_data,
            "photos": [
                {
                    "photo_url": c.photo_url,
                    "created_at": c.created_at
                }
                for c in photos
            ]
        }
    }

    return summary


@app.get("/admin/events")
def get_all_events_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Admin endpoint: Get all events with summary data.
    For now, any logged-in user can access. Add admin check later if needed.
    """
    
    # Get all events
    events = db.query(models.Event).order_by(models.Event.event_date.desc()).all()
    
    result = []
    for event in events:
        # Get summary data for each event
        guests = db.query(models.EventGuest).filter(
            models.EventGuest.event_id == event.id
        ).all()
        
        reviews = db.query(models.Review).filter(
            models.Review.event_id == event.id
        ).all()
        
        comments = db.query(models.EventComment).filter(
            models.EventComment.event_id == event.id
        ).all()

        # Get event categories
        categories = db.query(models.EventCategory).filter(
            models.EventCategory.event_id == event.id
        ).order_by(models.EventCategory.display_order).all()

        # Calculate average ratings for each custom category
        avg_ratings = {}
        if reviews:
            for category in categories:
                category_name = category.category_name
                # Calculate average for this category across all reviews
                ratings_for_category = [r.ratings.get(category_name, 0) for r in reviews if r.ratings.get(category_name)]
                if ratings_for_category:
                    avg_ratings[category_name] = sum(ratings_for_category) / len(ratings_for_category)
                else:
                    avg_ratings[category_name] = 0.0
        else:
            # No reviews yet - all averages are 0
            for category in categories:
                avg_ratings[category.category_name] = 0.0

        photos = [c for c in comments if c.photo_url]

        result.append({
            "event": {
                "id": event.id,
                "event_name": event.title,
                "event_date": event.event_date,
                "status": event.status,
                "host_id": event.host_id
            },
            "summary": {
                "total_attendees": len(guests),
                "total_reviews": len(reviews),
                "total_comments": len(comments),
                "total_photos": len(photos),
                "avg_ratings": avg_ratings  # Dynamic custom category averages
            }
        })

    return result


@app.post("/admin/process-ai-guests")
def process_ai_guests_background_job(
    db: Session = Depends(get_db)
):
    """
    Background job endpoint: Process pending AI guest actions.
    This should be called by a cron job every 10 minutes.

    Actions:
    1. Generate scheduled text comments
    2. Generate photo reactions for recent photos
    """

    results = {
        "comments_generated": 0,
        "photo_reactions_generated": 0,
        "errors": []
    }

    current_time = datetime.now(timezone.utc)

    # PART 1: Find AI guests with scheduled comments that are due
    pending_comments = db.query(models.EventAIGuest).filter(
        models.EventAIGuest.has_text_commented == False,
        models.EventAIGuest.text_comment_scheduled_time <= current_time
    ).all()

    for ai_guest in pending_comments:
        try:
            # Get event details
            event = db.query(models.Event).filter(models.Event.id == ai_guest.event_id).first()
            if not event or event.status != "live":
                continue  # Skip if event not found or not live

            # Get recent comments for context
            recent_comments = db.query(models.EventComment).filter(
                models.EventComment.event_id == ai_guest.event_id
            ).order_by(models.EventComment.created_at.desc()).limit(3).all()

            recent_comments_list = [
                {
                    "ai_persona_name": c.ai_persona_name,
                    "commenter_name": c.commenter.display_name if c.user_id else None,
                    "comment_text": c.comment_text
                }
                for c in recent_comments
            ]

            # Generate comment prompt
            from app.ai_personas import get_live_comment_prompt
            prompt = get_live_comment_prompt(
                persona_type=ai_guest.ai_persona_type,
                persona_name=ai_guest.ai_persona_name,
                event_name=event.title,
                event_status=event.status,
                recent_comments=recent_comments_list
            )

            # Generate comment
            from app.ai_helper import generate_ai_live_comment
            comment_data = generate_ai_live_comment(prompt)

            # Create comment record
            ai_comment = models.EventComment(
                event_id=ai_guest.event_id,
                user_id=None,  # AI comments have no user_id
                comment_text=comment_data["comment"],
                is_ai_generated=True,
                ai_persona_type=ai_guest.ai_persona_type,
                ai_persona_name=ai_guest.ai_persona_name
            )
            db.add(ai_comment)

            # Mark as commented
            ai_guest.has_text_commented = True

            results["comments_generated"] += 1

        except Exception as e:
            results["errors"].append(f"Failed to generate comment for {ai_guest.ai_persona_name}: {str(e)}")
            continue

    # PART 2: Find recent photos and generate reactions
    # Look for photos posted in the last 15 minutes that AI guests haven't reacted to yet
    recent_photo_cutoff = current_time - timedelta(minutes=15)

    # Get all live events with AI guests
    live_events = db.query(models.Event).filter(models.Event.status == "live").all()

    for event in live_events:
        # Get AI guests for this event
        ai_guests_for_event = db.query(models.EventAIGuest).filter(
            models.EventAIGuest.event_id == event.id
        ).all()

        if not ai_guests_for_event:
            continue

        # Get recent photos posted to this event
        recent_photos = db.query(models.EventComment).filter(
            models.EventComment.event_id == event.id,
            models.EventComment.photo_url.isnot(None),
            models.EventComment.created_at >= recent_photo_cutoff
        ).all()

        if not recent_photos:
            continue

        # For each AI guest, check if they should react to a photo
        for ai_guest in ai_guests_for_event:
            # Only react if they haven't reacted in the last 30 minutes (avoid spam)
            if ai_guest.last_photo_reaction_time:
                time_since_last_reaction = current_time - ai_guest.last_photo_reaction_time
                if time_since_last_reaction < timedelta(minutes=30):
                    continue

            # Pick a random recent photo to react to
            if recent_photos:
                photo_comment = random.choice(recent_photos)

                try:
                    # Generate photo reaction prompt
                    from app.ai_personas import get_photo_reaction_prompt
                    prompt = get_photo_reaction_prompt(
                        persona_type=ai_guest.ai_persona_type,
                        persona_name=ai_guest.ai_persona_name,
                        event_name=event.title
                    )

                    # Generate reaction using vision API
                    from app.ai_helper import generate_ai_photo_reaction
                    reaction_data = generate_ai_photo_reaction(prompt, photo_comment.photo_url)

                    # Create reaction comment
                    ai_reaction = models.EventComment(
                        event_id=event.id,
                        user_id=None,  # AI comments have no user_id
                        comment_text=reaction_data["comment"],
                        is_ai_generated=True,
                        ai_persona_type=ai_guest.ai_persona_type,
                        ai_persona_name=ai_guest.ai_persona_name
                    )
                    db.add(ai_reaction)

                    # Update last reaction time
                    ai_guest.last_photo_reaction_time = current_time

                    results["photo_reactions_generated"] += 1

                except Exception as e:
                    results["errors"].append(f"Failed to generate photo reaction for {ai_guest.ai_persona_name}: {str(e)}")
                    continue

    db.commit()

    return results
