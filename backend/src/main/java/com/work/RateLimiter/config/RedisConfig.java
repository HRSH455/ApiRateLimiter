package com.work.RateLimiter.config;

import com.work.RateLimiter.store.RedisRateLimitStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

// Configures Redis connection and templates.
// Uses Lettuce as the Redis client.
// Provides StringRedisTemplate and RedisRateLimitStore beans.
@Configuration
public class RedisConfig {

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    @Bean
    public RedisRateLimitStore redisRateLimitStore(StringRedisTemplate redisTemplate) {
        return new RedisRateLimitStore(redisTemplate);
    }
}
