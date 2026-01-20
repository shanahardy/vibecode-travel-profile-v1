# Travel Profile Builder PRD

## Overview
A conversational AI-powered application that helps users build comprehensive, reusable travel profiles through natural voice or text interaction, then enables personalized trip planning and booking using that saved profile data.

## User Stories
- As a user, I want to build my travel profile through natural conversation (voice or text)
- As a user, I want my answers summarized with exact data points accurately extracted and saved
- As a user, I want to see extracted data in real-time and edit any field at any time
- As a user, I want the system to confirm my information back to me before moving forward
- As a user, I want to plan trips using my saved profile information
- As a user, I want personalized itineraries based on my travel preferences and constraints
- As a user, I want alerts about potential school schedule conflicts for trips with children
- As a user, I want to create, edit, and delete multiple trip plans

## Implementation Phases

### Phase 1: Onboarding Flow (Core Deliverable)
**Agent Setup & Core Conversation**
- OpenAI Agent Builder configuration for conversation logic
- Six-question onboarding flow with natural language processing
- "Done" signal detection (phrases like "I'm done", "Finished", "That's it")
- Real-time data extraction during conversation
- Confirmation loops (agent repeats extracted data for validation)

**Data Extraction & Display**
- Live extraction of structured data from conversational responses
- Simultaneous display of extracted data alongside conversation
- Field mapping for each data element type
- Editable fields for all captured data
- Support for multi-value fields (travelers, airports)

**Voice Integration Foundation**
- Voiceflow integration planning
- Voice/text mode switching capability
- Audio input/output handling preparation

### Phase 2: Voiceflow Integration
- Complete voice interaction implementation
- Seamless voice-to-text and text-to-voice conversion
- Voice conversation UI enhancements
- Audio quality optimization

### Phase 3: Backend & API Development
- User authentication system
- Profile data persistence
- API endpoints for profile CRUD operations
- Data validation and error handling

### Phase 4: Frontend Application
- Landing page (logged-out state)
- Login/signup flows
- Account/profile screens
- Profile editing interface
- Onboarding interface with two-panel design (conversation + data display)

### Phase 5: Trip Planning Agent
- Trip creation, editing, deletion functionality
- Individual chat agent per trip instance
- Integration with user profile data
- Itinerary generation engine
- School calendar integration and conflict detection
- Flight/accommodation/activity suggestion system
- Booking link aggregation

## Onboarding Questions & Data Model

### Question 1: Primary Contact Details
**Prompt:** "Confirm your primary contact details: first and last name, phone, email, birthday. This will populate any bookings and serve as your core profile information. Let me know when you're done."

**Data Extraction:**
- First Name (string)
- Last Name (string)
- Phone (string, validated format)
- Email (string, validated format)
- Birthday (date)

**Confirmation Loop:** Agent repeats all fields back for validation

---

### Question 2: Travel Group Composition
**Prompt:** "Tell me about your primary travel group. Is it just yourself, with a partner, or family? Please provide the name and age of each person, including children. Let me know when you're done."

**Data Extraction:**
- Travelers (array of objects)
  - Name (string)
  - Age (integer)
  - Relationship (inferred or asked if unclear)

**Confirmation Loop:** Agent repeats each individual's name and age

**Follow-up (conditional):** If any travelers under 18 detected:
"For the children in your family [names and ages], can you let me know what school and/or school district they're in so we can account for their school calendar when possible? You can say 'Disregard' and come back to this later."

**Additional Data Extraction:**
- School/School District (string, per minor)

---

### Question 3: Location & Airports
**Prompt:** "Tell me about where you live by sharing City, State, and Zipcode. You can also give me your full address. What airports or travel terminals do you usually travel from?"

**Data Extraction:**
- City (string)
- State (string)
- Zipcode (string)
- Full Address (string, optional)
- Preferred Airports/Terminals (array of strings)
  - Type notation (air/bus/train/ferry)

