package com.work.RateLimiter.filter;

import com.work.RateLimiter.model.RateLimitResult;
import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.resolver.ClientIdentityResolver;
import com.work.RateLimiter.service.RateLimitService;
import com.work.RateLimiter.service.RateLimitStatsService;
import com.work.RateLimiter.util.RateLimitHeaderWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Map;

// OncePerRequestFilter that enforces rate limits on every incoming request.
// Does NOT extend HandlerInterceptorAdapter — filters run before DispatcherServlet,
// catching all requests including error paths.
//
// Flow:
//   1. resolve client identity (IP or API key)
//   2. find matching RateLimitRule for this request path
//   3. check Redis is available — fail open if not
//   4. delegate to RateLimitService.evaluate()
//   5. if blocked: write 429 JSON response + Retry-After header
//   6. if allowed: set RateLimit-* headers and continue chain
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService service;
    private final RateLimitStatsService statsService;
    private final ClientIdentityResolver resolver;
    private final Map<String, RateLimitRule> rules;

    public RateLimitFilter(RateLimitService service, RateLimitStatsService statsService, ClientIdentityResolver resolver, Map<String, RateLimitRule> rules) {
        this.service = service;
        this.statsService = statsService;
        this.resolver = resolver;
        this.rules = rules;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        // Always allow CORS for the frontend app (including on error paths)
        setCorsHeaders(response);

        // Preflight requests should not be rate limited
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String path = request.getRequestURI();
        RateLimitRule rule = rules.get(path);
        if (rule == null) {
            // No limit for this path
            chain.doFilter(request, response);
            return;
        }

        String identity = resolver.resolve(request);

        RateLimitResult result;
        try {
            result = service.checkRateLimit(rule.keyPrefix() + ":" + identity, rule);
        } catch (Exception e) {
            // Redis down, fail open
            statsService.recordAllowed();
            chain.doFilter(request, response);
            return;
        }

        if (!result.allowed()) {
            statsService.recordBlocked();
            response.setStatus(429);
            response.setContentType("application/json");
            if (result.retryAfter() != null) {
                response.setHeader("Retry-After", String.valueOf(result.retryAfter().getSeconds()));
            }
            response.getWriter().write("Rate limit exceeded");
            return;
        }

        // Allowed
        statsService.recordAllowed();
        RateLimitHeaderWriter.writeHeaders(response, result);
        chain.doFilter(request, response);
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
        response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
        response.setHeader("Access-Control-Expose-Headers", "RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset,Retry-After");
        response.setHeader("Access-Control-Allow-Credentials", "true");
    }
}
