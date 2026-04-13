package com.work.RateLimiter.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

// Basic HTTP authentication for /admin endpoints.
//   - Browser sends:  Authorization: Basic base64(username:password)
//   - Spring Security decodes and checks against the in-memory user below
//   - /api/** is fully public (rate-limited but not authenticated)
//   - /admin/** requires valid credentials
//
// Credentials set via environment variables:
//   ADMIN_USERNAME=admin
//   ADMIN_PASSWORD=your-password
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()  // CORS preflight
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/**").permitAll()                  // public API
                .requestMatchers("/admin/**").authenticated()            // protected
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> basic
                .realmName("RateLimiter Admin")
            );

        return http.build();
    }

    // Single in-memory admin user — sufficient for a learning project.
    // Password is BCrypt-hashed at startup (never stored in plain text).
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        var admin = User.builder()
            .username(adminUsername)
            .password(encoder.encode(adminPassword))
            .roles("ADMIN")
            .build();
        return new InMemoryUserDetailsManager(admin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}