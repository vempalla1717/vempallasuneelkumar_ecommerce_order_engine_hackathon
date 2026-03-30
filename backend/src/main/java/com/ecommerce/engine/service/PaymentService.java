package com.ecommerce.engine.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Random;

@Service
@Slf4j
public class PaymentService {
    private final Random random = new Random();
    private boolean failureMode = false;

    public boolean processPayment(String orderId, double amount) {
        log.info("Processing payment for order {} amount: {}", orderId, amount);
        if (failureMode) {
            log.warn("Payment failed (failure mode ON) for order {}", orderId);
            return false;
        }
        boolean success = random.nextInt(100) >= 20;
        if (success) {
            log.info("Payment SUCCESS for order {}", orderId);
        } else {
            log.warn("Payment FAILED (random) for order {}", orderId);
        }
        return success;
    }

    public void setFailureMode(boolean enabled) {
        this.failureMode = enabled;
        log.info("Payment failure mode set to: {}", enabled);
    }

    public boolean isFailureMode() {
        return failureMode;
    }
}
