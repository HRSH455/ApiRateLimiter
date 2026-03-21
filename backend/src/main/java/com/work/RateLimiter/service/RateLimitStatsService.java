package com.work.RateLimiter.service;

import com.work.RateLimiter.model.RateLimitStats;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.Cursor;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

@Service
public class RateLimitStatsService {

    private static final String RATE_LIMIT_KEY_PREFIX = "rl:";

    private final AtomicLong totalRequests = new AtomicLong();
    private final AtomicLong allowedRequests = new AtomicLong();
    private final AtomicLong blockedRequests = new AtomicLong();
    private final StringRedisTemplate redisTemplate;

    public RateLimitStatsService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void recordAllowed() {
        totalRequests.incrementAndGet();
        allowedRequests.incrementAndGet();
    }

    public void recordBlocked() {
        totalRequests.incrementAndGet();
        blockedRequests.incrementAndGet();
    }

    public RateLimitStats snapshot() {
        return new RateLimitStats(
            totalRequests.get(),
            allowedRequests.get(),
            blockedRequests.get(),
            countActiveKeys()
        );
    }

    private long countActiveKeys() {
        Long result = redisTemplate.execute((RedisConnection connection) -> {
            long count = 0L;
            ScanOptions options = ScanOptions.scanOptions().match(RATE_LIMIT_KEY_PREFIX + "*").count(1000).build();
            try (Cursor<byte[]> cursor = connection.keyCommands().scan(options)) {
                while (cursor.hasNext()) {
                    cursor.next();
                    count++;
                }
            } catch (Exception ignored) {
                // Fallback to zero in case Redis is unavailable; API remains responsive.
            }
            return count;
        });
        return result == null ? 0L : result;
    }

    public long clearByPrefix(String keyPrefix) {
        String pattern = "rl:" + keyPrefix + ":*";
        Long result = redisTemplate.execute((RedisConnection connection) -> {
            long deleted = 0L;
            ScanOptions options = ScanOptions.scanOptions().match(pattern).count(1000).build();
            try (Cursor<byte[]> cursor = connection.keyCommands().scan(options)) {
                while (cursor.hasNext()) {
                    byte[] key = cursor.next();
                    Long deleteCount = connection.keyCommands().del(key);
                    if (deleteCount != null) {
                        deleted += deleteCount;
                    }
                }
            } catch (Exception ignored) {
                // Best-effort invalidation; update endpoint still succeeds for in-memory rules.
            }
            return deleted;
        });
        return result == null ? 0L : result;
    }

    public void clearExactKey(String key) {
        redisTemplate.delete(key);
    }

    public void clearExactRuntimeKey(String keyPrefix, String strategy, String identity) {
        String runtimeKey = "rl:" + keyPrefix + ":" + strategy + ":" + identity;
        redisTemplate.delete(runtimeKey);
    }
}
