# Voiceflow TTS Implementation

## Overview
Replaced browser-based Web Speech API (`window.speechSynthesis`) with Voiceflow's cloud-based TTS service for higher quality audio, better multi-language support, and consistency with the Voiceflow conversation platform.

## Changes Implemented

### 1. Backend Changes

#### **voiceflowRoutes.ts** - TTS Configuration
- **Line 192**: Changed `tts: false` → `tts: true` (session initialization)
- **Line 279**: Changed `tts: false` → `tts: true` (interact endpoint)

#### **voiceflowRoutes.ts** - TTS URL Extraction
Updated `parseVoiceflowResponse` function (lines 53-98):
- Added `ttsUrls: string[]` array to track TTS URLs parallel to messages
- Extract TTS URLs from `speak` traces via `trace.payload.src`
- Return empty string for `text` traces (text-only messages)
- Return structure: `{ messages, ttsUrls, profileData, isComplete }`

#### **voiceflowRoutes.ts** - API Response Updates
- **Session endpoint** (line 227): Added `initialTtsUrls: parsed.ttsUrls` to response
- **Interact endpoint** (line 332): Added `ttsUrls: parsed.ttsUrls` to response

### 2. Type Definition Updates

#### **shared/voiceflow-types.ts**
- **VoiceflowResponse**: Added `ttsUrls: string[]` field
- **VoiceflowSessionResponse**: Added `initialTtsUrls: string[]` field

#### **client/src/lib/store.ts**
- **Message interface**: Added optional `ttsUrl?: string` field

### 3. Frontend API Client

#### **client/src/lib/voiceflow-client.ts**
Updated `parseVoiceflowResponse` function (lines 137-193):
- Added `ttsUrls: string[]` to return type
- Extract TTS URLs matching backend logic
- Return parallel arrays for messages and TTS URLs

### 4. UI Component Updates

#### **ConversationPanel.tsx** - Message Creation
- **Line 85-89**: Pass `ttsUrl` from `initialTtsUrls` array when adding initial messages
- **Line 173-179**: Pass `ttsUrl` from `ttsUrls` array when adding interaction messages

#### **ConversationPanel.tsx** - Audio Playback
- **Line 70**: Added `audioRef` to manage HTML5 Audio element
- **Lines 140-157**: Replaced Web Speech API with Voiceflow TTS
  - Uses HTML5 Audio API instead of `window.speechSynthesis`
  - Cancels previous audio before playing new one
  - Handles errors gracefully with console warnings
  - No markdown stripping needed (Voiceflow returns clean text)

#### **VoiceInput.tsx** - Interface Update
- **Line 5**: Import `Message` type from store
- **Line 12**: Changed `lastMessage` prop type from `string` to `Message`
- **Line 18**: Added `audioRef` for audio management

#### **VoiceInput.tsx** - Audio Playback
- **Lines 85-98**: Replaced Web Speech API with Voiceflow TTS
  - Uses HTML5 Audio API
  - Accesses `lastMessage.ttsUrl` instead of text content
  - Proper cleanup on component unmount

- **Lines 181-184**: Updated mute handler to cancel audio using `audioRef`

### 5. Test Updates

#### **jest.setup.js**
Added HTML5 Audio API mock (lines 342-355):
```javascript
global.Audio = jest.fn().mockImplementation((src) => {
  return {
    src,
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    // ... other Audio properties
  };
});
```

#### **server/__tests__/setup/mocks.ts**
- **Line 250**: Updated `speakTrace.payload.src` to use realistic Voiceflow TTS URL

#### **server/__tests__/voiceflow-integration.test.ts**
Added 2 new tests:
1. **"should extract TTS URLs from speak traces"** - Verifies TTS URLs are extracted and returned
2. **"should maintain parallel arrays for messages and TTS URLs"** - Verifies 1:1 correspondence

## Architecture Decisions

### TTS URL Extraction
- Backend parses Voiceflow traces and extracts TTS URLs from `payload.src` field
- API responses include parallel arrays: `messages[]` and `ttsUrls[]`

### Message Enhancement
- Message interface includes optional `ttsUrl?: string` field
- Frontend components check for TTS URL before creating Audio element

### Audio Playback Strategy
- Uses HTML5 Audio API with React refs for proper lifecycle management
- Cancels previous audio before playing new one (prevents overlapping)
- Silent fallback if TTS URL missing (no Web Speech API fallback)

### Data Structure
- Parallel arrays maintain 1:1 correspondence (messages.length === ttsUrls.length)
- Empty string for text-only messages, URL for spoken messages
- Optional chaining (`ttsUrls?.[index]`) prevents errors on missing data

## Edge Cases Handled

1. **Mobile Autoplay Restrictions**: First audio may not play until user interaction (mute toggle provides this)
2. **Missing TTS URLs**: Check `if (ttsUrl)` before creating Audio element
3. **Audio Loading Delays**: Non-blocking playback - text appears immediately
4. **Concurrent Playback**: audioRef ensures only one audio plays at a time
5. **Navigation Cleanup**: useEffect cleanup pauses audio on unmount
6. **Array Length Mismatch**: Optional chaining with undefined default

## Testing Results

- **45 tests** in voiceflow-integration.test.ts: ✅ All passing
- **189 total tests** in full suite: ✅ All passing
- New TTS tests verify:
  - TTS URLs extracted from speak traces
  - Parallel array structure maintained
  - Empty strings for text traces
  - 1:1 message-to-TTS correspondence

## Benefits

### Over Web Speech API:
1. **Higher Quality Audio**: Professional TTS from Voiceflow
2. **Multi-Language Support**: Voiceflow handles multiple languages/accents
3. **Consistency**: Same voice across all platforms and browsers
4. **Reliability**: No browser compatibility issues
5. **Control**: Voiceflow dashboard controls voice settings

### Implementation Quality:
- Clean separation of concerns (backend parsing, frontend playback)
- Type-safe with TypeScript
- Comprehensive test coverage
- Graceful degradation (silent fallback)
- Proper resource cleanup

## Rollback Plan

If issues arise:
1. Change `tts: true` back to `tts: false` in voiceflowRoutes.ts (lines 192, 279)
2. Remove `ttsUrls` extraction from `parseVoiceflowResponse`
3. Restore Web Speech API code in ConversationPanel.tsx and VoiceInput.tsx
4. Remove `ttsUrl` field from Message interface

## Future Enhancements

1. **User Preferences**: Allow users to disable/enable TTS
2. **Playback Controls**: Add pause/resume buttons
3. **Speed Control**: Allow users to adjust playback speed
4. **Voice Selection**: If Voiceflow supports multiple voices
5. **Error Recovery**: Retry failed audio downloads
6. **Accessibility**: Add ARIA labels for screen readers
