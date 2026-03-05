import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app import models, schemas, auth
from app.auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware

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
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with hashed password
    hashed_password = auth.hash_password(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    
    # Save to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

# event endpoint
@app.post("/events", response_model=schemas.EventResponse)
def create_event(
        event: schemas.EventCreate, 
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
    ):
    """Create a new event with an invite code"""
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
    db.commit()
    db.refresh(db_event)
    
    return db_event

#review endpoint
@app.post("/events/{event_id}/reviews", response_model=schemas.ReviewResponse)
def create_review(
        event_id: int, 
        review: schemas.ReviewCreate, 
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
    ):

    """Submit a new review for an event"""
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if a user has joined the event before they can create a review
    guest= db.query(models.EventGuest).filter(
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

    # Calculate overall rating (average of all ratings)
    overall = (
        review.food_quality +
        review.drama_level +
        review.alcohol_availability +
        review.conversation_topics
    ) / 4.0

    db_review = models.Review(
        event_id=event_id,
        user_id=current_user.id,
        food_quality=review.food_quality,
        drama_level=review.drama_level,
        alcohol_availability=review.alcohol_availability,
        conversation_topics=review.conversation_topics,
        overall_rating=overall,
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
            "food_quality": review.food_quality,
            "drama_level": review.drama_level,
            "alcohol_availability": review.alcohol_availability,
            "conversation_topics": review.conversation_topics,
            "overall_rating": review.overall_rating,
            "memorable_moments": review.memorable_moments,
            "review_text": review.review_text,
            "tags": review.tags,
            "created_at": review.created_at,
            "display_name": guest.display_name if guest else "Anonymous",
            "upvotes": upvotes,
            "downvotes": downvotes
        }
        reviews_with_data.append(review_dict)
    
    return reviews_with_data

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
    
    # Create access token
   access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id, "name": user.name})
   
   return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "name": user.name
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
                "created_at": e.created_at
            }
            for e in joined_events
        ]
    }