# MySuperApp - Project Plan

## Vision
A personal "super app" — a modular web application that serves as a container for custom-built mini apps. Think of it as your personal phone home screen, but for web, with apps tailored specifically for your needs.

## Goals
1. **Web-first** with PWA support for mobile-like experience
2. **Modular architecture** — easy to add/remove mini apps
3. **Self-hostable** with free-tier cloud deployment options
4. **Future-proof** — designed to eventually support multiple users

---

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | Best free hosting, great PWA support, unified frontend/backend |
| **Language** | TypeScript | Type safety, excellent tooling, AI-friendly |
| **UI** | Tailwind CSS + shadcn/ui | Modern, customizable, great components |
| **Database** | SQLite + Drizzle ORM | Local-first, simple, free |
| **Auth** | Auth.js v5 (NextAuth) | Federated auth (Google, Microsoft, Apple) |
| **PWA** | Serwist (@serwist/next) | Modern service worker, offline support |
| **Monorepo** | pnpm + Turborepo | Fast builds, shared packages |
| **Stock API** | Finnhub (primary) | 60 req/min free tier, real-time quotes |

---

## Project Structure

```
MySuperApp/
├── apps/
│   └── web/                    # Next.js app (shell)
│       ├── app/                # App router
│       │   ├── (auth)/         # Auth pages (sign-in, etc.)
│       │   ├── (shell)/        # Main app layout
│       │   │   ├── page.tsx    # Home / App Launcher
│       │   │   └── [miniapp]/  # Dynamic mini app routes
│       │   ├── api/            # API routes
│       │   └── layout.tsx      # Root layout
│       ├── components/         # App-specific components
│       └── lib/                # App-specific utilities
│
├── packages/
│   ├── core/                   # Mini app runtime & contracts
│   │   ├── src/
│   │   │   ├── types.ts        # MiniApp interface
│   │   │   ├── registry.ts     # Mini app registry
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                     # Shared UI components (shadcn/ui)
│   │   ├── src/
│   │   │   └── components/
│   │   └── package.json
│   │
│   ├── database/               # Drizzle schema & migrations
│   │   ├── src/
│   │   │   ├── schema/         # Table definitions
│   │   │   ├── migrations/     # SQL migrations
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                 # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── miniapps/
│   ├── stocks/                 # Stock Watchlist mini app
│   │   ├── src/
│   │   │   ├── components/     # Stock-specific UI
│   │   │   ├── api/            # Stock API integration
│   │   │   ├── schema.ts       # Database tables
│   │   │   └── index.ts        # MiniApp registration
│   │   └── package.json
│   │
│   ├── budget/                 # Budget Tracker (future)
│   └── assistant/              # AI Assistant (future)
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace config
├── turbo.json                  # Turborepo config
└── .env.example                # Environment variables template
```

---

## Mini App Contract

Each mini app must implement this interface:

```typescript
interface MiniApp {
  // Identity
  id: string;                    // Unique identifier (e.g., "stocks")
  name: string;                  // Display name (e.g., "Stock Watchlist")
  description: string;           // Short description
  icon: string;                  // Icon name or emoji
  version: string;               // Semantic version
  
  // Routes
  basePath: string;              // URL base path (e.g., "/stocks")
  routes: MiniAppRoute[];        // Route definitions
  
  // Lifecycle
  onInstall?(): Promise<void>;   // Called when mini app is installed
  onUninstall?(): Promise<void>; // Called when mini app is removed
  
  // Database
  schema?: DrizzleSchema;        // Drizzle table definitions
  
  // Permissions
  permissions: Permission[];     // Required permissions
  
  // Settings
  settings?: SettingsSchema;     // User-configurable settings
}

type Permission = 
  | "notifications"              // Browser notifications
  | "storage"                    // Local storage access
  | "network"                    // External API calls
  | "calendar"                   // Calendar integration
  | "email";                     // Email integration

interface MiniAppRoute {
  path: string;                  // Route path relative to basePath
  component: React.ComponentType;// React component
  title: string;                 // Page title
  showInNav?: boolean;           // Show in mini app navigation
}
```

---

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Document project plan
- [ ] Scaffold monorepo (pnpm + Turborepo)
- [ ] Set up Next.js web app
- [ ] Create shared packages (core, ui, database, config)
- [ ] Configure TypeScript, ESLint, Tailwind
- [ ] Set up SQLite + Drizzle

### Phase 2: Authentication
- [ ] Install and configure Auth.js v5
- [ ] Set up Google OAuth provider
- [ ] Set up Microsoft Entra ID provider
- [ ] Create sign-in/sign-out pages
- [ ] Protect routes with middleware

### Phase 3: App Shell
- [ ] Create responsive app launcher home screen
- [ ] Implement mini app registry
- [ ] Create dynamic routing for mini apps
- [ ] Add global navigation
- [ ] Implement settings page

### Phase 4: Stock Watchlist Mini App
- [ ] Define database schema (watchlist, stocks)
- [ ] Integrate Finnhub API
- [ ] Create stock search functionality
- [ ] Build watchlist dashboard
- [ ] Add stock detail view
- [ ] Implement daily summary/news

### Phase 5: PWA & Notifications
- [ ] Configure Serwist service worker
- [ ] Add web app manifest
- [ ] Implement offline fallback
- [ ] Set up browser push notifications

### Phase 6: Future Mini Apps
- [ ] Budget Tracker mini app
- [ ] AI Assistant mini app (email/calendar integration)

---

## Environment Variables

```env
# Database
DATABASE_URL="file:./local.db"

# Auth.js
AUTH_SECRET="<generate-with-npx-auth-secret>"
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Microsoft OAuth
AUTH_MICROSOFT_ENTRA_ID_ID=""
AUTH_MICROSOFT_ENTRA_ID_SECRET=""
AUTH_MICROSOFT_ENTRA_ID_ISSUER=""

# Finnhub API
FINNHUB_API_KEY=""
```

---

## Hosting Options (Free Tier)

| Service | Use Case | Free Tier |
|---------|----------|-----------|
| **Vercel** | Frontend + API | Generous |
| **Turso** | SQLite (cloud) | 500 DBs, 9GB |
| **Azure Static Web Apps** | Alternative hosting | Free tier available |

---

## Design Decisions

### 1. Database Strategy
- **Single SQLite database** with table prefixes per mini app
- Example: `stocks_watchlist`, `stocks_quotes`, `budget_transactions`
- Shared tables: `users`, `sessions`, `accounts` (Auth.js)

### 2. Mini App Isolation
- Mini apps are **separate packages** in `miniapps/` directory
- Each mini app exports its registration, components, and schema
- The shell dynamically imports and routes to mini apps

### 3. Styling Approach
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components in `packages/ui` for consistency
- Mini apps can extend but not override base theme

### 4. API Strategy
- Next.js API routes for backend logic
- Each mini app can define its own API routes under `/api/[miniapp]/*`
- Shared services (auth, db) available to all mini apps

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Auth.js v5 Documentation](https://authjs.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [shadcn/ui](https://ui.shadcn.com)
- [Turborepo](https://turbo.build/repo)
- [Serwist PWA](https://serwist.pages.dev)
- [Finnhub API](https://finnhub.io/docs/api)
