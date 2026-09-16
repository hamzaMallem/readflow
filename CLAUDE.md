# ReadFlow — Project Master Document

## Overview

ReadFlow is a mobile-first Progressive Web App (PWA) for reading long translated transcripts from podcasts and videos. It provides a clean, distraction-free reading experience with automatic progress tracking, local document storage, and full-text search — all offline, no backend required for MVP.

---

## Goals

- Solve reading-position loss in long translated texts
- Provide a Medium-quality reading experience on mobile
- Store and organize documents locally with zero friction
- Work fully offline after first load

---

## Architecture

### Pattern: Storage Adapter

All data access is abstracted behind `IStorageAdapter`. The MVP uses `LocalAdapter` (Dexie/IndexedDB). Future cloud sync requires only a new adapter implementation — no feature refactoring.

```
UI Components
     ↓
Feature Hooks (useDocuments, useReader, useSearch, useSettings)
     ↓
Service Layer (DocumentService, ReaderService, SearchService)
     ↓
IStorageAdapter (abstract interface)
     ↓
LocalAdapter (Dexie/IndexedDB) ← MVP only
CloudAdapter (future)
```

### State Management

React Context + useReducer for MVP. No Redux or Zustand. If cloud sync is added, migrate to Zustand with persistence middleware.

### Settings Persistence

AppSettings stored in `localStorage` (not IndexedDB). Simple key-value, no migration needed.

---

## Tech Stack

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Framework | React | 18 | Ecosystem, PWA support |
| Build | Vite | 5 | Speed, plugin ecosystem |
| Language | TypeScript | 5 | Type safety for data models |
| Styling | Tailwind CSS | 3 | Mobile-first, no runtime cost |
| Typography | @tailwindcss/typography | 0.5 | Reading-quality prose styles |
| Storage | Dexie.js | 3 | Best IndexedDB API, reactive |
| Search | MiniSearch | 6 | Offline full-text, BM25, ~7KB |
| PWA | vite-plugin-pwa + Workbox | latest | Auto SW + manifest generation |
| Routing | React Router | 6 | Standard SPA routing |
| IDs | uuid | 9 | RFC-compliant UUID v4 |

---

## Data Models

### Document (IndexedDB via Dexie)

```typescript
interface Document {
  id: string;                     // UUID v4
  title: string;
  content: string;                // Raw pasted text
  paragraphs: string[];           // Split on \n\n — stable unit for position
  tags: string[];                 // Free-form strings
  wordCount: number;
  estimatedReadMinutes: number;   // Math.ceil(wordCount / 200)
  createdAt: number;              // Unix ms timestamp
  updatedAt: number;
  lastReadAt: number | null;
  readingPosition: {
    paragraphIndex: number;
  } | null;
}
```

### AppSettings (localStorage)

```typescript
interface AppSettings {
  fontSize: number;               // 14–24px, default 18
  lineHeight: number;             // 1.4–2.2, default 1.8
  fontFamily: 'serif' | 'sans';  // default 'serif'
  theme: 'light' | 'dark' | 'system';
  focusModeEnabled: boolean;      // default false
  focusDimOpacity: number;        // 0.1–0.5, default 0.3
}
```

---

## Folder Structure

```
src/
├── components/
│   ├── reader/           # ReaderView, ParagraphBlock, FocusOverlay, ProgressBar
│   ├── library/          # DocumentList, DocumentCard, SearchBar, TagFilter
│   ├── editor/           # NewDocumentForm, PasteArea
│   └── ui/               # Button, Modal, BottomSheet, IconButton (shared)
├── features/
│   ├── documents/        # useDocuments.ts, documentService.ts
│   ├── reader/           # useReader.ts, readerService.ts
│   ├── search/           # useSearch.ts, searchService.ts
│   └── settings/         # useSettings.ts
├── storage/
│   ├── interface.ts      # IStorageAdapter contract
│   ├── localAdapter.ts   # Dexie/IndexedDB implementation
│   └── db.ts             # Dexie schema + version migrations
├── lib/
│   ├── search.ts         # MiniSearch instance + indexing
│   └── paragraphs.ts     # Text splitting utility
├── types/
│   └── index.ts          # Global TypeScript types
├── App.tsx
└── main.tsx
```

