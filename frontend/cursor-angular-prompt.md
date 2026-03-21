# Cursor AI Prompt — Angular Rate Limiter Frontend

## Context
I have a Spring Boot backend (running on http://localhost:8080) for an API Rate Limiter.
Build me a production-grade Angular 21 frontend that connects to it.
Use standalone components, no NgModules.
Use Tailwind CSS for styling.
Do NOT use any UI component library — pure Tailwind only.

---

## Backend Endpoints to connect to

### Stats (Dashboard)
GET  http://localhost:8080/admin/rate-limit/stats
Returns: { totalRequests: number, blockedRequests: number, allowedRequests: number, activeKeys: number }

### Config (Rule Editor)
GET  http://localhost:8080/admin/rate-limit/config
Returns: RateLimitRule[]

POST http://localhost:8080/admin/rate-limit/config
Body: RateLimitRule[]

### Unlock IP
DELETE http://localhost:8080/admin/rate-limit/keys/{key}

### Health
GET  http://localhost:8080/actuator/health
Returns: { status: "UP" | "DOWN" }

### Demo Endpoints (Request Tester)
GET  http://localhost:8080/api/public
GET  http://localhost:8080/api/auth/login  (POST)
GET  http://localhost:8080/api/search?q=test
POST http://localhost:8080/api/upload

---

## TypeScript Models
Create these exactly in src/app/models/rate-limit.model.ts:

```typescript
export interface RateLimitRule {
  id: string;
  path: string;
  method: string;
  limit: number;
  windowSeconds: number;
  strategy: 'fixed' | 'sliding' | 'token';
  keyPrefix: string;
}

export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  activeKeys: number;
}

export interface RequestResult {
  status: number;
  body: any;
  headers: { [key: string]: string };
  timestamp: string;
  durationMs: number;
}
```

---

## Angular Service
Create src/app/services/rate-limit.service.ts:
- Inject HttpClient
- getStats() → Observable<RateLimitStats> — poll every 3 seconds using interval + switchMap
- getConfig() → Observable<RateLimitRule[]>
- updateConfig(rules: RateLimitRule[]) → Observable<void>
- clearKey(key: string) → Observable<void>
- getHealth() → Observable<{ status: string }>
- Do NOT subscribe inside the service — return Observables only

---

## File Structure to create

```
src/app/
├── models/
│   └── rate-limit.model.ts
├── services/
│   └── rate-limit.service.ts
├── components/
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.css
│   ├── config-editor/
│   │   ├── config-editor.component.ts
│   │   ├── config-editor.component.html
│   │   └── config-editor.component.css
│   └── request-tester/
│       ├── request-tester.component.ts
│       ├── request-tester.component.html
│       └── request-tester.component.css
└── app.component.ts / .html / .css
```

---

## UI Design Requirements

### Overall Theme
- Dark theme. Background: #0B0F1A. Surface cards: #141824. Borders: #2A3450.
- Accent color: #4ADE80 (green) for enabled/allowed states.
- Red #F87171 for blocked/errors. Yellow #FBBF24 for warnings.
- Font: Use Google Font "JetBrains Mono" for numbers/code, "Syne" for headings.
- Add this to index.html: <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">

### Layout
- Fixed left sidebar (220px wide) for navigation
- Main content area to the right
- Sidebar links: Dashboard, Config Editor, Request Tester
- Active link: green left border + green text + dark green background
- Subtle grid background pattern on the main area using CSS

### app.component.html structure
```html
<div class="shell">
  <aside> <!-- sidebar --> </aside>
  <main>
    <!-- show active component based on currentView -->
    <app-dashboard *ngIf="currentView === 'dashboard'" />
    <app-config-editor *ngIf="currentView === 'config'" />
    <app-request-tester *ngIf="currentView === 'tester'" />
  </main>
</div>
```

---

## Component 1 — Dashboard

### Purpose
Live stats that auto-refresh every 3 seconds showing rate limit activity.

### Stats Cards (top row, 4 cards)
Show these 4 stat cards in a grid:
1. Total Requests — blue accent — value from stats.totalRequests
2. Allowed — green accent — value from stats.allowedRequests
3. Blocked — red accent — value from stats.blockedRequests
4. Active Keys — yellow accent — value from stats.activeKeys

Each card:
- Dark surface background with colored top-left corner glow
- Large monospace number (font: JetBrains Mono, size large)
- Small uppercase label above the number
- Subtle subtext below (e.g. "currently live", "in this window")
- Animate the number change (CSS transition on opacity)

### Redis Health Indicator
- Small badge top-right: green dot + "REDIS CONNECTED" or red dot + "REDIS DOWN"
- Calls GET /actuator/health every 5 seconds

### Block Rate Bar
- Below the 4 cards
- Label: "Block Rate" with percentage calculated as (blocked/total * 100)
- Progress bar: red fill on dark background
- Show "0%" if no requests yet

### Recent Activity Log (bottom)
- A scrollable list showing the last 10 requests
- Each row: timestamp | method | path | status code (colored: green=200, red=429) | duration ms
- Generate this from the request tester calls — store last 10 in a local array
- If empty: show "No requests yet — use the Request Tester tab"

---

## Component 2 — Config Editor

### Purpose
View and edit rate limit rules that map to the backend RateLimitRule[] config.

### Rules Table
Display all rules in a table with columns:
- Path (monospace font)
- Method (badge: GET=blue, POST=yellow, DELETE=red)
- Limit (number)
- Window (e.g. "60s" or "15min")
- Strategy (badge: fixed=blue, sliding=green, token=yellow)
- Actions (Edit button, Delete button)

### Edit Modal
When Edit is clicked:
- Overlay modal appears (dark background with blur)
- Form fields for: path, method (select), limit (number input), windowSeconds (number), strategy (select: fixed/sliding/token), keyPrefix
- Cancel and Save buttons
- On Save: call POST /admin/rate-limit/config with updated rules array
- Show success toast: "Config updated ✓" in green

### Add New Rule Button
- Top right of the table
- Opens same modal with empty fields

### Delete Rule
- Calls DELETE /admin/rate-limit/keys/{keyPrefix}
- Confirm dialog before deleting
- Remove from local array on success

---

## Component 3 — Request Tester

### Purpose
Fire test HTTP requests at the demo endpoints and watch rate limiting headers live.

### Endpoint Selector
Radio buttons or tabs for:
- GET /api/public (200/min)
- POST /api/auth/login (5/15min)
- GET /api/search (30/min)
- POST /api/upload (10/hour)

### Controls
- "Send Request" button (green, prominent)
- "Fire 10x Rapid" button (yellow) — sends 10 requests with 100ms delay between each
- User ID input field (optional) — appended as ?userId= query param

### Response Panel (right side, split layout)
Show after each request:

STATUS badge — large, colored:
  - 200: green background "200 OK"
  - 429: red background "429 TOO MANY REQUESTS"

Rate Limit Headers panel (monospace):
  RateLimit-Limit:      100
  RateLimit-Remaining:  94
  RateLimit-Reset:      2026-03-15T18:30:00Z
  Retry-After:          (only shown on 429)

Response Body (collapsible JSON block, dark code style)

### History (bottom)
Last 10 requests listed as rows:
  [timestamp] [status badge] [path] [remaining/limit] [duration]
Color the row red if status === 429, green if 200.

---

## Rules to follow while building

1. Every component uses OnPush change detection:
   changeDetection: ChangeDetectionStrategy.OnPush

2. Always unsubscribe — use takeUntilDestroyed() from @angular/core/rxjs-interop

3. HttpClient errors must be caught:
   catchError(err => { this.error = err.message; return EMPTY; })

4. No inline styles — all styling via Tailwind classes + component CSS file

5. Animate number changes in stat cards using CSS:
   transition: all 0.3s ease

6. All forms use ReactiveFormsModule with FormBuilder, not template-driven

7. HTTP calls only happen in the service — never call HttpClient from a component directly

8. Loading states:
   - Show skeleton loaders (pulsing dark rectangles) while data loads
   - Show error state with red border + message if API call fails

9. Add CORS note at top of app.component.ts:
   // Backend must have @CrossOrigin(origins = "http://localhost:4200") on controllers

10. Responsive: sidebar collapses to top nav on screens < 768px

---

## CSS Variables to define in styles.css

```css
:root {
  --bg: #0B0F1A;
  --surface: #141824;
  --surface2: #1C2333;
  --border: #2A3450;
  --accent: #4ADE80;
  --accent-dim: rgba(74, 222, 128, 0.12);
  --red: #F87171;
  --red-dim: rgba(248, 113, 113, 0.12);
  --yellow: #FBBF24;
  --blue: #60A5FA;
  --text: #E2E8F0;
  --text2: #94A3B8;
  --text3: #475569;
}
```

---

## Environment file
Create src/environments/environment.ts:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

---

## What Cursor should NOT do
- Do not use Angular Material or PrimeNG
- Do not use NgModules — standalone components only
- Do not put HttpClient calls inside components
- Do not use any placeholder/lorem ipsum content
- Do not use purple gradients or generic color schemes
- Do not use Inter or Roboto fonts
- Do not hardcode http://localhost:8080 anywhere except environment.ts
