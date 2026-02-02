# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Travel Planning Application** built with Express.js backend and React frontend. The app helps users create travel profiles, manage trips, and get AI-powered travel recommendations through OpenAI ChatKit integration. Key features include Replit authentication, Stripe payments for premium subscriptions, and comprehensive trip management.

## Commands

### Development
```bash
npm run dev              # Start development server (backend only)
npm run dev:client       # Start Vite dev server (frontend only, port 5000)
npm run build            # Build for production
npm start                # Run production build
npm run check            # TypeScript type checking
```

### Testing
```bash
npm test                 # Run full test suite (144 tests, ~25s)
npm run test:watch       # Run tests in watch mode
npm run test:quick       # Run tests without coverage
npm run test:parallel    # Run tests with 2 workers (faster)
npm test -- --coverage   # Generate coverage report (targets: 80% lines, 75% functions)
```

To run a single test file:
```bash
npx jest server/__tests__/trip-management.test.ts
npx jest server/__tests__/profile-workflow.test.ts
```

### Database
```bash
npm run db:push          # Push schema changes to database (Drizzle)
```

## Architecture Overview

### Authentication System (Replit Auth + Passport)

The app uses **Replit's OpenID Connect** for authentication with a multi-layered approach:

1. **Replit Auth Layer** (`server/replit_integrations/auth/`)
   - OpenID Connect authentication via `openid-client` library
   - Session management using PostgreSQL-backed sessions (`connect-pg-simple`)
   - User data stored in `users` table via `authStorage`
   - Auto-creates travel profiles on first login

2. **Passport Integration** (`server/replit_integrations/auth/replitAuth.ts`)
   - Dynamic strategy registration per domain (supports multi-domain deployments)
   - Token refresh logic with session persistence
   - Routes: `/api/login`, `/api/callback`, `/api/logout`

3. **Type Augmentation** (`server/replit_integrations/auth/types.ts`)
   - Extends `Express.User` with Replit claims structure
   - Adds `returnTo` to session data for post-login redirects

**Critical:** Routes must call `isAuthenticated` middleware from `replitAuth.ts`, NOT from `middleware/auth.ts`. The latter is a helper that extracts user IDs from already-authenticated sessions.

### Data Layer Architecture

**Two Storage Interfaces:**

1. **Auth Storage** (`server/replit_integrations/auth/storage.ts`)
   - Manages `users` table (id, email, firstName, stripeCustomerId, etc.)
   - Methods: `getUser()`, `upsertUser()`, `updateUser()`

2. **App Storage** (`server/storage.ts`)
   - Unified `IStorage` interface combining auth + travel domain
   - Delegates user methods to `authStorage`
   - Manages travel domain: profiles, trips, group members
   - Uses Drizzle ORM with PostgreSQL

**Key Tables:**
- `users` - Auth users (from Replit)
- `travel_profiles` - User travel preferences (1:1 with users)
- `trips` - User trips (many:1 with profiles)
- `travel_group_members` - Trip companions (many:1 with profiles)
- `sessions` - Express sessions (managed by connect-pg-simple)

### Route Registration Order (CRITICAL)

Routes must be registered in this specific order (`server/routes.ts`):

1. **Webhooks** - Needs raw body before JSON parsing
2. **Auth** - `setupAuth()` must run before other routes
3. **Payments** - Stripe checkout/portal
4. **ChatKit** - AI integration
5. **Profile** - Travel profiles and trips

### Frontend State Management

**Zustand Store** (`client/src/lib/store.ts`):
- Client-side state with localStorage persistence
- Separate keys for demo mode vs authenticated users
- Profile cache to reduce API calls
- Trip management with optimistic updates

**React Query** (`@tanstack/react-query`):
- Server state synchronization
- Automatic refetching and caching
- Used in `client/src/hooks/` for API calls

### Security Features

**CRITICAL: Trip Ownership Validation**

As of Jan 30, 2026, trip ownership validation was added to prevent users from modifying other users' trips:

- `PUT /api/profile/trips/:id` - Verifies trip belongs to user's profile before update
- `DELETE /api/profile/trips/:id` - Verifies trip belongs to user's profile before delete
- Returns 403 Forbidden for unauthorized access
- Validated by 53 security tests in test suite

**Implementation:**
```typescript
// In profileRoutes.ts
const trip = await storage.getTripById(tripId);
if (trip.profileId !== userProfile.id) {
  return res.status(403).json({ error: 'Forbidden: Trip belongs to another user' });
}
```

**Other Security:**
- Helmet.js for security headers
- Rate limiting (500 req/15min)
- XSS sanitization via `xss` library (applied in middleware)
- CORS configuration for production
- Input validation with Zod schemas

### Test Infrastructure

**Mock System** (`server/__tests__/setup/mocks.ts`):
- Centralized mock fixtures for profiles, trips, group members
- Helper functions: `createMockProfile()`, `createMockTrip()`, etc.
- Reusable authenticated request creators

**Global Mocks** (`jest.setup.js`):
- Database (Drizzle ORM)
- Stripe API
- OpenAI/ChatKit
- Replit Auth (openid-client, passport, express-session)
- All tests use mocked services - no real API calls

**Test Coverage Target:**
- Lines: 80%
- Statements: 80%
- Functions: 75%
- Branches: 70%

### AI Integration (ChatKit)

