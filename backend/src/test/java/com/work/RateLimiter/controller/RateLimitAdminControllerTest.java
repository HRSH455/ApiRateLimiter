package com.work.RateLimiter.controller;

import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.model.RateLimitStats;
import com.work.RateLimiter.service.RateLimitStatsService;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitAdminControllerTest {

    @Test
    void returnsLiveStatsSnapshot() {
        RateLimitStatsService statsService = mock(RateLimitStatsService.class);
        when(statsService.snapshot()).thenReturn(new RateLimitStats(10, 8, 2, 3));

        RateLimitAdminController controller = new RateLimitAdminController(new HashMap<>(), statsService);
        RateLimitStats stats = controller.getStats();

        assertEquals(10, stats.totalRequests());
        assertEquals(3, stats.activeKeys());
    }

    @Test
    void updatesMapConfigAndInvalidatesPrefixes() {
        RateLimitStatsService statsService = mock(RateLimitStatsService.class);
        Map<String, RateLimitRule> rules = new HashMap<>();
        RateLimitAdminController controller = new RateLimitAdminController(rules, statsService);

        Map<String, RateLimitRule> update = Map.of(
            "/api/public", new RateLimitRule(100, 60, "fixed", "public")
        );

        Map<String, RateLimitRule> result = controller.updateConfig(update);

        assertEquals(1, result.size());
        assertTrue(result.containsKey("/api/public"));
        verify(statsService, times(1)).clearByPrefix("public");
    }
}

