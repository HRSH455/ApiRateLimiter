package com.work.RateLimiter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.work.RateLimiter.config.RateLimitConfig;

@SpringBootApplication
@EnableConfigurationProperties(RateLimitConfig.class) // Enables binding of RateLimitConfig properties from application.yml
public class RateLimiterApplication {

	public static void main(String[] args) {
		SpringApplication.run(RateLimiterApplication.class, args);
	}

}