**OpenAI ChatKit** (`server/routes/chatKitRoutes.ts`):
- POST `/api/chatkit/session` - Creates AI chat session with user context
- GET `/api/chatkit/status` - Health check for AI configuration
- Requires: `OPENAI_API_KEY`, `OPENAI_CHATKIT_WORKFLOW_ID`
- Uses workflow-based conversations (not direct completions API)

### Payment Integration (Stripe)

**Routes** (`server/routes/paymentRoutes.ts`):
- POST `/api/create-checkout-session` - Creates Stripe checkout
- POST `/api/create-portal-session` - Customer portal access
- Webhook: POST `/api/webhook` - Handles subscription events

**Webhook Events** (`server/routes/webhookRoutes.ts`):
- `checkout.session.completed` - Attaches customer to user
- `customer.subscription.created/updated/deleted` - Updates subscription status
- Uses raw body parsing for signature verification

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Generate with `openssl rand -hex 32`
- `REPL_ID` - Replit OAuth client ID
- `ISSUER_URL` - Default: `https://replit.com/oidc`

**Optional but Recommended:**
- `STRIPE_SECRET_KEY` - For payment processing
- `STRIPE_WEBHOOK_SECRET` - For webhook verification
- `STRIPE_PRICE_ID_PRO` - Pro subscription price ID
- `OPENAI_API_KEY` - For ChatKit AI features
- `OPENAI_CHATKIT_WORKFLOW_ID` - ChatKit workflow identifier
- `FRONTEND_URL` - Production frontend URL for CORS
- `SENDGRID_API_KEY` - Email notifications
- `POSTHOG_API_KEY` - Analytics

## Important Patterns

### JSONB Fields in Database

Several fields use PostgreSQL JSONB for flexibility:
- `travel_profiles.contactInfo` - Contact details
- `travel_profiles.location` - Location preferences
- `travel_profiles.budgetPreferences` - Budget allocation
- `trips.timeframe` - Trip timing details
- `travel_group_members.schoolInfo` - School information for minors

**Always validate JSONB structure** in both Zod schemas and TypeScript interfaces.

### Shared Type System

Types are defined once in `shared/schema.ts` and used across:
- Database schema (Drizzle)
- API validation (Zod)
- Frontend types (imported from shared)
- Test mocks (typed fixtures)

Never duplicate type definitions - import from `@shared/schema` or `@shared/models/auth`.

### Middleware Order

Request processing order in `server/index.ts`:
1. Trust proxy
2. Helmet security headers
3. Rate limiting
4. CORS
5. Cookie parser
6. Health checks
7. Webhook raw body parsing
8. JSON body parsing (for non-webhook routes)
9. XSS sanitization
10. Route handlers

### Trip Management Pattern

Trips are managed through the profile context:
- GET `/api/profile/trips` - List all trips for user's profile
- POST `/api/profile/trips` - Create trip in user's profile
- PUT `/api/profile/trips/:id` - Update trip (with ownership check)
- DELETE `/api/profile/trips/:id` - Delete trip (with ownership check)

Never access trips directly by ID without verifying ownership against the authenticated user's profile.

## Common Gotchas

1. **Auth Middleware Confusion**: Use `isAuthenticated` from `replitAuth.ts` for route protection, `getUserId()` from `middleware/auth.ts` to extract the user ID from an already-authenticated request.

2. **Route Order Matters**: Webhooks MUST be registered before JSON body parser to preserve raw body for signature verification.

3. **Test User IDs**: Tests use `test-replit-user-id` as the default mock user. Update test expectations if you see user ID mismatches.

4. **JSONB Typing**: TypeScript won't catch JSONB structure errors at compile time. Always validate with Zod and test thoroughly.

5. **Session Store**: Sessions are stored in PostgreSQL, not in-memory. Ensure `sessions` table exists before starting the app.

6. **Trip Ownership**: Always fetch trip with `getTripById()` and verify `trip.profileId === userProfile.id` before modifications.

## File Structure Reference

```
server/
├── replit_integrations/auth/   # Replit Auth implementation
│   ├── replitAuth.ts           # Passport strategy & routes
│   ├── storage.ts              # User storage operations
│   ├── types.ts                # Type augmentations
│   └── index.ts                # Public exports
├── routes/                     # Feature route modules
│   ├── profileRoutes.ts        # Profile & trip management
│   ├── paymentRoutes.ts        # Stripe integration
│   ├── webhookRoutes.ts        # Stripe webhooks
│   └── chatKitRoutes.ts        # AI chat integration
├── middleware/                 # Custom middleware
│   ├── auth.ts                 # Auth helpers (getUserId)
│   └── sanitize.ts             # XSS protection
├── __tests__/                  # Test suites (144 tests)
│   ├── setup/mocks.ts          # Mock fixtures
│   ├── trip-management.test.ts # Security-critical tests
│   └── profile-workflow.test.ts
├── storage.ts                  # Unified storage interface
├── db.ts                       # Drizzle DB connection
└── routes.ts                   # Route registration

shared/
├── schema.ts                   # Drizzle schema + Zod types
└── models/auth.ts              # Auth user types

client/
├── src/
│   ├── pages/                  # React pages
│   ├── components/             # Reusable components
│   ├── hooks/                  # Custom React hooks
│   └── lib/
│       └── store.ts            # Zustand state management
```


## Instructions
1. Always run unit tests after completing your work to verify current and past
features are still working.
2. Always write new unit tests after prior tests have been completed.