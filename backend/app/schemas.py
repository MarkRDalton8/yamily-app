from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    invite_code: Optional[str] = None  # For auto-join on registration
    display_name: Optional[str] = None  # Pseudonym for auto-join
    user_type: Optional[str] = "attendee"  # "attendee" or "host", defaults to attendee

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    user_type: str  # "attendee" or "host"
    created_at: datetime

    class Config:
        from_attributes = True

# Expected guest schemas
class ExpectedGuestBase(BaseModel):
    guest_name: str

class ExpectedGuestCreate(ExpectedGuestBase):
    pass

class ExpectedGuestResponse(ExpectedGuestBase):
    id: int
    event_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Category Schemas
class CategoryCreate(BaseModel):
    category_name: str
    category_emoji: Optional[str] = None
    display_order: int = 0
    scale_labels: Optional[Dict[str, str]] = None  # Custom 1-5 rating labels

class CategoryResponse(BaseModel):
    id: int
    category_name: str
    category_emoji: Optional[str]
    display_order: int
    scale_labels: Optional[Dict[str, str]] = None  # Custom 1-5 rating labels

    class Config:
        from_attributes = True

# Event Schemas
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    expected_guests: Optional[List[str]] = []  # List of guest names
    categories: Optional[List[CategoryCreate]] = None  # Custom categories (defaults to standard 4 if None)

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_date: datetime
    invite_code: str
    status: str
    host_id: int
    created_at: datetime
    expected_guests: Optional[List[ExpectedGuestResponse]] = []

    class Config:
        from_attributes = True

class EventPreview(BaseModel):
    """Event preview for join page - shows who's invited and who's joined"""
    id: int
    title: str
    description: str
    event_date: datetime
    host_name: str  # Name of the host
    expected_guests: List[str]  # Just names
    joined_guests: List[Dict[str, str]]  # [{"name": "Bob", "display_name": "Uncle Chaos"}]

    class Config:
        from_attributes = True

# Review Schemas
class ReviewCreate(BaseModel):
    ratings: Dict[str, int]  # {"Food": 5, "Drama": 4, "Alcohol": 3}
    review_text: str
    memorable_moments: str
    tags: List[str] = []

class ReviewResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    ratings: Dict[str, int]  # Custom ratings {"Food": 5, "Drama": 4}
    memorable_moments: Optional[str]
    review_text: str
    tags: List[str]
    created_at: datetime
    display_name: Optional[str] = None
    upvotes: int = 0
    downvotes: int = 0
    
    class Config:
        from_attributes = True

# EventGuest Schemas
class EventGuestJoin(BaseModel):
    invite_code: str
    display_name: str

class EventGuestResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    display_name: str
    joined_at: datetime
    
    class Config:
        from_attributes = True

# Vote Schemas
class VoteCreate(BaseModel):
    vote_type: int  # 1 for upvote, -1 for downvote

class VoteResponse(BaseModel):
    id: int
    review_id: int
    user_id: int
    vote_type: int
    created_at: datetime

    class Config:
        from_attributes = True


# Comment schemas
class CommentCreate(BaseModel):
    comment_text: str
    photo_url: Optional[str] = None  # For Day 4


class CommentResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    comment_text: str
    photo_url: Optional[str] = None
    created_at: datetime
    upvotes: int
    downvotes: int
    commenter_name: str  # Pseudonym of the commenter
    user_vote: Optional[int] = None  # Current user's vote (1, -1, or None)

    class Config:
        from_attributes = True


class CommentVoteCreate(BaseModel):
    vote_type: int  # 1 or -1


# Feedback Schemas
class FeedbackCreate(BaseModel):
    feedback_type: str  # feature, bug, improvement, other
    message: str
    name: Optional[str] = "Anonymous"
    email: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    user_id: Optional[int]
    feedback_type: str
    message: str
    name: Optional[str]
    email: Optional[str]
    created_at: datetime
    status: str

    class Config:
        from_attributes = True