**Confirmation Loop:** Agent repeats location and all preferred terminals

---

### Question 4: Past Travel Experience
**Prompt:** "Tell me about your last trip or vacation. Where did you go? What did you like and not like about it? Did you have any special needs based on yourself or others traveling with you?"

**Data Extraction:**
- Last Trip Summary (object)
  - Destination (string)
  - Approximate Date (string/date)
  - Travelers (reference to group or list)
  - Likes (array of strings or summary)
  - Dislikes (array of strings or summary)
  - Special Needs (array of strings or summary)

**Confirmation Loop:** Agent provides succinct summary of trip details, likes/dislikes, and special needs

---

### Question 5: Budget & Spending Priorities
**Prompt:** "Tell me about your budget requirements and spending preferences. Do you prefer cheaper airline seats but more budget for lodging and food? What are your priorities spending-wise, and if you have a specific budget range, please share."

**Data Extraction:**
- Budget Summary (object)
  - Budget Range (string or numeric range)
  - Spending Priorities (array or summary text)
  - Specific Preferences (summary)

**Confirmation Loop:** Agent summarizes budget range and spending priorities

---

### Question 6: Upcoming Trip Plans
**Prompt:** "Do you have any trips you'll be planning in the next year, or would like to plan? If yes, let me know when, where, and the nature of the trip (business, family vacation, etc.), or give me an idea of what you have in mind if you're not sure."

**Data Extraction:**
- Planned Trips (array of objects)
  - Timeframe (string - dates or rough periods like "summer")
  - Destination (string or "undecided")
  - Trip Type (string - business/family vacation/etc.)
  - Additional Details (summary text)

**Confirmation Loop:** Agent summarizes each planned trip with all provided details

---

## Design System

### Colors (CSS Variables)
**Light Mode:**
- Background: `oklch(0.9824 0.0013 286.3757)`
- Foreground: `oklch(0.3211 0 0)`
- Card: `oklch(1.0000 0 0)`
- Card Foreground: `oklch(0.3211 0 0)`
- Primary: `oklch(0.6487 0.1538 150.3071)` - Teal/Green
- Primary Foreground: `oklch(1.0000 0 0)`
- Secondary: `oklch(0.6746 0.1414 261.3380)` - Purple/Blue
- Secondary Foreground: `oklch(1.0000 0 0)`
- Muted: `oklch(0.8828 0.0285 98.1033)`
- Muted Foreground: `oklch(0.5382 0 0)`
- Accent: `oklch(0.8269 0.1080 211.9627)` - Light Blue
- Accent Foreground: `oklch(0.3211 0 0)`
- Destructive: `oklch(0.6368 0.2078 25.3313)` - Red/Orange
- Destructive Foreground: `oklch(1.0000 0 0)`
- Border: `oklch(0.8699 0 0)`
- Input: `oklch(0.8699 0 0)`
- Ring: `oklch(0.6487 0.1538 150.3071)`

**Dark Mode:**
- Background: `oklch(0.2303 0.0125 264.2926)`
- Foreground: `oklch(0.9219 0 0)`
- Card: `oklch(0.3210 0.0078 223.6661)`
- Card Foreground: `oklch(0.9219 0 0)`
- Primary: `oklch(0.6487 0.1538 150.3071)`
- Secondary: `oklch(0.5880 0.0993 245.7394)`
- Muted: `oklch(0.3867 0 0)`
- Muted Foreground: `oklch(0.7155 0 0)`
- Accent: `oklch(0.6746 0.1414 261.3380)`
- Border: `oklch(0.3867 0 0)`

**Chart Colors:**
- Chart 1: `oklch(0.6487 0.1538 150.3071)`
- Chart 2: `oklch(0.6746 0.1414 261.3380)`
- Chart 3: `oklch(0.8269 0.1080 211.9627)`
- Chart 4: `oklch(0.5880 0.0993 245.7394)`
- Chart 5: `oklch(0.5905 0.1608 148.2409)`

