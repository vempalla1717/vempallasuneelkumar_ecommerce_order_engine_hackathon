package com.ecommerce.engine.controller;

import com.ecommerce.engine.entity.EventLog;
import com.ecommerce.engine.service.ConcurrencySimulationService;
import com.ecommerce.engine.service.EventService;
import com.ecommerce.engine.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {
    private final PaymentService paymentService;
    private final EventService eventService;
    private final ConcurrencySimulationService concurrencySimulationService;

    @PostMapping("/failure-mode")
    public ResponseEntity<Map<String, Object>> setFailureMode(@RequestBody Map<String, Boolean> body) {
        boolean enabled = body.getOrDefault("enabled", false);
        paymentService.setFailureMode(enabled);
        return ResponseEntity.ok(Map.of(
                "failureMode", enabled,
                "message", "Payment failure mode " + (enabled ? "ENABLED" : "DISABLED")
        ));
    }

    @GetMapping("/failure-mode")
    public ResponseEntity<Map<String, Object>> getFailureMode() {
        return ResponseEntity.ok(Map.of("failureMode", paymentService.isFailureMode()));
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventLog>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @PostMapping("/events/process")
    public ResponseEntity<Map<String, String>> processEvents() {
        eventService.processEvents();
        return ResponseEntity.ok(Map.of("message", "Events processed"));
    }

    @PostMapping("/simulate-concurrency")
    public ResponseEntity<Map<String, Object>> simulateConcurrency(@RequestBody Map<String, Object> body) {
        String productId = (String) body.get("productId");
        int quantity = (int) body.get("quantity");
        int users = (int) body.getOrDefault("users", 5);
        return ResponseEntity.ok(concurrencySimulationService.simulateConcurrentAddToCart(productId, quantity, users));
    }
}
