# Voiceflow Integration Guide

## Overview

This document describes the Voiceflow Dialog Manager API integration for the voice onboarding experience. The integration replaces the browser-native Web Speech API and mock AI with Voiceflow's conversation management system.

## Architecture

### Backend: Voiceflow API Proxy

The backend acts as a secure proxy to the Voiceflow Dialog Manager API, keeping API keys server-side and managing session state.

**Key Routes:**
- `POST /api/voiceflow/session` - Initialize a new Voiceflow session
- `POST /api/voiceflow/interact` - Send messages/actions to Voiceflow
- `GET /api/voiceflow/state` - Get current conversation state
- `DELETE /api/voiceflow/session` - Reset/end session
- `GET /api/voiceflow/status` - Health check

**Session Management:**
- Replit user ID mapped to Voiceflow user ID (`replit_{userId}`)
- Session stored in-memory with cookie-based session ID
- Sessions persist across page refreshes via httpOnly cookies

### Frontend: Voiceflow Client

The frontend client provides TypeScript-typed wrappers around the backend API.

**Key Functions:**
- `initVoiceflowSession()` - Initialize session on page load
- `sendMessage(message)` - Send text message to Voiceflow
- `sendAction(action)` - Send action (launch, intent)
- `parseVoiceflowResponse(traces)` - Extract messages and profile data

### Data Flow

```
User Input (Text)
    ↓
Frontend (voiceflow-client.ts)
    ↓ POST /api/voiceflow/interact
Backend (voiceflowRoutes.ts)
    ↓ Proxy to Voiceflow DM API
Voiceflow Dialog Manager
    ↓ Returns traces (text, speak, profile_data, end)
Backend (parse traces)
    ↓ JSON response { messages, profileData, isComplete }
Frontend (update UI + profile store)
    ↓
ConversationPanel + ProfileDataPanel
```

## Voiceflow Project Configuration

The Voiceflow project must be configured with the project ID specified in `VOICEFLOW_PROJECT_KEY`. This project ID is used as the `versionID` parameter in API requests to ensure the correct Voiceflow project is used.

### Required Entities/Slots

**Contact Information:**
- `@firstName` - User's first name
- `@lastName` - User's last name
- `@email` - Email address
- `@phone` - Phone number
- `@dateOfBirth` - Date of birth

**Travel Group:**
- `@memberName` - Group member name
- `@memberAge` - Member age
- `@isMinor` - Boolean for minor status
- `@schoolName` - School name (for minors)

**Location:**
- `@city` - Home city
- `@state` - Home state
- `@zipCode` - ZIP code
- `@airportCode` - Nearest airport code

**Trip Information:**
- `@destination` - Trip destination
- `@timeframe` - Trip dates/flexibility
- `@tripPurpose` - Purpose (vacation, business, etc.)

**Budget:**
- `@budgetRange` - Budget range
- `@priorityCategory` - Priority spending category

### Custom Trace Type: `profile_data`

To extract structured profile data, emit custom traces from your Voiceflow flow:

```javascript
// In a Code block within Voiceflow
return {
  type: 'profile_data',
  payload: {
    data: {
      contactInfo: {
        firstName: slots.firstName,
        lastName: slots.lastName,
        email: slots.email,
        phone: slots.phone,
        dateOfBirth: slots.dateOfBirth
      }
    }
  }
};
```

The backend will parse this trace and include it in the response, which the frontend will use to update the profile store.

### Conversation Flow Structure

1. **Step 1: Welcome + Contact Info**
   - Greet user
   - Collect: firstName, lastName, email, phone, dateOfBirth
   - Emit `profile_data` trace with contactInfo

2. **Step 2: Travel Group**
   - Ask about travel companions
   - Collect group members (name, age, isMinor, schoolInfo)
   - Emit `profile_data` trace with groupMembers array

3. **Step 3: Location**
   - Ask about home location
   - Collect: city, state, zipCode, nearestAirport
   - Emit `profile_data` trace with location

4. **Step 4: Upcoming Trips**
   - Ask about planned trips
   - Collect: destination, timeframe, purpose
   - Emit `profile_data` trace with trips array

