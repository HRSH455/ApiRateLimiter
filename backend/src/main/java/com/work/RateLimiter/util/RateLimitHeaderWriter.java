package com.work.RateLimiter.util;

import com.work.RateLimiter.model.RateLimitResult;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;

// Writes standard RateLimit-* headers to the HTTP response.
// Headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
public class RateLimitHeaderWriter {
    public static void writeHeaders(HttpServletResponse response, RateLimitResult result) {
        response.setHeader("RateLimit-Limit", String.valueOf(result.limit()));
        response.setHeader("RateLimit-Remaining", String.valueOf(result.remaining()));
        response.setHeader("RateLimit-Reset", String.valueOf(result.resetAt().getEpochSecond()));
    }
}
