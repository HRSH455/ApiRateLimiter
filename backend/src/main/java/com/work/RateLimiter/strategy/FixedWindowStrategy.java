package com.work.RateLimiter.strategy;


// Fixed window rate limiting strategy.
// Divides time into fixed buckets of windowSecs duration.
// Key includes bucket number so it auto-resets each window.
// Uses RedisRateLimitStore.incrementAndExpire() — atomic Lua INCR+EXPIRE.
// Known tradeoff: boundary burst — user can send 2x limit across window edge.


public interface FixedWindowStrategy implements RateLimitStrategy {

    
} 
