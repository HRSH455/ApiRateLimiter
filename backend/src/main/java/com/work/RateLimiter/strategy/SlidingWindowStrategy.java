package com.work.RateLimiter.strategy;

import com.work.RateLimiter.model.RateLimitResult;
import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.model.RateLimitStrategy;
import com.work.RateLimiter.store.RedisRateLimitStore;
import com.work.RateLimiter.util.RedisKeyBuilder;
import java.time.Instant;
import java.time.Duration;
import java.util.UUID;

// Sliding window rate limiting using Redis Sorted Sets.
// Each request is stored as a member scored by System.currentTimeMillis().
// On each check: prune entries older than windowSecs, then count remainder.
// Entire operation (ZREMRANGEBYSCORE + ZADD + ZCOUNT + EXPIRE) runs in one Lua script.
// More memory than fixed window (O(requests) vs O(1)) but no boundary burst.
public class SlidingWindowStrategy implements RateLimitStrategy {

    private final RedisRateLimitStore store;

    public SlidingWindowStrategy(RedisRateLimitStore store) {
        this.store = store;
    }

    // Lua script for atomic sliding window check.
    // KEYS[1] = sorted set key
    // ARGV[1] = now (epoch ms as string)
    // ARGV[2] = window start (now - windowMs)
    // ARGV[3] = unique request member ID
    // ARGV[4] = TTL in seconds
    // ARGV[5] = limit
    // Returns count of requests in window BEFORE adding this one.
    private static final String SLIDING_WINDOW_LUA = """
        redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[2])
        local count = redis.call('ZCOUNT', KEYS[1], ARGV[2], '+inf')
        if count < tonumber(ARGV[5]) then
            redis.call('ZADD', KEYS[1], ARGV[1], ARGV[3])
            redis.call('EXPIRE', KEYS[1], ARGV[4])
        end
        return count
        """;

    @Override
    public RateLimitResult evaluate(String key, RateLimitRule rule) {
        long nowMs = System.currentTimeMillis();
        long windowMs = rule.windowSecs() * 1000L;
        long windowStart = nowMs - windowMs;
        String windowKey = RedisKeyBuilder.buildKey(rule.keyPrefix(), "sliding", key);
        String member = UUID.randomUUID().toString();

        Long count = store.evalLua(SLIDING_WINDOW_LUA, Long.class, new String[]{windowKey}, 
            new String[]{String.valueOf(nowMs), String.valueOf(windowStart), member, String.valueOf(rule.windowSecs()), String.valueOf(rule.limit())});

        boolean allowed = count < rule.limit();
        int remaining = Math.max(0, rule.limit() - count.intValue() - (allowed ? 1 : 0));
        Instant resetAt = Instant.ofEpochMilli(nowMs + (rule.windowSecs() * 1000L - (nowMs % 1000))); // approx next window
        Duration retryAfter = allowed ? null : Duration.ofSeconds(rule.windowSecs());

        return new RateLimitResult(allowed, rule.limit(), remaining, resetAt, retryAfter);
    }
}
