package com.work.RateLimiter.model;

// Record representing rate limit statistics for the dashboard.
// Fields: totalRequests (long), allowedRequests (long), blockedRequests (long), activeKeys (long)
public record RateLimitStats(long totalRequests, long allowedRequests, long blockedRequests, long activeKeys) {

}