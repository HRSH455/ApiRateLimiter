package com.work.RateLimiter.store;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Arrays;

@Component
public class RedisRateLimitStore {

    private final StringRedisTemplate redisTemplate;

    // Pre-compile scripts to save memory
    private static final RedisScript<Long> INCR_EXPIRE_SCRIPT = new DefaultRedisScript<>(
        """
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then
            redis.call('EXPIRE', KEYS[1], ARGV[1])
        end
        return count
        """, Long.class
    );

    public RedisRateLimitStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Atomically increment key and set TTL only on first increment.
     * Returns 0 if the operation fails or returns null.
     */
    public long incrementAndExpire(String key, long ttlSeconds) {
        Long result = redisTemplate.execute(
            INCR_EXPIRE_SCRIPT, 
            Collections.singletonList(key), 
            String.valueOf(ttlSeconds)
        );
        return result != null ? result : 0L;
    }

    /**
     * Execute arbitrary Lua script for complex operations.
     * Uses List for keys and Varargs for args for better flexibility.
     */
    public <T> T evalLua(String script, Class<T> returnType, String[] keys, Object... args) {
        RedisScript<T> redisScript = new DefaultRedisScript<>(script, returnType);
        List<String> keyList = Arrays.asList(keys);
        return redisTemplate.execute(redisScript, keyList, args);
    }
}