### Typography
- Font Family Sans: Plus Jakarta Sans, sans-serif
- Font Family Serif: Source Serif 4, serif
- Font Family Mono: JetBrains Mono, monospace

**Text Sizes:**
- H1: 32px / 600 weight / 1.2 line-height / tracking-normal
- H2: 24px / 600 weight / 1.3 line-height / tracking-normal
- H3: 20px / 600 weight / 1.4 line-height / tracking-normal
- Body: 16px / 400 weight / 1.6 line-height / tracking-normal
- Small: 14px / 400 weight / 1.5 line-height / tracking-normal
- Tiny: 12px / 400 weight / 1.4 line-height / tracking-normal

### Spacing
- Base unit: 0.25rem (4px) - `--spacing`
- Scale: 0.25rem, 0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem
- Container padding: 1.5rem (mobile), 2rem (tablet), 3rem (desktop)

### Border Radius
- Small: `calc(0.5rem - 4px)` - `--radius-sm`
- Medium: `calc(0.5rem - 2px)` - `--radius-md`
- Large: `0.5rem` - `--radius-lg`
- Extra Large: `calc(0.5rem + 4px)` - `--radius-xl`

### Shadows
- 2XS: `0 1px 3px 0px hsl(0 0% 0% / 0.05)` - `--shadow-2xs`
- XS: `0 1px 3px 0px hsl(0 0% 0% / 0.05)` - `--shadow-xs`
- SM: `0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)` - `--shadow-sm`
- Default: `0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)` - `--shadow`
- MD: `0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)` - `--shadow-md`
- LG: `0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)` - `--shadow-lg`
- XL: `0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)` - `--shadow-xl`
- 2XL: `0 1px 3px 0px hsl(0 0% 0% / 0.25)` - `--shadow-2xl`

### Components

**Conversation Panel**
- Left-side panel in onboarding interface
- Background: `bg-card`
- Border: `border-r border-border`
- Full-height scrollable area
- Padding: `p-6`
- Message bubbles:
  - User: `bg-primary text-primary-foreground rounded-lg p-3`
  - Agent: `bg-muted text-foreground rounded-lg p-3`
- Voice/text input toggle: `bg-accent text-accent-foreground`
- Shadow: `shadow-md`

**Data Extraction Panel**
- Right-side panel in onboarding interface
- Background: `bg-background`
- Full-height scrollable area
- Padding: `p-6`
- Section headers: `text-muted-foreground text-sm font-medium mb-2`
- Real-time update animations: fade-in with `transition-opacity duration-300`
- Shadow: `shadow-sm`

**Editable Field**
- Display mode:
  - Background: `bg-card`
  - Border: `border border-input rounded-md`
  - Padding: `px-3 py-2`
  - Text: `text-foreground`
- Edit mode:
  - Border: `border-2 border-ring`
  - Focus ring: `ring-2 ring-ring ring-offset-2`
- Validation states:
  - Valid: `border-primary`
  - Invalid: `border-destructive`
  - Pending: `border-muted`
- Shadow: `shadow-xs`

**Confirmation Loop Display**
- Highlighted agent message: `bg-accent/10 border-l-4 border-accent`
- Structured data display: `bg-card rounded-md p-4 shadow-sm`
- Confirm button: `bg-primary text-primary-foreground hover:bg-primary/90`
- Correct button: `bg-secondary text-secondary-foreground hover:bg-secondary/90`
- Border radius: `rounded-lg`

**Voice Mode Indicator**
- Visual waveform: `bg-primary` with animated bars
- Active listening state: `bg-accent text-accent-foreground`
- Processing state: `bg-muted text-muted-foreground`
- Mode toggle switch:
  - Track: `bg-input`
  - Thumb: `bg-primary`
  - Shadow: `shadow-sm`

