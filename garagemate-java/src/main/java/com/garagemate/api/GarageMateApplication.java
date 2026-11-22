package com.garagemate.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableScheduling
@org.springframework.scheduling.annotation.EnableAsync
public class GarageMateApplication {

    public static void main(String[] args) {
        SpringApplication.run(GarageMateApplication.class, args);
    }
}
