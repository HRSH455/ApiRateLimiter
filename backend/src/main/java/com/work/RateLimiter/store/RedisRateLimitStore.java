package com.work.RateLimiter.store;


// Redis abstraction layer for rate limiting operations.
// Strategies inject this — they never touch RedisTemplate directly.
// This allows swapping Redis for ConcurrentHashMap in tests.
// Uses StringRedisTemplate for all operations.
// incrementAndExpire() uses a Lua script for atomicity.
// evalLua() executes arbitrary Lua scripts for complex strategies.
public class RedisRateLimitStore {

    // Atomically increment key and set TTL only on first increment.
    // Uses Lua to prevent race between INCR and EXPIRE.
    // Returns the count AFTER incrementing.
    public long incrementAndExpire(String key, long ttlSeconds) {
    
}
