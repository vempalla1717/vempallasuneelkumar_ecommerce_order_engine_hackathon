package com.ecommerce.engine.service;

import com.ecommerce.engine.entity.CartItem;
import com.ecommerce.engine.entity.Product;
import com.ecommerce.engine.exception.BusinessException;
import com.ecommerce.engine.repository.CartItemRepository;
import com.ecommerce.engine.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final AuditLogService auditLogService;

    private static final int RESERVATION_MINUTES = 15;

    @Transactional
    public CartItem addToCart(String userId, String productId, int quantity) {
        if (quantity <= 0) {
            throw new BusinessException("Quantity must be positive.");
        }
        Product product = productRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));

        if (product.getStock() <= 0 || product.getAvailableStock() <= 0) {
            throw new BusinessException("Product is out of stock: " + productId);
        }

        Optional<CartItem> existing = cartItemRepository.findByUserIdAndProductProductId(userId, productId);

        if (existing.isPresent()) {
            CartItem item = existing.get();
            int totalQty = item.getQuantity() + quantity;
            if (quantity > product.getAvailableStock()) {
                throw new BusinessException("Cannot add more than available stock. Available: " + product.getAvailableStock());
            }
            productService.reserveStock(productId, quantity);
            item.setQuantity(totalQty);
            item.setExpiresAt(LocalDateTime.now().plusMinutes(RESERVATION_MINUTES));
            auditLogService.log("UPDATE_CART", userId, "CART", productId,
                    "Updated quantity to " + totalQty);
            return cartItemRepository.save(item);
        } else {
            if (quantity > product.getAvailableStock()) {
                throw new BusinessException("Cannot add more than available stock. Available: " + product.getAvailableStock());
            }
            productService.reserveStock(productId, quantity);
            CartItem cartItem = new CartItem();
            cartItem.setUserId(userId);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cartItem.setReservedAt(LocalDateTime.now());
            cartItem.setExpiresAt(LocalDateTime.now().plusMinutes(RESERVATION_MINUTES));
            auditLogService.log("ADD_TO_CART", userId, "CART", productId,
                    "Added " + quantity + " units to cart");
            return cartItemRepository.save(cartItem);
        }
    }

    @Transactional
    public void removeFromCart(String userId, String productId) {
        CartItem item = cartItemRepository.findByUserIdAndProductProductId(userId, productId)
                .orElseThrow(() -> new BusinessException("Item not found in cart."));
        productService.releaseStock(productId, item.getQuantity());
        cartItemRepository.delete(item);
        auditLogService.log("REMOVE_FROM_CART", userId, "CART", productId,
                "Removed from cart, released " + item.getQuantity() + " units");
    }

    @Transactional
    public CartItem updateCartQuantity(String userId, String productId, int newQuantity) {
        if (newQuantity <= 0) {
            removeFromCart(userId, productId);
            return null;
        }
        CartItem item = cartItemRepository.findByUserIdAndProductProductId(userId, productId)
                .orElseThrow(() -> new BusinessException("Item not found in cart."));

        Product product = productRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));

        int oldQty = item.getQuantity();
        int diff = newQuantity - oldQty;

        if (diff > 0) {
            if (diff > product.getAvailableStock()) {
                throw new BusinessException("Insufficient available stock. Available: " + product.getAvailableStock());
            }
            productService.reserveStock(productId, diff);
        } else if (diff < 0) {
            productService.releaseStock(productId, Math.abs(diff));
        }

        item.setQuantity(newQuantity);
        item.setExpiresAt(LocalDateTime.now().plusMinutes(RESERVATION_MINUTES));
        auditLogService.log("UPDATE_CART", userId, "CART", productId,
                "Quantity changed from " + oldQty + " to " + newQuantity);
        return cartItemRepository.save(item);
    }

    public List<CartItem> getCart(String userId) {
        return cartItemRepository.findByUserId(userId);
    }

    @Transactional
    public void clearCart(String userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        for (CartItem item : items) {
            productService.releaseStock(item.getProduct().getProductId(), item.getQuantity());
        }
        cartItemRepository.deleteByUserId(userId);
    }
}
