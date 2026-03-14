package com.work.RateLimiter.util;

// Builds namespaced Redis keys for rate limiting.
// Pattern: rl:{prefix}:{strategy}:{identity}
// Example: rl:auth:fixed:192.168.1.1
// Example: rl:search:sliding:user-42
// All methods are static. No state.
public class RedisKeyBuilder {
    
}
