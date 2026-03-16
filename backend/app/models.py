from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON, UniqueConstraint, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import enum

# Event lifecycle status
class EventStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    ENDED = "ended"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    user_type = Column(String, default="attendee", nullable=False)  # "attendee" or "host"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    hosted_events = relationship("Event", back_populates="host")
    reviews = relationship("Review", back_populates="reviewer")
    feedback = relationship("Feedback", back_populates="user")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null if anonymous
    feedback_type = Column(String)  # feature, bug, improvement, other
    message = Column(Text)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="new")  # new, reviewed, resolved

    # Relationship to User
    user = relationship("User", back_populates="feedback")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    event_date = Column(DateTime, nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"))
    invite_code = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default=EventStatus.UPCOMING.value)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    host = relationship("User", back_populates="hosted_events")
    reviews = relationship("Review", back_populates="event")
    expected_guests = relationship("ExpectedGuest", back_populates="event", cascade="all, delete-orphan")
    comments = relationship("EventComment", back_populates="event", cascade="all, delete-orphan")
    categories = relationship("EventCategory", back_populates="event", cascade="all, delete-orphan")
    ai_guests = relationship("EventAIGuest", back_populates="event", cascade="all, delete-orphan")

class EventCategory(Base):
    __tablename__ = "event_categories"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    category_name = Column(String, nullable=False)  # e.g., "Food Quality"
    category_emoji = Column(String, nullable=True)  # e.g., "🍽️"
    display_order = Column(Integer, default=0)  # For ordering categories
    scale_labels = Column(JSON, nullable=True)  # Custom 1-5 rating labels: {"1": "Terrible", "2": "Poor", ...}

    # Relationship
    event = relationship("Event", back_populates="categories")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for AI reviews

    # Custom ratings stored as JSON: {"Food": 5, "Drama": 4, "Alcohol": 3}
    ratings = Column(JSON, nullable=False)

    # Memorable moments
    memorable_moments = Column(String)

    # Review content
    review_text = Column(String)
    tags = Column(JSON)  # Store tags as JSON array

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # AI-generated review fields
    is_ai_generated = Column(Integer, default=0)  # SQLite doesn't have native Boolean, use 0/1
    ai_persona_type = Column(String, nullable=True)  # "karen", "lightweight", "genz"
    ai_persona_name = Column(String, nullable=True)  # "Aunt Susan", "Uncle Mike", etc.

    # Relationships
    event = relationship("Event", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

class EventGuest(Base):
    __tablename__ = "event_guests"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    display_name = Column(String, nullable=False)  # Their party pseudonym!
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    event = relationship("Event")
    user = relationship("User")

class ExpectedGuest(Base):
    __tablename__ = "expected_guests"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    guest_name = Column(String, nullable=False)  # Just their name, not email
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    event = relationship("Event", back_populates="expected_guests")


class EventAIGuest(Base):
    """AI personas invited to the event as virtual guests"""
    __tablename__ = "event_ai_guests"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)

    # AI persona info
    ai_persona_type = Column(String, nullable=False)  # "karen", "lightweight", "genz"
    ai_persona_name = Column(String, nullable=False)  # "Aunt Susan", "Uncle Mike"

    # Behavior tracking
    has_text_commented = Column(Boolean, default=False)
    text_comment_scheduled_time = Column(DateTime, nullable=True)  # When they should comment

    last_photo_reaction_time = Column(DateTime, nullable=True)  # Track when they last reacted

    has_reviewed = Column(Boolean, default=False)  # Have they left end-of-event review?

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    event = relationship("Event", back_populates="ai_guests")


class ReviewVote(Base):
    __tablename__ = "review_votes"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote_type = Column(Integer, nullable=False)  # 1 for upvote, -1 for downvote
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    review = relationship("Review")
    user = relationship("User")


class EventComment(Base):
    __tablename__ = "event_comments"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for AI comments
    comment_text = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)  # For Day 4 - leave null for now
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Vote counts (denormalized for performance)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)

    # AI-generated content
    is_ai_generated = Column(Boolean, default=False)
    ai_persona_type = Column(String, nullable=True)  # "karen", "lightweight", "genz"
    ai_persona_name = Column(String, nullable=True)  # "Aunt Susan", etc.

    # Relationships
    event = relationship("Event", back_populates="comments")
    commenter = relationship("User")
    votes = relationship("CommentVote", back_populates="comment", cascade="all, delete-orphan")


class CommentVote(Base):
    __tablename__ = "comment_votes"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("event_comments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote_type = Column(Integer, nullable=False)  # 1 = upvote, -1 = downvote
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    comment = relationship("EventComment", back_populates="votes")
    user = relationship("User")

    # Ensure one vote per user per comment
    __table_args__ = (
        UniqueConstraint('comment_id', 'user_id', name='unique_comment_vote'),
    )