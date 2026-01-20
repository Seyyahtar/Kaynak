package com.stok.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Stok Yönetim Uygulaması - Spring Boot Main Application
 */
@SpringBootApplication
@EnableJpaAuditing
public class StokApplication {

    public static void main(String[] args) {
        SpringApplication.run(StokApplication.class, args);
    }
}
