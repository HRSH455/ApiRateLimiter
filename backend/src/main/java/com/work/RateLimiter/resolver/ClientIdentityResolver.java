package com.work.RateLimiter.resolver;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

// Extracts client identity from HTTP request.
// Currently uses IP address from X-Forwarded-For header or remoteAddr.
// Pluggable: could be swapped for API key, user ID, etc.
@Component
public class ClientIdentityResolver {
    public String resolve(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP if multiple
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

