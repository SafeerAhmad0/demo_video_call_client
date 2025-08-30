# JWT Authentication Removal - TODO List

## Phase 1: Backend Changes
- [x] Remove JWT generation from `backend/app/api/routers/meetings.py`
- [x] Update meeting URL generation without JWT tokens
- [x] Update SMS message content without JWT tokens

## Phase 2: Schema Updates
- [x] Update `VideoCallResponse` schema in `backend/app/db/schemas.py`

## Phase 3: Frontend Changes
- [x] Remove JWT token handling from `frontend/src/pages/MeetingPage.tsx`
- [x] Remove JWT parameter from navigation in `frontend/src/pages/Dashboard.tsx`
- [x] Ensure JitsiMeeting component handles undefined jwt properly

## Phase 4: Testing
- [ ] Test video call creation without JWT
- [ ] Verify SMS messages are sent correctly
- [ ] Test joining meetings without authentication
- [ ] Test both doctor and patient joining without "waiting for moderator"

## Current Status: Frontend changes completed, ready for testing
