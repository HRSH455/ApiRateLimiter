package com.work.RateLimiter.model;


// Strategy interface for rate limiting algorithms.
// Each implementation uses Redis atomically via Lua scripts.
// Takes a Redis key and a RateLimitRule. Returns RateLimitResult
public interface RateLimitStrategy {
    
}
