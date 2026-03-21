package com.work.RateLimiter.controller;

import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.model.RateLimitStats;
import com.work.RateLimiter.service.RateLimitStatsService;
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
    private final RateLimitStatsService statsService;

    public RateLimitAdminController(Map<String, RateLimitRule> rules, RateLimitStatsService statsService) {
        this.rules = rules;
        this.statsService = statsService;
    }

    @GetMapping("/stats")
    public RateLimitStats getStats() {
        return statsService.snapshot();
    }

    @GetMapping("/config")
    public Map<String, RateLimitRule> getConfig() {
        return rules;
    }

    @PutMapping("/config")
    public Map<String, RateLimitRule> updateConfig(@RequestBody Map<String, RateLimitRule> newRules) {
        // Update rules at runtime without redeploy
        // 1. Clear old rules
        rules.clear();
        // 2. Add new rules
        rules.putAll(newRules);
        // 3. Clear Redis counters for updated rules (reset rate limits)
        for (String keyPrefix : newRules.values().stream()
                .map(RateLimitRule::keyPrefix)
                .distinct()
                .toList()) {
            statsService.clearByPrefix(keyPrefix);
        }
        return rules;
    }

    @PostMapping("/config")
    public Map<String, RateLimitRule> updateConfigPost(@RequestBody Map<String, RateLimitRule> newRules) {
        return updateConfig(newRules);
    }

    @DeleteMapping("/keys/{key}")
    public void clearKey(@PathVariable String key) {
        statsService.clearExactKey(key);
    }
}
