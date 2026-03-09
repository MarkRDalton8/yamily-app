# Yamily Project - Context for Claude

## Project Overview
**Yamily** is a "Yelp for Family Gatherings" - a web application that lets users create, join, and review family events and gatherings. Users can rate events on multiple dimensions (food quality, drama level, alcohol availability, conversation topics) and leave reviews with memorable moments.

**Repository**: https://github.com/MarkRDalton8/yamily-app

**Current Status**: Fully functional MVP deployed on AWS Amplify

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy ORM with SQLite (dev) / PostgreSQL (prod ready)
- **Authentication**: JWT tokens with OAuth2PasswordBearer
- **Password Hashing**: bcrypt via passlib
- **CORS**: Configured for multiple frontend origins

### Frontend
- **Framework**: Next.js 16.0.10 (React 19)
- **Styling**: Tailwind CSS v4
- **Deployment**: AWS Amplify
- **API Communication**: Direct HTTPS calls to backend

### Deployment
- **Frontend**: AWS Amplify (https://yamily.app)
- **Backend**: AWS EC2 or similar (api.yamily.app)
- **Monitoring**: Custom monitoring script included

---

## Project Structure

```
yamily/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app & all endpoints
│   │   ├── models.py         # SQLAlchemy database models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # Authentication & JWT logic
│   │   ├── database.py       # Database connection setup
│   │   └── __init__.py
│   ├── requirements.txt      # Python dependencies
│   ├── yamily.db            # SQLite database (dev)
│   ├── .env                 # Environment variables
│   └── venv/                # Python virtual environment
│
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   └── Navbar.js         # Navigation component
│   │   ├── events/
│   │   │   ├── page.js           # Create new event
│   │   │   └── [id]/
│   │   │       ├── page.js       # View event & reviews
│   │   │       └── review/
│   │   │           └── page.js   # Submit review
│   │   ├── join/
│   │   │   └── page.js           # Join event with invite code
│   │   ├── login/
│   │   │   └── page.js           # User login
│   │   ├── register/
│   │   │   └── page.js           # User registration
│   │   ├── my-events/
│   │   │   └── page.js           # User's events dashboard
│   │   ├── lib/
│   │   │   └── api.js            # API URL configuration
│   │   ├── layout.js             # Root layout
│   │   ├── page.js               # Home page
│   │   └── globals.css           # Global styles
│   ├── package.json
│   ├── jsconfig.json
│   └── .next/                    # Next.js build output
│
├── amplify.yml                   # AWS Amplify build config
├── monitor-yamily.sh             # Deployment monitoring script
└── test_yamily_flow.py           # E2E multi-user test script
```

---

## Database Models

### User
- `id` (primary key)
- `email` (unique, indexed)
- `name`
- `hashed_password`
- `created_at`
- **Relationships**: hosted_events, reviews

### Event
- `id` (primary key)
- `title`
- `description`
- `event_date`
- `host_id` (foreign key to User)
- `invite_code` (unique, indexed - 6 char code)
- `created_at`
- **Relationships**: host, reviews

### Review
- `id` (primary key)
- `event_id` (foreign key)
- `user_id` (foreign key)
- `food_quality` (1-5 stars)
- `drama_level` (1-5 stars)
- `alcohol_availability` (1-5 stars)
- `conversation_topics` (1-5 stars)
- `overall_rating` (calculated average)
- `memorable_moments` (text)
- `review_text` (text)
- `tags` (JSON array)
- `created_at`
- **Relationships**: event, reviewer

### EventGuest
- `id` (primary key)
- `event_id` (foreign key)
- `user_id` (foreign key)
- `display_name` (party pseudonym - users can be anonymous!)
- `joined_at`
- **Relationships**: event, user

### ReviewVote
- `id` (primary key)
- `review_id` (foreign key)
- `user_id` (foreign key)
- `vote_type` (1 = upvote, -1 = downvote)
- `created_at`
- **Relationships**: review, user

---

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login & get JWT token

### Events
- `POST /events` - Create new event (authenticated)
- `POST /events/join` - Join event with invite code (authenticated)
- `GET /users/me/events` - Get user's hosted & joined events (authenticated)

### Reviews
- `POST /events/{event_id}/reviews` - Submit review (must be event guest)
- `GET /events/{event_id}/reviews` - Get all reviews for event
- `POST /reviews/{review_id}/vote` - Upvote/downvote review (authenticated)

### Health
- `GET /` - Welcome message
- `GET /health` - Health check

---

## Key Features Implemented

### User Authentication
- Registration with email/password
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes requiring authentication

### Event Management
- Create events with date, title, description
- Unique 6-character invite codes per event
- Join events using invite codes
- Choose display name when joining (anonymity!)
- View hosted events vs joined events

### Review System
- Multi-dimensional ratings (food, drama, alcohol, conversation)
- Automatic overall rating calculation
- Memorable moments and review text
- Tagging system (JSON array)
- Only guests who joined can review
- One review per user per event
- Display name shown on reviews (not real name!)

### Voting System
- Upvote/downvote reviews
- One vote per user per review
- Can change vote
- Vote counts displayed with reviews

### Security & Validation
- Must join event before reviewing
- Email uniqueness validation
- Duplicate review prevention
- JWT token validation
- CORS configuration for frontend access

---

## Environment Configuration

### Backend (.env)
```
DATABASE_URL=sqlite:///./yamily.db
SECRET_KEY=<jwt-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,https://yamily.app
```

### Frontend (Next.js)
```
NEXT_PUBLIC_API_URL=https://api.yamily.app
```

---

## Dependencies

### Backend (requirements.txt)
- fastapi==0.124.4
- uvicorn==0.38.0
- SQLAlchemy==2.0.45
- python-jose==3.5.0
- passlib==1.7.4
- bcrypt==4.0.1
- python-multipart==0.0.20
- python-dotenv==1.2.1
- pydantic==2.12.5
- email-validator==2.3.0

### Frontend (package.json)
- next==16.0.10
- react==19.2.1
- react-dom==19.2.1
- tailwindcss==4
- @tailwindcss/postcss==4

---

## Testing & Monitoring

### E2E Test Script (test_yamily_flow.py)
Multi-user test scenario covering:
1. User registration (2 users)
2. User login
3. Event creation
4. Joining events with invite codes
5. Submitting reviews
6. Voting on reviews

### Monitoring Script (monitor-yamily.sh)
Checks deployment status and health endpoints

---

## Current Deployment

### Production URLs
- **Frontend**: https://yamily.app (AWS Amplify)
- **Backend**: https://api.yamily.app

### Recent Deployment History
- Successfully deployed to AWS Amplify
- Configured SSR with Next.js standalone mode
- Direct HTTPS backend communication (removed proxy)
- Production readiness improvements completed

---

## Git Repository Status

**Current Branch**: main
**Latest Commits**:
- Remove proxy, use direct HTTPS backend at api.yamily.app
- Add production readiness improvements and bug fixes
- Add end-to-end multi-user test script
- Add AWS deployment monitoring script

**All changes are committed and pushed to GitHub**

---

## What's Next

Mark wants to make **major changes** to Yamily and needs help creating prompt files for Claude CLI to implement these changes efficiently.

### Questions to Explore with Mark:
1. What specific features or changes are planned?
2. Are there UX improvements needed?
3. Should the data model be expanded?
4. Are there new user flows to implement?
5. Performance or scalability concerns?
6. New integrations or services?

---

## Notes for Claude

- The project is fully functional and deployed
- Code quality is good with clear separation of concerns
- Authentication is properly implemented with JWT
- Database models use proper foreign keys and relationships
- The invite code system is clever (6-char codes for easy sharing)
- Display names add fun anonymity to reviews
- The multi-dimensional rating system is unique and well-implemented
- Everything is already on GitHub and ready for iteration

---

## How to Use This Context

This document provides comprehensive context about the Yamily project. Use it to:
1. Understand the current architecture and implementation
2. Create targeted prompt files for specific improvements
3. Plan new features that integrate well with existing code
4. Maintain consistency with current patterns and structure
5. Make informed decisions about refactoring or extensions

**Important**: All code is in the repository at https://github.com/MarkRDalton8/yamily-app - refer to actual implementation when creating detailed prompts.
