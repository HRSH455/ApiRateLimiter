package com.work.RateLimiter.config;

import com.work.RateLimiter.model.RateLimitRule;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// Binds application.yml rate limit configurations to Java objects.
// Provides a Map<String, RateLimitRule> bean for path-based rules.
@Configuration
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitConfig {

    private List<RouteConfig> routes;

    public static class RouteConfig {
        private String path;
        private int limit;
        private int windowSecs;
        private String strategy;
        private String keyPrefix;

        // getters and setters
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
        public int getWindowSecs() { return windowSecs; }
        public void setWindowSecs(int windowSecs) { this.windowSecs = windowSecs; }
        public String getStrategy() { return strategy; }
        public void setStrategy(String strategy) { this.strategy = strategy; }
        public String getKeyPrefix() { return keyPrefix != null ? keyPrefix : path; }
        public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }
    }

    public List<RouteConfig> getRoutes() {
        return routes;
    }

    public void setRoutes(List<RouteConfig> routes) {
        this.routes = routes;
    }

    @Bean
    public Map<String, RateLimitRule> rateLimitRules() {
        return routes.stream()
                .collect(Collectors.toMap(
                        RouteConfig::getPath,
                        r -> new RateLimitRule(r.getLimit(), r.getWindowSecs(), r.getStrategy(), r.getKeyPrefix())
                ));
    }
}
