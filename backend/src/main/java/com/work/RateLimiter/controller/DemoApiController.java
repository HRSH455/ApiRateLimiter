package com.work.RateLimiter.controller;

import com.work.RateLimiter.model.RateLimitRule;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// Dynamic demo controller — every path registered in the rate limit rules map
// automatically gets a real handler. No more sync issues between config and endpoints.
// Supports GET and POST on any /api/** path that has a rule.
@RestController
public class DemoApiController {

    private final Map<String, RateLimitRule> rules;

    public DemoApiController(Map<String, RateLimitRule> rules) {
        this.rules = rules;
    }

    @RequestMapping(
        value = "/api/**",
        method = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE }
    )
    public ResponseEntity<Map<String, Object>> handleAny(HttpServletRequest request) {
        String path = request.getRequestURI();
        RateLimitRule rule = rules.get(path);

        if (rule == null) {
            return ResponseEntity.status(404).body(Map.of(
                "error", "No handler or rate limit rule found for: " + path,
                "hint", "Add this path to application.properties rate-limit.routes"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "path", path,
            "message", "OK — endpoint is active",
            "rateLimit", Map.of(
                "limit", rule.limit(),
                "windowSecs", rule.windowSecs(),
                "strategy", rule.strategy()
            )
        ));
    }
}