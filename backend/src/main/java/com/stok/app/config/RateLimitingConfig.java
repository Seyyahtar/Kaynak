package com.stok.app.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitingConfig {

    @Bean
    public Bucket bucket() {
        // Defines the limit: 500 requests per minute to accommodate bulk operations
        // like Excel import
        Bandwidth limit = Bandwidth.classic(500, Refill.greedy(500, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
