package com.work.RateLimiter.exception;

// Custom exception thrown when rate limit is exceeded.
// Can be caught by global exception handlers for consistent error responses.
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