5. **Step 5: Past Trip Experience**
   - Ask about previous travel experiences
   - Collect: pastTripExperience (text summary)
   - Emit `profile_data` trace with pastTripExperience

6. **Step 6: Budget Preferences**
   - Ask about budget priorities
   - Collect: budgetRange, priorityCategory
   - Emit `profile_data` trace with budgetPreferences

7. **Completion**
   - Summarize collected information
   - Emit `end` trace to signal completion

## Environment Variables

Add to `.env`:

```bash
# Voiceflow Integration
VOICEFLOW_API_KEY=VF.DM.XXXXXXXX.XXXXXXXXX
VOICEFLOW_PROJECT_KEY=697bb8bc859481e5c36570af
VOICEFLOW_VERSION=production
VOICEFLOW_RUNTIME_URL=https://general-runtime.voiceflow.com
```

**Note:** The `VOICEFLOW_PROJECT_KEY` is used as the `versionID` parameter in API requests to specify which Voiceflow project to use. This allows switching between different projects without changing the API key.

**Getting Your API Key:**
1. Go to Voiceflow Dashboard
2. Navigate to your project settings
3. Go to API Keys section
4. Copy the Dialog Manager API key (starts with `VF.DM.`)

## Setting Up in Replit

This project is deployed on Replit. To configure Voiceflow:

### Step 1: Get Your Voiceflow API Key

