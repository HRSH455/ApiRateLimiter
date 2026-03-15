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
    // Returns: tokens after operation (if allowed, after consume; if not, current)
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
        return tokens
        """;

    @Override
    public RateLimitResult evaluate(String key, RateLimitRule rule) {
        long now = Instant.now().getEpochSecond();
        double rate = (double) rule.limit() / rule.windowSecs();
        String bucketKey = RedisKeyBuilder.buildKey(rule.keyPrefix(), "token", key);

        Double tokens = store.evalLua(TOKEN_BUCKET_LUA, Double.class, new String[]{bucketKey}, 
            new String[]{String.valueOf(now), String.valueOf(rate), String.valueOf(rule.limit()), String.valueOf(rule.windowSecs())});

        boolean allowed = tokens >= 1.0;
        int remaining = (int) Math.floor(tokens);
        Instant resetAt = allowed ? Instant.now() : Instant.now().plusSeconds((long) Math.ceil((1 - tokens) / rate));
        Duration retryAfter = allowed ? null : Duration.ofSeconds((long) Math.ceil((1 - tokens) / rate));

        return new RateLimitResult(allowed, rule.limit(), remaining, resetAt, retryAfter);
    }
}
