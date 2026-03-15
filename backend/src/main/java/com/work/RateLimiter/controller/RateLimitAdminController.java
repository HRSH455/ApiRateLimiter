package com.work.RateLimiter.controller;

import com.work.RateLimiter.model.RateLimitRule;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// REST controller exposing rate limit stats and config to the Angular dashboard.
// Endpoints:
//   GET  /admin/rate-limit/stats          → current hit counts per route
//   GET  /admin/rate-limit/config         → current rules
//   POST /admin/rate-limit/config         → update rules at runtime (no redeploy)
//   DELETE /admin/rate-limit/keys/{key}   → manually clear a limit (unblock an IP)
@RestController
@RequestMapping("/admin/rate-limit")
@CrossOrigin(origins = "http://localhost:4200")
public class RateLimitAdminController {

    private final Map<String, RateLimitRule> rules;
    private final StringRedisTemplate redisTemplate;

    public RateLimitAdminController(Map<String, RateLimitRule> rules, StringRedisTemplate redisTemplate) {
        this.rules = rules;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/stats")
    public Map<String, RateLimitRule> getStats() {
        return rules; // Placeholder, return rules as stats
    }

    @GetMapping("/config")
    public Map<String, RateLimitRule> getConfig() {
        return rules;
    }

    @PostMapping("/config")
    public void updateConfig(@RequestBody Map<String, RateLimitRule> newRules) {
        // Placeholder, not implemented
    }

    @DeleteMapping("/keys/{key}")
    public void clearKey(@PathVariable String key) {
        redisTemplate.delete(key);
    }
}
