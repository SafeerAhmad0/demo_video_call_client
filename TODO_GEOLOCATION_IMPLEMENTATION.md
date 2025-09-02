# Geolocation Data Capture Implementation

## ✅ Completed Tasks

### Backend Implementation
- [x] Added `Geolocation` model in `backend/app/db/models.py`
  - Fields: id, claim_id, latitude, longitude, accuracy, timestamp, source, metadata
  - Foreign key relationship to claims table
- [x] Added Pydantic schemas in `backend/app/db/schemas.py`
  - `GeolocationCreate` for capturing data
  - `GeolocationResponse` for retrieving data
  - `GeolocationListResponse` for listing geolocations by claim
- [x] Created geolocation router in `backend/app/api/routers/geolocation.py`
  - `POST /geolocation/capture` - capture geolocation data for a claim
  - `GET /geolocation/claim/{claim_id}` - retrieve all geolocations for a claim
  - `GET /geolocation/{id}` - retrieve specific geolocation entry
  - `GET /geolocation/claim/{claim_id}/latest` - get latest geolocation for a claim
- [x] Updated router imports in `backend/app/api/routers/__init__.py`
- [x] Updated main app in `backend/app/main.py` to include geolocation router
- [x] Added geolocations table to `backend/init_db.sql`
- [x] Updated forms router to capture geolocation data
  - Added geolocation fields to `FormSubmissionRequest` schema
  - Modified `submit_form_data` endpoint to store geolocation in both FormSubmission and Geolocation tables

### Database Schema
- [x] Geolocation table with proper foreign key constraints
- [x] Indexes on claim_id for efficient queries
- [x] Proper data types for latitude, longitude, accuracy

## 🔄 Next Steps

### Testing
- [ ] Test geolocation API endpoints
- [ ] Test form submission with geolocation data
- [ ] Verify database relationships work correctly
- [ ] Test error handling for invalid claim IDs

### Frontend Integration
- [ ] Update frontend forms to capture geolocation data automatically
- [ ] Add geolocation permission requests in browser
- [ ] Update API service calls to include geolocation data
- [ ] Add UI components to display geolocation data

### Additional Features
- [ ] Add geolocation capture to meeting creation/start
- [ ] Add geolocation capture to recording start
- [ ] Implement geolocation data export functionality
- [ ] Add geolocation filtering and search capabilities

### Documentation
- [ ] Update API documentation with new geolocation endpoints
- [ ] Add geolocation data usage guidelines
- [ ] Document geolocation data retention policies

## 📋 API Endpoints Available

### Geolocation Endpoints
- `POST /api/v1/geolocation/capture` - Capture geolocation data
- `GET /api/v1/geolocation/claim/{claim_id}` - Get all geolocations for a claim
- `GET /api/v1/geolocation/{id}` - Get specific geolocation entry
- `GET /api/v1/geolocation/claim/{claim_id}/latest` - Get latest geolocation for a claim

### Updated Form Endpoints
- `POST /api/v1/forms/submit` - Now accepts and stores geolocation data

## 🔧 Technical Details

### Data Structure
```json
{
  "id": 1,
  "claim_id": 123,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10.5,
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "form_submission",
  "metadata": "Form submitted by John Doe for meeting abc-123"
}
```

### Database Relationships
- `Geolocation.claim_id` → `Claim.id`
- Supports multiple geolocation entries per claim
- Ordered by timestamp (most recent first)

### Automatic Capture
- Geolocation data is captured automatically from browser/client
- Stored in both existing FormSubmission table and new Geolocation table
- Supports different sources: 'form_submission', 'meeting', 'recording', 'manual'
