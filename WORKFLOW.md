# Project Workflow

This document outlines the development workflow, architecture patterns, and operational procedures for the API Rate Limiter project.

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Architecture Overview](#architecture-overview)
3. [Rate Limiting Flow](#rate-limiting-flow)
4. [Configuration Management](#configuration-management)
5. [Deployment Workflow](#deployment-workflow)
6. [Testing Strategy](#testing-strategy)
7. [Troubleshooting Guide](#troubleshooting-guide)

## Development Workflow

### Local Setup Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Clone Repository                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 2. Backend Setup                                            │
│    - cd backend                                            │
│    - ./mvnw clean install                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 3. Frontend Setup                                           │
│    - cd ../frontend                                        │
│    - npm install                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 4. Start Redis (Optional)                                   │
│    docker run -d -p 6379:6379 redis:7-alpine              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 5. Run Services                                             │
│    - Backend: ./mvnw spring-boot:run                       │
│    - Frontend: npm start                                   │
│    - Access: http://localhost:4200                         │
└─────────────────────────────────────────────────────────────┘
```

### Daily Development Cycle

1. **Start Services**
   - Backend runs on `http://localhost:8080`
   - Frontend runs on `http://localhost:4200`
   - Both support hot-reload on file changes

2. **Development**
   - Make changes in your editor
   - Services auto-reload
   - Open browser DevTools for frontend debugging
   - Use IDE debugging for backend (if needed)

3. **Testing**
   - Run backend tests: `./mvnw test`
   - Run frontend tests: `npm test`
   - Use request tester component for API testing

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "Feature: description"
   git push origin feature-branch
   ```

### Code Organization

#### Backend (Java)

```
src/main/java/com/work/RateLimiter/
├── config/
│   └── FilterConfig.java          # Filter chain configuration
├── controller/
│   ├── RateLimitAdminController.java
│   └── RateLimitTestController.java
├── exception/
│   └── RateLimitedException.java   # Custom exceptions
├── filter/
│   └── RateLimitFilter.java        # Request interception
├── model/
│   ├── RateLimitRequest.java
│   ├── RateLimitResponse.java
│   └── Configuration models
├── resolver/
│   └── KeyResolver.java             # Determines rate limit key
├── service/
│   └── RateLimitService.java        # Core business logic
├── store/
│   └── RedisRateLimitStore.java    # Data persistence
├── strategy/
│   ├── RateLimitStrategy.java       # Strategy interface
│   ├── FixedWindowStrategy.java
│   ├── SlidingWindowStrategy.java
│   └── TokenBucketStrategy.java
└── util/
    └── Utility classes
```

#### Frontend (Angular)

```
src/app/
├── components/
│   ├── dashboard/                   # Main dashboard view
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.css
│   ├── config-editor/               # Configuration editor
│   │   ├── config-editor.component.ts
│   │   ├── config-editor.component.html
│   │   └── config-editor.component.css
│   └── request-tester/              # Request testing tool
│       ├── request-tester.component.ts
│       ├── request-tester.component.html
│       └── request-tester.component.css
├── models/
│   └── rate-limit.model.ts          # TypeScript interfaces
├── services/
│   └── rate-limit.service.ts        # API communication
├── app.routes.ts                    # Route definitions
├── app.component.ts                 # Root component
└── app.config.ts                    # Angular configuration
```

## Architecture Overview

### System Components

```
┌────────────────────────────────────────────────────────────────┐
│                     Browser (Angular Frontend)                  │
├────────────────────┬─────────────────────────┬─────────────────┤
│   Dashboard        │   Config Editor         │  Request Tester  │
└────────────────────┴────────────┬────────────┴───────────────────┘
                                  │ HTTP/REST
         ┌────────────────────────▼────────────────────────┐
         │         Spring Boot Backend (Port 8080)         │
         ├─────────────────────────────────────────────────┤
         │  Controllers                                    │
         │  ├─ RateLimitAdminController                   │
         │  └─ RateLimitTestController                    │
         │                                                 │
         │  Filters                                        │
         │  └─ RateLimitFilter → Intercepts requests      │
         │                                                 │
         │  Services                                       │
         │  └─ RateLimitService → Applies strategies      │
         │                                                 │
         │  Strategies                                     │
         │  ├─ FixedWindowStrategy                        │
         │  ├─ SlidingWindowStrategy                      │
         │  └─ TokenBucketStrategy                        │
         │                                                 │
         │  Store                                          │
         │  └─ RedisRateLimitStore                        │
         └─────────────────┬──────────────────────────────┘
                          │ TCP:6379
         ┌────────────────▼──────────────────┐
         │      Redis Cache (Port 6379)      │
         │ Stores rate limit counters/state  │
         └───────────────────────────────────┘
```

### Data Flow

```
HTTP Request
    │
    ▼
RateLimitFilter
    │
    ├─ Extract: Endpoint, Client ID, Headers
    │
    ▼
RateLimitService
    │
    ├─ Lookup route configuration
    │ 
    ├─ Select strategy (Fixed/Sliding/Token)
    │
    ├─ Get current state from RedisRateLimitStore
    │
    ▼
Strategy Implementation
    │
    ├─ Check if request within limit
    │
    ├─ Update counter/state
    │
    ├─ Store back to Redis
    │
    ▼
Decision
    │
    ├─ Allow (200) → Forward request
    │
    └─ Reject (429) → Return RateLimitedException
```

## Rate Limiting Flow

### Detailed Request Processing

1. **Request Arrives**
   - HTTP request hits Spring Boot server
   - RateLimitFilter intercepts the request

2. **Route Matching**
   - Filter checks if path matches configured routes
   - If no match, request passes through
   - If match found, continue to rate limit check

3. **Strategy Selection**
   - RateLimitService identifies the strategy for the route
   - Strategy enum: `FIXED`, `SLIDING`, `TOKEN`

4. **State Retrieval**
   - Redis key: `{prefix}:{clientId}:{window}`
   - Retrieve current counter/state
   - Updates are atomic operations

5. **Limit Evaluation**
   ```
   Fixed Window:
   - Check if current window still active
   - If expired, reset counter
   - If counter >= limit, reject
   - Otherwise, increment and allow

   Sliding Window:
   - Check requests in last N seconds
   - Remove timestamps older than window
   - If count >= limit, reject
   - Otherwise, add timestamp and allow

   Token Bucket:
   - Check bucket state (tokens, last_refill)
   - Refill tokens based on elapsed time
   - If tokens > 0, consume 1 token and allow
   - Otherwise, reject
   ```

6. **Response**
   - Allowed: Forward request, add rate limit headers
   - Rejected: Return 429 Too Many Requests

### Rate Limit Headers

Response includes:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1711188125
```

## Configuration Management

### Configuration Flow

```
Application Start
    │
    ▼
Load application.properties
    │
    ├─ Parse rate-limit.routes[]
    ├─ Load strategy settings
    ├─ Connect to Redis
    │
    ▼
Initialize RateLimitService
    │
    ├─ Populate route cache
    ├─ Prepare strategies
    │
    ▼
Application Ready
    │
    ├─ Accept HTTP requests
    ├─ Monitor config changes (optional)
    │
    ▼
Admin Updates Config (/api/admin/config)
    │
    ▼
Configuration Persistence & Reload
    │
    └─ Apply changes immediately
```

### Hot Reload Configuration

To test configuration changes without restart:

1. Access Admin Dashboard: `http://localhost:4200`
2. Navigate to "Config Editor"
3. Modify rate limit settings
4. Click "Save Configuration"
5. Changes apply immediately to new requests

## Deployment Workflow

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:4200
# - Backend: http://localhost:8080
# - Redis: localhost:6379
```

### Production Considerations

1. **Environment Variables**
   ```properties
   REDIS_HOST=redis.production.com
   REDIS_PORT=6379
   JAVA_OPTS=-Xmx1g
   ENVIRONMENT=production
   ```

2. **Scaling**
   - Scale backend instances: Multiple containers behind load balancer
   - Use Redis Cluster for distributed caching
   - Frontend: Serve static files via CDN

3. **Monitoring**
   - Health endpoint: `/actuator/health`
   - Metrics endpoint: `/actuator/metrics`
   - Log aggregation: ELK stack or CloudWatch
   - Alert on high 429 rates

4. **Security**
   - Use HTTPS/TLS for all traffic
   - Set environment variables for sensitive config
   - Implement authentication for admin endpoints
   - Rate limit the rate limit API itself

## Testing Strategy

### Backend Testing

```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=RateLimitServiceTest

# Run with coverage
./mvnw test jacoco:report
```

**Test Coverage Areas:**
- Strategy implementations (Fixed, Sliding, Token)
- Service business logic
- Controller endpoints
- Exception handling
- Redis store operations

### Frontend Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --code-coverage

# Run e2e tests (if configured)
npm run e2e
```

**Test Coverage Areas:**
- Component logic and rendering
- Service API calls
- User interactions
- Form validation

### Integration Testing

1. Use Request Tester component to verify end-to-end flow
2. Test rate limit enforcement across strategies
3. Verify configuration hot-reload
4. Test Redis persistence

## Troubleshooting Guide

### Backend Issues

#### Port 8080 Already in Use
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process
taskkill /PID <PID> /F
```

#### Redis Connection Failed
- Check if Redis is running: `netstat -ano | findstr :6379`
- Backend has fallback to in-memory store
- To use Redis: Start `docker run -d -p 6379:6379 redis:7-alpine`

#### Compilation Errors
```bash
cd backend
./mvnw clean compile
```

### Frontend Issues

#### Dependencies Not Installed
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Port 4200 Already in Use
```bash
# Change port
ng serve --port 4201
```

#### Build Errors
```bash
npm run build -- --configuration development
```

### Common Issues

| Issue | Solution |
|-------|----------|
| High memory usage | Increase JVM heap: `JAVA_OPTS=-Xmx2g` |
| Slow API responses | Check Redis connectivity, monitor CPU/memory |
| 429 errors on valid requests | Verify rate limit configuration, check client ID resolver |
| Frontend can't reach backend | Check CORS headers, verify backend port 8080 is open |


## Continuous Integration/Deployment (CI/CD)

### Recommended CI/CD Pipeline

```
Push to Repository
    │
    ▼
Build Backend
    ├─ ./mvnw clean test
    ├─ ./mvnw package
    │
Build Frontend
    ├─ npm install
    ├─ npm test
    ├─ npm run build
    │
Docker Build
    ├─ Build backend image
    ├─ Build frontend image
    │
Push to Registry
    │
Deploy to Staging
    │
Smoke Tests
    │
Deploy to Production (on manual approval)
```
