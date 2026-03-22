# API Rate Limiter

A comprehensive rate limiting solution with a Spring Boot backend and Angular frontend. This project provides multiple rate limiting strategies to control API access and prevent abuse.

## Project Overview

The API Rate Limiter is a full-stack application that implements various rate limiting strategies to protect APIs from excessive requests. It includes:

- **Multiple Rate Limiting Strategies**: Fixed window, sliding window, and token bucket algorithms
- **Dynamic Configuration**: Update rate limiting rules without restarting the service
- **Redis Backend**: Distributed caching for rate limit state management
- **Admin Dashboard**: Web-based interface to manage and monitor rate limits
- **Request Testing**: Built-in tools to test rate limiting behavior

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Cache**: Redis
- **Build Tool**: Maven
- **Testing**: JUnit 5, Mockito

### Frontend
- **Framework**: Angular 17+
- **Language**: TypeScript
- **Build Tool**: npm/Angular CLI
- **UI Components**: HTML5, CSS3

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Cache Server**: Redis 7-alpine

## Project Structure

```
ApiRateLimiter/
├── backend/                    # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/work/RateLimiter/
│   │   │   │       ├── config/         # Configuration classes
│   │   │   │       ├── controller/     # REST endpoints
│   │   │   │       ├── exception/      # Custom exceptions
│   │   │   │       ├── filter/         # Request filters
│   │   │   │       ├── model/          # Data models
│   │   │   │       ├── resolver/       # Custom resolvers
│   │   │   │       ├── service/        # Business logic
│   │   │   │       ├── store/          # Storage layer
│   │   │   │       ├── strategy/       # Rate limiting strategies
│   │   │   │       └── util/           # Utility classes
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                       # Unit tests
│   ├── pom.xml                         # Maven configuration
│   ├── Dockerfile
│   └── mvnw / mvnw.cmd                 # Maven wrapper
│
├── frontend/                   # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/             # Reusable components
│   │   │   │   ├── dashboard/
│   │   │   │   ├── config-editor/
│   │   │   │   └── request-tester/
│   │   │   ├── models/                 # TypeScript interfaces
│   │   │   ├── services/               # API services
│   │   │   └── app.routes.ts           # Route definitions
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json                    # Angular CLI config
│   ├── package.json                    # Dependencies
│   ├── tsconfig.json                   # TypeScript config
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── docker-compose.yml          # Multi-container orchestration
└── config-update.json          # Config example
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- Docker and Docker Compose (optional, for containerized deployment)
- Redis (optional, for distributed rate limiting)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ApiRateLimiter
   ```

2. **Backend Setup**
   ```bash
   cd backend
   ./mvnw clean install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Option 1: Local Development

1. **Start Redis** (optional but recommended)
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Start the Backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   Backend will be available at `http://localhost:8080`

3. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm start
   ```
   Frontend will be available at `http://localhost:4200`

#### Option 2: Docker Compose

```bash
docker-compose up --build
```

This will start:
- Redis on `localhost:6379`
- Backend on `http://localhost:8080`
- Frontend on `http://localhost:4200`

## Configuration

### Rate Limiting Routes

Configure rate limiting rules in `backend/src/main/resources/application.properties`:

```properties
# Define rate limit routes
rate-limit.routes[0].path=/api/auth/login
rate-limit.routes[0].limit=5
rate-limit.routes[0].window-secs=900
rate-limit.routes[0].strategy=fixed
rate-limit.routes[0].key-prefix=auth

rate-limit.routes[1].path=/api/search
rate-limit.routes[1].limit=30
rate-limit.routes[1].window-secs=60
rate-limit.routes[1].strategy=sliding
rate-limit.routes[1].key-prefix=search
```

### Supported Strategies

- **fixed**: Fixed window - resets counter at fixed intervals
- **sliding**: Sliding window - smooth rate limiting over time
- **token**: Token bucket - allows burst traffic up to limit

## API Endpoints

### Rate Limiting

- `GET /api/rate-limit/status` - Get current rate limit status
- `POST /api/rate-limit/reset` - Reset rate limit counters
- `GET /api/rate-limit/routes` - List configured routes

### Admin

- `GET /api/admin/config` - Get current configuration
- `POST /api/admin/config` - Update configuration
- `GET /api/admin/metrics` - View rate limiting metrics

### Health

- `GET /actuator/health` - Health check endpoint

## Development

### Running Tests

**Backend**
```bash
cd backend
./mvnw test
```

**Frontend**
```bash
cd frontend
npm test
```

### Building for Production

**Backend**
```bash
cd backend
./mvnw clean package
```

**Frontend**
```bash
cd frontend
npm run build
```

## Features

- ✅ Multiple rate limiting algorithms
- ✅ Dynamic configuration updates
- ✅ Redis-based distributed caching
- ✅ Admin dashboard for monitoring
- ✅ Request testing tool
- ✅ Comprehensive error handling
- ✅ Docker support
- ✅ Unit test coverage

## Architecture

The application follows a layered architecture:

1. **Controller Layer**: Handles HTTP requests
2. **Service Layer**: Implements business logic
3. **Strategy Layer**: Rate limiting algorithms
4. **Store Layer**: Data persistence (Redis)
5. **Filter Layer**: Request interception and validation

## Troubleshooting

### Backend won't start
- Ensure Java 17+ is installed: `java -version`
- Check if port 8080 is available
- Review logs in console output

### Frontend won't load
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `npm install`
- Ensure port 4200 is available

### Redis connection issues
- Verify Redis is running on localhost:6379
- Check redis configuration in `application.properties`
- Application can run without Redis (uses in-memory fallback)


## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement rate limit quota analytics
- [ ] Support for webhook notifications
- [ ] Integration with API gateway
- [ ] Cloud deployment templates
