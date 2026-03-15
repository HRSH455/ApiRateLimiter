package com.work.RateLimiter.store;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;

// Redis abstraction layer for rate limiting operations.
// Strategies inject this — they never touch RedisTemplate directly.
// This allows swapping Redis for ConcurrentHashMap in tests.
// Uses StringRedisTemplate for all operations.
// incrementAndExpire() uses a Lua script for atomicity.
// evalLua() executes arbitrary Lua scripts for complex strategies.

@Component
public class RedisRateLimitStore {

    private final StringRedisTemplate redisTemplate;

    public RedisRateLimitStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // Atomically increment key and set TTL only on first increment.
    // Uses Lua to prevent race between INCR and EXPIRE.
    // Returns the count AFTER incrementing.
    public long incrementAndExpire(String key, long ttlSeconds) {
        String script = """
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """;
        RedisScript<Long> redisScript = RedisScript.of(script, Long.class);
        return redisTemplate.execute(redisScript, Collections.singletonList(key), String.valueOf(ttlSeconds));
    }

    // Execute arbitrary Lua script for complex operations.
    public <T> T evalLua(String script, Class<T> returnType, String[] keys, String[] args) {
        RedisScript<T> redisScript = RedisScript.of(script, returnType);
        return redisTemplate.execute(redisScript, keys.length == 0 ? Collections.emptyList() : java.util.Arrays.asList(keys), args);
    }
}
