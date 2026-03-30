package com.ecommerce.engine.controller;

import com.ecommerce.engine.entity.Order;
import com.ecommerce.engine.enums.OrderStatus;
import com.ecommerce.engine.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {
    private final OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        String couponCode = body.get("couponCode");
        String idempotencyKey = body.get("idempotencyKey");
        String paymentMode = body.get("paymentMode");
        return ResponseEntity.ok(orderService.placeOrder(userId, couponCode, idempotencyKey, paymentMode));
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(orderService.getOrder(orderId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUser(@PathVariable String userId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable OrderStatus status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(status));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable String orderId, @RequestBody Map<String, String> body) {
        OrderStatus newStatus = OrderStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, newStatus));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId));
    }

    @PostMapping("/{orderId}/return")
    public ResponseEntity<Order> returnItems(@PathVariable String orderId, @RequestBody Map<String, Object> body) {
        String productId = (String) body.get("productId");
        int quantity = (int) body.get("quantity");
        return ResponseEntity.ok(orderService.returnItems(orderId, productId, quantity));
    }
}