**Trip Card**
- Background: `bg-card`
- Border: `border border-border rounded-xl`
- Padding: `p-6`
- Shadow: `shadow-md hover:shadow-lg transition-shadow`
- Header image: `rounded-t-xl overflow-hidden`
- Trip name: `text-foreground font-semibold text-lg`
- Dates: `text-muted-foreground text-sm`
- Status indicator:
  - Planned: `bg-chart-1 text-white rounded-full px-3 py-1`
  - In Progress: `bg-chart-2 text-white rounded-full px-3 py-1`
- CTA button: `bg-primary text-primary-foreground rounded-md px-4 py-2 shadow-sm`

**Navigation**
- Top bar:
  - Background: `bg-card`
  - Border: `border-b border-border`
  - Height: `h-16`
  - Shadow: `shadow-sm`
- Logo area: `text-primary font-bold text-xl`
- Nav links:
  - Default: `text-muted-foreground hover:text-foreground`
  - Active: `text-primary border-b-2 border-primary`
- Account menu:
  - Trigger: `bg-muted rounded-full p-2`
  - Dropdown: `bg-popover text-popover-foreground rounded-md shadow-lg border border-border`

**Button Variants**
- Primary: `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm`
- Secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm`
- Destructive: `bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm`
- Outline: `border border-input bg-background hover:bg-accent hover:text-accent-foreground`
- Ghost: `hover:bg-accent hover:text-accent-foreground`
- All buttons: `rounded-md px-4 py-2 font-medium transition-colors`

**Input Fields**
- Default: `bg-background border border-input rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2`
- Disabled: `bg-muted cursor-not-allowed opacity-50`
- Error: `border-destructive focus:ring-destructive`

**Multi-Value Field Controls**
- Container: `bg-card border border-border rounded-md p-3 space-y-2`
- Item: `bg-muted rounded-md px-3 py-2 flex items-center justify-between`
- Add button: `bg-accent text-accent-foreground rounded-md px-3 py-1 text-sm`
- Remove button: `text-destructive hover:bg-destructive/10 rounded-sm p-1`

## Technical Architecture

### Frontend Stack
- React with TypeScript
- Styling: Tailwind CSS with CSS variables from design system
- State management: React Context or Zustand
- Routing: React Router
- UI Framework: shadcn/ui components (uses design system tokens)
- Voice: Voiceflow SDK integration
- Real-time updates: WebSocket or polling

### Backend Stack
- OpenAI Agent Builder for conversation logic
- Voiceflow for voice interaction orchestration
- RESTful API (Node.js/Express or similar)
- Database: PostgreSQL or MongoDB for user profiles
- Authentication: OAuth 2.0 / JWT

### Data Storage
- User profiles (structured JSON with nested objects)
- Trip instances (linked to user profiles)
- Conversation history (optional, for debugging/improvement)

### Integration Points
- OpenAI API for Agent Builder
- Voiceflow API for voice capabilities
- School calendar APIs (for schedule conflict detection)
- Flight/hotel/activity APIs (future booking integration)

## Data Flow

1. **User starts onboarding** → Frontend initializes OpenAI Agent conversation
2. **Agent asks question** → Voice (Voiceflow) or text response
3. **User responds** → Answer sent to Agent Builder
4. **Agent extracts data** → Structured data returned to frontend
5. **Frontend displays extracted data** → Real-time update in data panel
6. **Agent confirms data** → Confirmation loop in conversation
7. **User validates** → Corrections loop back to step 3, confirmations proceed
8. **Question complete** → Move to next question
9. **Onboarding complete** → Save profile to backend
10. **Trip planning** → New agent instance references saved profile

## Success Metrics
- Onboarding completion rate
- Data extraction accuracy (% of fields correctly captured)
- User satisfaction with voice/text experience
- Time to complete onboarding
- Profile edit frequency (lower = better initial accuracy)
- Trip planning engagement rate

## Future Enhancements
- Multi-language support
- AI-powered destination recommendations
- Budget optimization suggestions
- Real-time booking price tracking
- Shared travel profiles (family accounts)
- Travel document management
- Loyalty program integration