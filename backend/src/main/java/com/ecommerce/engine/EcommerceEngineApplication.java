package com.ecommerce.engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EcommerceEngineApplication {
    public static void main(String[] args) {
        SpringApplication.run(EcommerceEngineApplication.class, args);
    }
}
