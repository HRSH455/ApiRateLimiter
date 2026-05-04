# 🚦 API Rate Limiter

A full-stack rate limiting system built with Spring Boot and Angular. Implements three distinct rate limiting algorithms with a Redis-backed distributed state store, a live admin dashboard, and Docker Compose orchestration for the full stack.

> Built because most rate limiting tutorials stop at theory. This one runs.

## 🌐 Live Demo
| Layer | URL |
|-------|-----|
| Frontend Dashboard | https://api-rate-limiter-avdw.vercel.app |
| Backend API | https://apiratelimiter-id8y.onrender.com |

---

## 🧠 Rate Limiting Strategies

This is the core of the project. Three algorithms, each with different trade-offs:

### Fixed Window
Counts requests in fixed time buckets (e.g. 5 requests per 15 minutes). Simple and cheap to compute, but vulnerable to burst traffic at window boundaries — a client can fire requests at the end of one window and the start of the next, effectively doubling their quota.

### Sliding Window
Tracks request timestamps and counts only those within a rolling time range. Smoother than fixed window — no boundary bursts — but slightly more expensive in Redis due to sorted set operations.

### Token Bucket
Clients get a bucket of tokens that refills at a fixed rate. Each request consumes a token. Allows short bursts (up to bucket size) while enforcing a long-term average rate. Best for APIs where occasional spikes are acceptable.

All three are implemented as interchangeable strategies via a common interface — adding a new algorithm means implementing one class, nothing else changes.

---

## ✨ Features

- Three rate limiting algorithms: Fixed Window, Sliding Window, Token Bucket
- Per-route configuration — different limits and strategies per endpoint
- Redis-backed distributed state — works correctly across multiple backend instances
- Dynamic config updates — change limits at runtime without restarting
- Admin dashboard — monitor request counts, remaining quotas, and active routes
- Built-in request tester — fire test requests from the UI and watch limits apply
- Docker Compose — spins up Redis + backend + frontend in one command
- In-memory fallback — runs without Redis for local development

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3.2.4, Java 17 |
| Frontend | Angular 21, TypeScript |
| Cache | Redis 7 (distributed state) |
| Containerisation | Docker, Docker Compose |
| Testing | JUnit 5, Mockito |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🏗 Architecture

```
Request → Filter Layer → Strategy (Fixed / Sliding / Token)
                              ↓
                         Redis Store (or in-memory fallback)
                              ↓
                    Allow / Reject with headers
```

The filter intercepts every incoming request before it reaches the controller. It resolves the client key (IP, user ID, API key — configurable), looks up the matching route config, delegates to the appropriate strategy, and either passes the request through or returns a `429 Too Many Requests` with `Retry-After` headers.

---

## 🗂 Project Structure

```
ApiRateLimiter/
├── backend/
│   └── src/main/java/com/work/RateLimiter/
│       ├── config/       # Route and Redis config
│       ├── controller/   # REST endpoints
│       ├── filter/       # Request interception
│       ├── strategy/     # Fixed / Sliding / Token implementations
│       ├── store/        # Redis + in-memory storage layer
│       └── service/      # Business logic
│
├── frontend/
│   └── src/app/
│       ├── components/
│       │   ├── dashboard/        # Live metrics view
│       │   ├── config-editor/    # Runtime config updates
│       │   └── request-tester/   # Manual request firing
│       └── services/             # API communication
│
└── docker-compose.yml
```

---

## ▶️ Run Locally

### Option 1 — Docker Compose (recommended)
```bash
docker-compose up --build
# Redis → :6379 | Backend → :8080 | Frontend → :4200
```

### Option 2 — Manual

**Start Redis**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Start backend**
```bash
cd backend
./mvnw spring-boot:run
```

**Start frontend**
```bash
cd frontend
npm install && npm start
```

---

## ⚙️ Configuration

Routes are configured in `application.properties`:

```properties
rate-limit.routes[0].path=/api/auth/login
rate-limit.routes[0].limit=5
rate-limit.routes[0].window-secs=900
rate-limit.routes[0].strategy=fixed

rate-limit.routes[1].path=/api/search
rate-limit.routes[1].limit=30
rate-limit.routes[1].window-secs=60
rate-limit.routes[1].strategy=sliding
```

Strategies: `fixed` · `sliding` · `token`

---

## 🧪 Tests

```bash
# Backend
cd backend && ./mvnw test

# Frontend
cd frontend && npm test
```

---

## 🛠 Troubleshooting

| Issue | Fix |
|-------|-----|
| Redis connection refused | App falls back to in-memory automatically — check logs to confirm |
| Render backend slow on first request | Free tier cold start — takes ~30s to wake up |
| 429 on every request | Check route config limits in `application.properties` |
| Frontend can't reach backend | Verify API base URL in `frontend/src/app/services/` |