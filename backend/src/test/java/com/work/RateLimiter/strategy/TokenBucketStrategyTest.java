package com.work.RateLimiter.strategy;

import com.work.RateLimiter.model.RateLimitResult;
import com.work.RateLimiter.model.RateLimitRule;
import com.work.RateLimiter.store.RedisRateLimitStore;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TokenBucketStrategyTest {

    @Test
    void evaluatesAllowedWhenLuaReturnsAllowedFlag() {
        RedisRateLimitStore store = mock(RedisRateLimitStore.class);
        when(store.evalLua(anyString(), eq(String.class), any(String[].class), any(String[].class)))
            .thenReturn("1,3.0");

        TokenBucketStrategy strategy = new TokenBucketStrategy(store);
        RateLimitResult result = strategy.evaluate("identity", new RateLimitRule(5, 60, "token", "public"));

        assertTrue(result.allowed());
        assertEquals(3, result.remaining());
        assertNull(result.retryAfter());
    }

    @Test
    void evaluatesBlockedWhenLuaReturnsBlockedFlag() {
        RedisRateLimitStore store = mock(RedisRateLimitStore.class);
        when(store.evalLua(anyString(), eq(String.class), any(String[].class), any(String[].class)))
            .thenReturn("0,0.2");

        TokenBucketStrategy strategy = new TokenBucketStrategy(store);
        RateLimitResult result = strategy.evaluate("identity", new RateLimitRule(5, 60, "token", "public"));

        assertFalse(result.allowed());
        assertEquals(0, result.remaining());
        assertNotNull(result.retryAfter());
    }
}

