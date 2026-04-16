package com.work.RateLimiter.strategy;

import com.work.RateLimiter.model.RateLimitResult;
import com.work.RateLimiter.model.RateLimitRule;

public interface RateLimitStrategy {
    RateLimitResult evaluate(String key, RateLimitRule rule);
    
}
