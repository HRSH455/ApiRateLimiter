package com.work.RateLimiter.controller;


// REST controller exposing rate limit stats and config to the Angular dashboard.
// Endpoints:
//   GET  /admin/rate-limit/stats          → current hit counts per route
//   GET  /admin/rate-limit/config         → current rules
//   POST /admin/rate-limit/config         → update rules at runtime (no redeploy)
//   DELETE /admin/rate-limit/keys/{key}   → manually clear a limit (unblock an IP)
@RestController
@RequestMapping("/admin/rate-limit")
@CrossOrigin(origins = "http://localhost:4200")
public class ApiController {
    
}
