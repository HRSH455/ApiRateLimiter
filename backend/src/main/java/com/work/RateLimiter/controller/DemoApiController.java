package com.work.RateLimiter.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

// Demo REST controller with endpoints that have different rate limits.
// Used to test the rate limiting functionality.
// Endpoints:
//   GET /api/public  → no limit or loose limit
//   GET /api/user    → moderate limit
//   GET /api/admin   → strict limit
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class DemoApiController {

    @GetMapping("/public")
    public Map<String, String> publicEndpoint() {
        return Map.of("message", "Public endpoint, no strict limits");
    }

    @GetMapping("/user")
    public Map<String, String> userEndpoint() {
        return Map.of("message", "User endpoint, moderate rate limit");
    }

    @GetMapping("/admin")
    public Map<String, String> adminEndpoint() {
        return Map.of("message", "Admin endpoint, strict rate limit");
    }
}