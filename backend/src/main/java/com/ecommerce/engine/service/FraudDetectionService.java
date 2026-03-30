package com.ecommerce.engine.service;

import com.ecommerce.engine.enums.EventType;
import com.ecommerce.engine.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionService {
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;
    private final EventService eventService;

    private static final double HIGH_VALUE_THRESHOLD = 500000;
    private static final int MAX_ORDERS_PER_MINUTE = 3;

    public Map<String, Object> checkFraud(String userId, double orderTotal) {
        Map<String, Object> result = new HashMap<>();
        boolean flagged = false;
        StringBuilder reasons = new StringBuilder();

        long recentOrders = orderRepository.countRecentOrdersByUser(userId, LocalDateTime.now().minusMinutes(1));
        if (recentOrders >= MAX_ORDERS_PER_MINUTE) {
            flagged = true;
            reasons.append("Rapid ordering detected (").append(recentOrders).append(" orders in last minute). ");
        }

        if (orderTotal > HIGH_VALUE_THRESHOLD) {
            flagged = true;
            reasons.append("High-value order: Rs.").append(orderTotal).append(". ");
        }

        if (flagged) {
            log.warn("FRAUD ALERT for user {}: {}", userId, reasons);
            auditLogService.log("FRAUD_DETECTED", userId, "ORDER", "N/A", reasons.toString());
            eventService.publishEvent(EventType.FRAUD_DETECTED, userId, reasons.toString());
        }

        result.put("flagged", flagged);
        result.put("reasons", reasons.toString());
        return result;
    }
}
