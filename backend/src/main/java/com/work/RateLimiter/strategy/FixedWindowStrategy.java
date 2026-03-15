package com.work.RateLimiter.strategy;

import com.work.RateLimiter.model.RateLimitResult;
import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.model.RateLimitStrategy;
import com.work.RateLimiter.store.RedisRateLimitStore;
import com.work.RateLimiter.util.RedisKeyBuilder;
import java.time.Instant;
import java.time.Duration;

// Fixed window rate limiting strategy.
// Divides time into fixed buckets of windowSecs duration.
// Key includes bucket number so it auto-resets each window.
// Uses RedisRateLimitStore.incrementAndExpire() — atomic Lua INCR+EXPIRE.
// Known tradeoff: boundary burst — user can send 2x limit across window edge.
public class FixedWindowStrategy implements RateLimitStrategy {

    private final RedisRateLimitStore store;

    public FixedWindowStrategy(RedisRateLimitStore store) {
        this.store = store;
    }

    @Override
    public RateLimitResult evaluate(String key, RateLimitRule rule) {
        long now = Instant.now().getEpochSecond();
        long windowStart = (now / rule.windowSecs()) * rule.windowSecs();
        String windowKey = RedisKeyBuilder.buildKey(rule.keyPrefix(), "fixed", key + ":" + windowStart);

        long count = store.incrementAndExpire(windowKey, rule.windowSecs());
        boolean allowed = count <= rule.limit();
        int remaining = allowed ? rule.limit() - (int) count : 0;
        Instant resetAt = Instant.ofEpochSecond(windowStart + rule.windowSecs());
        Duration retryAfter = allowed ? null : Duration.ofSeconds(rule.windowSecs() - (now % rule.windowSecs()));

        return new RateLimitResult(allowed, rule.limit(), remaining, resetAt, retryAfter);
    }
}
