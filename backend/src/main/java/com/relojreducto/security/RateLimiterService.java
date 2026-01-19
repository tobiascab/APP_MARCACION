package com.relojreducto.security;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;

/**
 * Servicio simple para limitar intentos de login por IP.
 * En un entorno real, usar Redis o Bucket4j.
 */
@Service
public class RateLimiterService {

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final int BLOCK_MINUTES = 15;

    public boolean isBlocked(String ip) {
        Attempt attempt = attempts.get(ip);
        if (attempt == null)
            return false;

        if (attempt.count >= MAX_ATTEMPTS) {
            if (attempt.lastAttempt.plusMinutes(BLOCK_MINUTES).isAfter(LocalDateTime.now())) {
                return true;
            } else {
                // El bloqueo expiró
                attempts.remove(ip);
                return false;
            }
        }
        return false;
    }

    public void addAttempt(String ip) {
        attempts.compute(ip, (key, val) -> {
            if (val == null)
                return new Attempt(1, LocalDateTime.now());
            val.count++;
            val.lastAttempt = LocalDateTime.now();
            return val;
        });
    }

    public void resetAttempts(String ip) {
        attempts.remove(ip);
    }

    private static class Attempt {
        int count;
        LocalDateTime lastAttempt;

        Attempt(int count, LocalDateTime lastAttempt) {
            this.count = count;
            this.lastAttempt = lastAttempt;
        }
    }
}
