package com.work.RateLimiter.strategy;

import org.springframework.stereotype.Component;

// Sliding window rate limiting using Redis Sorted Sets.
// Each request is stored as a member scored by System.currentTimeMillis().
// On each check: prune entries older than windowSecs, then count remainder.
// Entire operation (ZREMRANGEBYSCORE + ZADD + ZCOUNT + EXPIRE) runs in one Lua script.
// More memory than fixed window (O(requests) vs O(1)) but no boundary burst.


public interface SlidingWindowStrategy implements RateLimitStrategy {

    // Lua script for atomic sliding window check.
    // KEYS[1] = sorted set key
    // ARGV[1] = now (epoch ms as string)
    // ARGV[2] = window start (now - windowMs)
    // ARGV[3] = unique request member ID
    // ARGV[4] = TTL in seconds
    // Returns count of requests in window BEFORE adding this one.
    private static final String SLIDING_WINDOW_LUA = """
}
