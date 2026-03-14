package com.work.RateLimiter.filter;

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
