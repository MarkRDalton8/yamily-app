from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Event Schemas
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_date: datetime
    invite_code: str
    host_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Review Schemas
class ReviewCreate(BaseModel):
    food_quality: int
    drama_level: int
    alcohol_availability: int
    conversation_topics: int
    review_text: str
    memorable_moments: str
    tags: List[str] = []

class ReviewResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    food_quality: int
    drama_level: int
    alcohol_availability: int
    conversation_topics: int
    overall_rating: float
    memorable_moments: str
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