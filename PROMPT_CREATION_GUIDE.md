# Guide: Creating Effective Prompt Files for Yamily Development

This guide helps you (online Claude) create effective prompt files that CLI Claude can use to implement changes to the Yamily project.

---

## Understanding the Goal

Mark is working with two Claudes:
- **You (Online Claude)**: Planning and creating prompt files
- **CLI Claude**: Executing the changes based on your prompts

Your job is to create clear, comprehensive prompt files that give CLI Claude everything needed to implement changes successfully.

---

## Prompt File Structure

### Template for Yamily Prompt Files

```markdown
# [Feature/Change Name]

## Context
[Brief description of what needs to change and why]

## Current State
[What exists now - be specific about files, functions, models]

## Desired State
[What should exist after the changes]

## Implementation Tasks

### 1. Backend Changes
- [ ] [Specific file and change needed]
- [ ] [Database model changes if needed]
- [ ] [API endpoint changes]
- [ ] [Schema updates]

### 2. Frontend Changes
- [ ] [Specific component updates]
- [ ] [New pages if needed]
- [ ] [API integration changes]
- [ ] [UI/UX improvements]

### 3. Testing
- [ ] [What to test]
- [ ] [Test cases to add/update]

## Technical Details

### Database Changes
[If applicable - new columns, tables, relationships]

### API Changes
[Endpoint paths, request/response formats, authentication requirements]

### UI/UX Specifications
[Component behavior, user flows, styling requirements]

## Files to Modify
- `backend/app/main.py` - [what to change]
- `backend/app/models.py` - [what to change]
- `frontend/app/[path]/page.js` - [what to change]

## Dependencies
[Any new packages needed]

## Success Criteria
[How to verify the implementation is complete and working]

## Notes & Considerations
[Edge cases, security concerns, performance considerations]
```

---

## Best Practices for Yamily Prompts

### 1. Be Specific About Files
❌ **Bad**: "Update the backend to add notifications"
✅ **Good**: "Add notification endpoints to `backend/app/main.py` and create a Notification model in `backend/app/models.py`"

### 2. Include Data Model Details
When adding features, always specify:
- New database tables/models needed
- Column names and types
- Foreign key relationships
- Required vs optional fields

Example:
```python
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

### 3. Specify API Contract
For new endpoints, include:
- HTTP method and path
- Request body schema
- Response schema
- Authentication requirements
- Error responses

Example:
```
POST /notifications
Auth: Required (JWT)
Request: { "message": "string", "user_id": "integer" }
Response: { "id": 1, "message": "...", "read": false, "created_at": "..." }
Errors: 401 (unauthorized), 404 (user not found)
```

### 4. Define Frontend Behavior Clearly
For UI changes, specify:
- Which page/component to modify
- User interactions and expected behavior
- Form fields and validation
- API calls to make and when
- Error handling and loading states

### 5. Consider the Existing Patterns
Yamily has established patterns - prompts should follow them:
- Authentication: Use `Depends(get_current_user)` for protected endpoints
- Database: Use SQLAlchemy ORM patterns
- Frontend: Next.js App Router conventions
- Styling: Tailwind CSS utility classes
- API calls: Direct fetch calls to API_URL

### 6. Address Security
If the change involves:
- Authentication/authorization
- User data access
- Permissions/roles
- Sensitive information

Be explicit about security requirements and validation.

---

## Example Scenarios

### Scenario 1: Adding Event Photos

**Good Prompt Structure**:
```markdown
# Add Photo Upload to Events

## Context
Users want to upload photos to their events. Photos should be displayed
on the event detail page and in reviews.

## Database Changes
Add Photo model to backend/app/models.py:
- id (primary key)
- event_id (foreign key to events)
- user_id (foreign key to users)
- image_url (string, S3 URL)
- caption (optional string)
- uploaded_at (datetime)

Add relationship to Event model:
photos = relationship("Photo", back_populates="event")

## Backend Implementation
1. Add file upload endpoint: POST /events/{event_id}/photos
2. Integrate with AWS S3 for storage
3. Add schemas.py entries for PhotoCreate and PhotoResponse
4. Update GET /events/{event_id} to include photos

## Frontend Implementation
1. Add photo upload form to frontend/app/events/[id]/page.js
2. Display photo gallery on event page
3. Handle image preview before upload
4. Show loading state during upload

## Dependencies
Backend: boto3 for S3 integration
Frontend: None (use native File API)