1. Go to [Voiceflow Dashboard](https://www.voiceflow.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** → **API Keys**
4. Copy the **Dialog Manager API Key** (starts with `VF.DM.`)

### Step 2: Get Your Project Key

1. In Voiceflow Dashboard, note your **Project ID**
2. You can find this in:
   - The project URL: `voiceflow.com/project/PROJECT_ID`
   - Project Settings → General

### Step 3: Add to Replit Secrets

1. In Replit, open the **Secrets** tab (🔒 icon in left sidebar)
2. Click **New Secret**
3. Add:
   - Key: `VOICEFLOW_API_KEY`
   - Value: Your Dialog Manager API key (e.g., `VF.DM.a1b2c3d4.e5f6g7h8`)
4. Click **Add Secret**
5. Repeat for `VOICEFLOW_PROJECT_KEY` with your project ID

**Important:** The `.env` file contains placeholder values. Replit Secrets will override these values automatically.

### Step 4: Restart the Server

1. Click the **Stop** button in Replit
2. Click **Run** to restart with new secrets
3. Check console logs for configuration status:
   ```
   [Voiceflow] Configuration Check:
     API Key: ✓ SET (VF.DM.a1b2...)
     Project Key: ✓ SET (697bb8bc859481e5c36570af)
     Runtime URL: https://general-runtime.voiceflow.com
   ```

### Step 5: Test the Integration

1. Navigate to `/onboarding` page
2. The conversation should initialize automatically
3. Type a message to test the integration
4. Check browser console and Network tab if issues occur

### Troubleshooting Replit Setup

**Error: "Voiceflow API key not configured"**
- Verify the secret name is exactly `VOICEFLOW_API_KEY` (case-sensitive)
- Check the API key doesn't have extra spaces or newlines
- Restart the Repl after adding secrets

**Error: "Voiceflow API key is a placeholder"**
- The code is reading the `.env` file instead of Replit Secrets
- Double-check the secret name matches exactly
- Try deleting and re-adding the secret
- Ensure you clicked "Add Secret" to save

**Error: "Failed to initialize Voiceflow session"**
- Check Voiceflow project is published to production version
- Verify project has a `launch` action handler
- Check Voiceflow API status at https://status.voiceflow.com
- Review server logs for detailed error messages

**Error: "Authentication failed" (401/403)**
- API key may be invalid or expired
- Generate a new API key in Voiceflow Dashboard
- Update Replit Secret with new key

**Session initializes but no agent responses**
- Verify Voiceflow flow has proper launch handler
- Check flow is published to the version specified in `VOICEFLOW_PROJECT_KEY`
- Review server logs for Voiceflow API error details

### Checking Configuration Status

You can check the configuration status using the status endpoint:

```bash
curl http://localhost:5000/api/voiceflow/status \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

Or visit the endpoint in your browser after logging in. The response will show:
- Whether API key is valid, placeholder, or missing
- Whether project key is configured
- Setup instructions if configuration is incomplete

## Testing

### Manual Testing

1. **Session Initialization:**
   ```bash
   curl -X POST http://localhost:5000/api/voiceflow/session \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     -H "Content-Type: application/json"
   ```

2. **Send Message:**
   ```bash
   curl -X POST http://localhost:5000/api/voiceflow/interact \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     -H "Content-Type: application/json" \
     -d '{"message": "My name is John Doe"}'
   ```

3. **Check Status:**
   ```bash
   curl http://localhost:5000/api/voiceflow/status \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
   ```

### Frontend Testing

1. Navigate to `/onboarding` page
2. Verify Voiceflow session initializes (check Network tab)
3. Type a message and send
4. Verify agent response appears in chat
5. Check ProfileDataPanel for extracted data
6. Complete full onboarding flow
7. Verify data saves to database

### Unit Tests

Create tests for:
- Trace parsing utilities (`parseVoiceflowResponse`)
- Profile data merging logic
- Error handling and retry logic
- Session management

## Troubleshooting

### Session Initialization Fails

**Symptom:** Error message "Failed to initialize voice session"

**Solutions:**
1. Check VOICEFLOW_API_KEY is set in .env
2. Verify API key is valid (not expired)
3. Check Voiceflow project ID matches
4. Ensure user is authenticated (Replit Auth)

### No Agent Responses

**Symptom:** User message sends but no response appears

**Solutions:**
1. Check Voiceflow flow has a 'launch' action handler
2. Verify flow is published to 'production' version
3. Check backend logs for Voiceflow API errors
4. Ensure traces include 'text' or 'speak' types

### Profile Data Not Extracting

**Symptom:** Chat works but ProfileDataPanel stays empty

**Solutions:**
1. Verify Voiceflow flow emits 'profile_data' traces
2. Check trace payload structure matches expected format
3. Inspect Network tab for response data
4. Check browser console for parsing errors

### Session Expires

**Symptom:** "No session found" error mid-conversation

**Solutions:**
1. Check cookie expiration (default: 7 days)
2. Verify session cookie is httpOnly and secure in production
3. Check backend session store for session ID
4. Re-initialize session if expired

## Production Considerations

### Session Storage

Current implementation uses in-memory Map for session storage. For production:

**Option 1: Redis**
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store session
await redis.setex(`voiceflow:${sessionId}`, 604800, JSON.stringify(session));

// Retrieve session
const data = await redis.get(`voiceflow:${sessionId}`);
const session = JSON.parse(data);
```

**Option 2: Database**
Add `voiceflow_sessions` table:
```sql
CREATE TABLE voiceflow_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  voiceflow_user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

### Rate Limiting

Add rate limiting to Voiceflow routes:

```typescript
import rateLimit from 'express-rate-limit';

const voiceflowLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.'
});

app.post('/api/voiceflow/interact', voiceflowLimiter, isAuthenticated, async (req, res) => {
  // ...
});
```

### Error Monitoring

Add error tracking for Voiceflow API failures:

```typescript
import * as Sentry from '@sentry/node';

