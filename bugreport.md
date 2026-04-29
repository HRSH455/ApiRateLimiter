# Bug Report

## Summary
Several fixes were applied across backend and frontend to resolve rate limit key handling, CORS duplication, admin API integration, and UI behavior.

## Affected Files
- backend/src/main/java/com/work/RateLimiter/config/RateLimitConfig.java
- backend/src/main/java/com/work/RateLimiter/filter/RateLimitFilter.java
- backend/src/main/java/com/work/RateLimiter/controller/DemoApiController.java
- frontend/src/app/services/auth.service.ts
- frontend/src/app/components/request-tester/request-tester.component.ts
- frontend/src/app/components/request-tester/request-tester.component.html
- frontend/src/app/components/config-editor/config-editor.component.ts
- frontend/src/environments/environment.ts

## Fixes
- Rate limit rules map made thread-safe with `ConcurrentHashMap`.
- Redis keys now use `RedisKeyBuilder` and follow `rl:{keyPrefix}:{strategy}:{identity}` format.
- Duplicate `@CrossOrigin` removed from `DemoApiController`.
- `AuthService` now uses `environment.apiUrl`.
- Unused `admin.service.ts` removed.
- Request tester custom endpoint now supports GET/POST/PUT/DELETE.
- Config editor toggle column removed and environment badge logic simplified.
- Block-rate bar hidden when no requests exist.
- Added credential warning comment in `environment.ts`.

## Notes
This Reports only Batch fixes , previous updates where commit/feature wise.
