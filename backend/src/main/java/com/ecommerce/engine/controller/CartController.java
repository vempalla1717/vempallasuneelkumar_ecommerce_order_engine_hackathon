package com.ecommerce.engine.controller;

import com.ecommerce.engine.entity.CartItem;
import com.ecommerce.engine.service.CartService;
import com.ecommerce.engine.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CartController {
    private final CartService cartService;
    private final DiscountService discountService;

    @PostMapping("/{userId}/add")
    public ResponseEntity<CartItem> addToCart(@PathVariable String userId, @RequestBody Map<String, Object> body) {
        String productId = (String) body.get("productId");
        int quantity = (int) body.get("quantity");
        return ResponseEntity.ok(cartService.addToCart(userId, productId, quantity));
    }

    @DeleteMapping("/{userId}/remove/{productId}")
    public ResponseEntity<Map<String, String>> removeFromCart(@PathVariable String userId, @PathVariable String productId) {
        cartService.removeFromCart(userId, productId);
        return ResponseEntity.ok(Map.of("message", "Item removed from cart"));
    }

    @PutMapping("/{userId}/update")
    public ResponseEntity<?> updateQuantity(@PathVariable String userId, @RequestBody Map<String, Object> body) {
        String productId = (String) body.get("productId");
        int quantity = (int) body.get("quantity");
        CartItem item = cartService.updateCartQuantity(userId, productId, quantity);
        if (item == null) {
            return ResponseEntity.ok(Map.of("message", "Item removed from cart (quantity was 0)"));
        }
        return ResponseEntity.ok(item);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<CartItem>> getCart(@PathVariable String userId) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<Map<String, String>> clearCart(@PathVariable String userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }

    @GetMapping("/{userId}/preview")
    public ResponseEntity<Map<String, Object>> previewDiscount(@PathVariable String userId,
                                                                @RequestParam(required = false) String couponCode) {
        List<CartItem> cartItems = cartService.getCart(userId);
        return ResponseEntity.ok(discountService.calculateDiscount(cartItems, couponCode));
    }
}