---

## Routes

| Path | Page | Purpose |
|---|---|---|
| `/` | Library | Document list, search, tag filter |
| `/new` | New Document | Title + tags + paste area |
| `/read/:id` | Reader | Full reading UI |
| `/settings` | Settings | Font, theme, spacing controls |

---

## Key Implementation Details

### Paragraph Splitting
- Split raw content on `\n\n` (double newline)
- Filter empty strings
- Each paragraph rendered as `<p data-paragraph-index={n}>`
- Paragraph array is the stable unit for all position tracking

### Focus Mode
- `IntersectionObserver` on all paragraph elements
- Paragraph closest to viewport center → `.focused` class
- All others → `.dimmed` class (opacity: var(--dim-opacity))
- CSS transition for smooth opacity change

### Progress Tracking
- Scroll event debounced at 300ms
- On stop: find paragraph with highest visibility ratio
- Save `paragraphIndex` to IndexedDB document record
- On document open: `element.scrollIntoView({ behavior: 'instant', block: 'start' })`

### Full-Text Search
- MiniSearch index initialized on app start
- Fields indexed: `title`, `tags`, `content`
- Re-index triggered on: document create, update, delete
- Search is synchronous, in-memory, fully offline

### PWA / Offline Strategy
- Workbox cache-first for all static assets (JS, CSS, fonts)
- IndexedDB data is inherently offline-available
- Service worker registered via vite-plugin-pwa
- App manifest: display standalone, portrait orientation

---

## Security Constraints

- No external API calls in MVP
- No user authentication in MVP
- All data stays on device
- No analytics, no tracking, no telemetry
- Content Security Policy headers to be set at deployment

---

## Engineering Directives (Non-Negotiable)

1. **Mobile-first strictly** — All Tailwind classes written for mobile viewport first. `md:` / `lg:` prefixes for larger screens only. Touch targets minimum 44px. No hover-only interactions.
2. **No over-abstraction** — Components stay simple. No HOCs, no render props. Use hooks. Components should not exceed ~150 lines.
3. **Reader performance** — Use CSS `content-visibility: auto` on paragraph blocks for near-virtualization without library overhead. Debounce scroll at 300ms. No paragraph state in React state.
4. **Lazy-loaded routes** — All route-level components wrapped in `React.lazy()` + `Suspense`.
5. **Minimal UI** — Readability over decoration. No gratuitous animations. Clean whitespace. Typography-first.

---

## Development Workflow

```bash
npm install          # Install dependencies
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build locally
```

---

## Testing Strategy

- Unit tests: utility functions (paragraph splitting, word count, search indexing)
- Component tests: React Testing Library for core UI components
- E2E: Playwright for critical user flows (create doc → read → resume position)
- PWA: Manual testing on real mobile devices (iOS Safari, Android Chrome)

---

## Deployment

- Target: Vercel or Netlify (static SPA)
- Build output: `dist/`
- No server-side rendering required
- HTTPS required for PWA / Service Worker

---

## MVP Scope (Phase 1)

- [ ] Paste and save text documents
- [ ] Library view with document list
- [ ] Reader view with clean typography
- [ ] Font size, line height, dark mode settings
- [ ] Focus mode (auto-highlight viewport-center paragraph)
- [ ] Progress tracking by paragraph index
- [ ] Resume reading from last position
- [ ] Tags on documents
- [ ] Full-text search (title + tags + content)
- [ ] PWA manifest + service worker (offline)

## Out of Scope for MVP

- File upload (PDF, DOCX)
- AI summary / key points extraction
- Cloud sync
- Multi-user / authentication
- Export functionality
- Annotations / highlights
