package com.work.RateLimiter.util;

import org.springframework.stereotype.Component;

// Builds namespaced Redis keys for rate limiting.
// Pattern: rl:{prefix}:{strategy}:{identity}
// Example: rl:auth:fixed:192.168.1.1
// Example: rl:search:sliding:user-42
// All methods are static. No state.

@Component
public class RedisKeyBuilder {
    public static String buildKey(String prefix, String strategy, String identity) {
        return String.format("rl:%s:%s:%s", prefix, strategy, identity);
    }
}