try {
  const response = await fetchWithRetry(interactUrl, options);
  // ...
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: 'voiceflow' },
    extra: { userId, message }
  });
  throw error;
}
```

### Costs

**Voiceflow Pricing:**
- Check current pricing at https://www.voiceflow.com/pricing
- Monitor API call volume in Voiceflow dashboard
- Set up usage alerts for budget management

**Optimization Tips:**
- Cache common responses (if applicable)
- Use shorter session timeouts
- Batch profile data extractions
- Consider voice input only for premium users

## Future Enhancements

### Voice Input via Voiceflow

Add audio streaming to Voiceflow's voice API:

```typescript
app.post('/api/voiceflow/audio', isAuthenticated, async (req, res) => {
  const audioBuffer = req.body;

  const response = await fetch(`${VOICEFLOW_RUNTIME_URL}/audio/user/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': process.env.VOICEFLOW_API_KEY!,
      'Content-Type': 'audio/wav'
    },
    body: audioBuffer
  });

  const result = await response.json();
  res.json(result);
});
```

### Voice Output via Voiceflow TTS

Replace browser SpeechSynthesis with Voiceflow's TTS:

```typescript
// In ConversationPanel.tsx
useEffect(() => {
  const lastMessage = messages.slice().reverse().find(m => m.role === 'assistant');

  if (lastMessage && autoSpeak && !isLoading) {
    // Check for TTS URL in Voiceflow trace
    const ttsUrl = lastMessage.ttsUrl;
    if (ttsUrl) {
      const audio = new Audio(ttsUrl);
      audio.play();
    }
  }
}, [messages, autoSpeak, isLoading]);
```

### Multi-Language Support

Configure Voiceflow project with multiple languages:

```typescript
const response = await fetchWithRetry(interactUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': process.env.VOICEFLOW_API_KEY!,
  },
  body: JSON.stringify({
    action: { type: 'text', payload: message },
    config: {
      locale: userLocale // 'en-US', 'es-ES', etc.
    }
  })
});
```

## API Reference

### Backend Endpoints

#### POST /api/voiceflow/session

Initialize a new Voiceflow session.

**Authentication:** Required (Replit Auth)

**Response:**
```json
{
  "sessionId": "uuid",
  "voiceflowUserId": "replit_user123",
  "expiresAt": 1234567890000,
  "initialMessages": ["Hello! I'm here to help..."],
  "profileData": {}
}
```

#### POST /api/voiceflow/interact

Send a message or action to Voiceflow.

**Authentication:** Required

**Request:**
```json
{
  "message": "My name is John Doe"
}
```

OR

```json
{
  "action": {
    "type": "intent",
    "payload": {
      "intent": "skip_question"
    }
  }
}
```

**Response:**
```json
{
  "messages": ["Great! John Doe, what's your email?"],
  "profileData": {
    "contactInfo": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "isComplete": false,
  "traces": [/* raw Voiceflow traces */]
}
```

#### GET /api/voiceflow/state

Get current conversation state.

**Authentication:** Required

**Response:**
```json
{
  "state": {
    "stack": [],
    "storage": {},
    "variables": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### DELETE /api/voiceflow/session

Reset/delete current session.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

#### GET /api/voiceflow/status

Check Voiceflow service status.

**Authentication:** Required

**Response:**
```json
{
  "status": "ready",
  "message": "Voiceflow service is ready",
  "projectKey": "697bb8bc859481e5c36570af",
  "runtimeUrl": "https://general-runtime.voiceflow.com"
}
```

### Frontend Client API

#### initVoiceflowSession()

Initialize a new Voiceflow session.

**Returns:** `Promise<VoiceflowSessionResponse>`

```typescript
const session = await initVoiceflowSession();
console.log(session.sessionId, session.initialMessages);
```

#### sendMessage(message: string)

Send a text message to Voiceflow.

**Returns:** `Promise<VoiceflowResponse>`

```typescript
const response = await sendMessage("My name is John");
console.log(response.messages, response.profileData);
```

#### sendAction(action)

Send an action to Voiceflow.

**Returns:** `Promise<VoiceflowResponse>`

```typescript
const response = await sendAction({
  type: 'intent',
  payload: { intent: 'skip_question' }
});
```

#### parseVoiceflowResponse(traces)

Parse Voiceflow traces into structured data.

**Returns:** `{ messages: string[], profileData: ExtractedProfileData, isComplete: boolean }`

```typescript
const parsed = parseVoiceflowResponse(response.traces);
```

## Support

For issues or questions:
1. Check this documentation
2. Review Voiceflow documentation: https://docs.voiceflow.com
3. Check backend logs for error details
4. Contact Voiceflow support for API issues
5. File a GitHub issue for integration bugs
