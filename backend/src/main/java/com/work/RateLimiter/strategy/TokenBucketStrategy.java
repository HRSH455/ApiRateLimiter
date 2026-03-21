package com.work.RateLimiter.strategy;

import com.work.RateLimiter.model.RateLimitResult;
import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.model.RateLimitStrategy;
import com.work.RateLimiter.store.RedisRateLimitStore;
import com.work.RateLimiter.util.RedisKeyBuilder;
import java.time.Instant;
import java.time.Duration;

// Token bucket rate limiting strategy.
// Tokens refill at a constant rate, burst up to capacity.
// Uses Redis Hash: {last: timestamp, tokens: count}
// Lua script atomically refills and consumes tokens.
// Smooth rate limiting, allows bursts.
public class TokenBucketStrategy implements RateLimitStrategy {

    private final RedisRateLimitStore store;

    public TokenBucketStrategy(RedisRateLimitStore store) {
        this.store = store;
    }

    // Lua script for token bucket.
    // KEYS[1] = hash key
    // ARGV[1] = now (seconds)
    // ARGV[2] = refill rate (tokens/sec)
    // ARGV[3] = capacity
    // ARGV[4] = TTL
    // Returns: "allowedFlag,tokensAfterOperation"
    private static final String TOKEN_BUCKET_LUA = """
        local last = redis.call('HGET', KEYS[1], 'last')
        local tokens = redis.call('HGET', KEYS[1], 'tokens')
        if not last then
            last = 0
            tokens = ARGV[3]
        end
        local now = tonumber(ARGV[1])
        local elapsed = now - tonumber(last)
        local refill = elapsed * tonumber(ARGV[2])
        tokens = math.min(tonumber(ARGV[3]), tonumber(tokens) + refill)
        local allowed = tokens >= 1
        if allowed then
            tokens = tokens - 1
            redis.call('HSET', KEYS[1], 'last', now, 'tokens', tokens)
            redis.call('EXPIRE', KEYS[1], ARGV[4])
        end
        return tostring(allowed and 1 or 0) .. ',' .. tostring(tokens)
        """;

    @Override
    public RateLimitResult evaluate(String key, RateLimitRule rule) {
        long now = Instant.now().getEpochSecond();
        double rate = (double) rule.limit() / rule.windowSecs();
        String bucketKey = RedisKeyBuilder.buildKey(rule.keyPrefix(), "token", key);

        String evaluation = store.evalLua(TOKEN_BUCKET_LUA, String.class, new String[]{bucketKey},
            new String[]{String.valueOf(now), String.valueOf(rate), String.valueOf(rule.limit()), String.valueOf(rule.windowSecs())});

        String[] parts = evaluation.split(",", 2);
        boolean allowed = "1".equals(parts[0]);
        double tokens = Double.parseDouble(parts[1]);
        int remaining = Math.max(0, (int) Math.floor(tokens));
        long secondsToNextToken = (long) Math.ceil(Math.max(0.0, (1.0 - tokens) / rate));
        Instant resetAt = allowed ? Instant.now() : Instant.now().plusSeconds(secondsToNextToken);
        Duration retryAfter = allowed ? null : Duration.ofSeconds(secondsToNextToken);

        return new RateLimitResult(allowed, rule.limit(), remaining, resetAt, retryAfter);
    }
}
