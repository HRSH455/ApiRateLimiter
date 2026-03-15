package com.work.RateLimiter.service;

import com.work.RateLimiter.model.RateLimitResult;
import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.model.RateLimitStrategy;
import com.work.RateLimiter.strategy.FixedWindowStrategy;
import com.work.RateLimiter.strategy.SlidingWindowStrategy;
import com.work.RateLimiter.strategy.TokenBucketStrategy;
import com.work.RateLimiter.store.RedisRateLimitStore;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

// Business logic service for rate limiting.
// Orchestrates strategy selection and execution.
// Used by filter and admin controller.
@Service
public class RateLimitService {

    private final Map<String, RateLimitStrategy> strategies;

    public RateLimitService(RedisRateLimitStore store) {
        this.strategies = Map.of(
            "fixed", new FixedWindowStrategy(store),
            "sliding", new SlidingWindowStrategy(store),
            "token", new TokenBucketStrategy(store)
        );
    }

    public RateLimitResult checkRateLimit(String key, RateLimitRule rule) {
        RateLimitStrategy strategy = strategies.get(rule.strategy());
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown strategy: " + rule.strategy());
        }
        return strategy.evaluate(key, rule);
    }
}