## Success Criteria
- Users can upload photos to events they host or joined
- Photos display in a grid on event page
- File size limited to 5MB
- Supported formats: JPG, PNG, GIF
```

### Scenario 2: Improving the Review Display

**Good Prompt Structure**:
```markdown
# Enhanced Review Display with Sorting and Filtering

## Context
Reviews need better organization. Add sorting (newest, highest rated, most votes)
and filtering (by rating, by tag).

## Current State
frontend/app/events/[id]/page.js shows reviews in database order.
No sorting or filtering UI exists.

## Frontend Changes Only
1. Add sorting dropdown with options:
   - Newest First (default)
   - Highest Rated
   - Most Upvoted

2. Add filter chips for:
   - Rating (5 star, 4+ stars, etc.)
   - Tags (clickable tag filters from review tags)

3. Implement client-side sorting/filtering logic
4. Update UI to show active filters
5. Add "Clear Filters" button

## UI Specifications
- Sorting dropdown: Top right of reviews section
- Filter chips: Below sorting, horizontally scrollable
- Reviews fade in when filters change (smooth transition)
- Show count: "Showing X of Y reviews"

## No Backend Changes Required
All sorting/filtering happens client-side on fetched data.

## Success Criteria
- Sorting works correctly for all three options
- Filters can be combined (e.g., 5-star + specific tag)
- UI is responsive on mobile
- Loading state during filter changes
```

---

## Common Yamily Change Patterns

### Adding a New Feature
1. Start with data model (if needed)
2. Add API endpoints
3. Create/update schemas
4. Implement frontend pages/components
5. Update navigation if needed
6. Add to user flow (my-events page, etc.)

### Modifying Existing Feature
1. Identify all affected files (backend and frontend)
2. Specify exact changes to each file
3. Consider backward compatibility
4. Update related components/endpoints
5. Test existing functionality

### Adding New User Flow
1. Map out the flow (page by page)
2. Identify required pages/components
3. Specify API endpoints needed
4. Define navigation/routing
5. Add links from existing pages

---

## Checklist for Your Prompt Files

Before giving a prompt file to Mark, verify:

- [ ] All file paths are specific and correct
- [ ] Database changes include complete model definitions
- [ ] API endpoints have full specifications (method, path, auth, request, response)
- [ ] Frontend changes specify exact components/pages
- [ ] Security considerations are addressed
- [ ] Existing patterns are followed
- [ ] Dependencies are listed
- [ ] Success criteria are measurable
- [ ] Edge cases and errors are considered

---

## Tips for Different Types of Changes

### Data Model Changes
- Always include migration considerations
- Specify default values for new columns on existing data
- Consider relationships and cascading deletes
- Think about indexes for query performance

### API Changes
- Maintain RESTful conventions
- Use appropriate HTTP methods
- Include error handling specifications
- Document authentication requirements
- Consider rate limiting for resource-intensive endpoints

### UI/UX Changes
- Provide specific styling guidance (Tailwind classes)
- Specify responsive behavior
- Include loading and error states
- Define user feedback (toasts, messages, etc.)
- Consider accessibility (buttons, forms, etc.)

### Performance Improvements
- Identify the bottleneck
- Provide benchmarking criteria
- Consider caching strategies
- Think about database query optimization
- Address N+1 query problems

---

## Working with Mark's Requirements

When Mark describes what he wants:

1. **Ask Clarifying Questions** (if needed)
   - Exact behavior wanted
   - User flow expectations
   - Data persistence requirements
   - Integration with existing features

2. **Break Down Complex Changes**
   - Create multiple prompt files if needed
   - Order them logically (backend first, then frontend)
   - Make dependencies clear between prompts

3. **Consider Alternatives**
   - Suggest different approaches
   - Explain trade-offs
   - Recommend best practices

4. **Think About the User**
   - What's the user experience?
   - Is it intuitive?
   - Does it fit Yamily's fun, casual tone?

---

## Example: Full Prompt File

See the appendix or separate files for complete prompt examples that CLI Claude can use directly.

---

## Remember

CLI Claude is very capable, but needs:
- **Clarity**: Specific instructions, not vague goals
- **Context**: Understanding of existing code and patterns
- **Completeness**: All necessary details in one place
- **Verification**: Clear success criteria to test against

Your role is to translate Mark's vision into actionable, detailed prompts that CLI Claude can execute confidently.
