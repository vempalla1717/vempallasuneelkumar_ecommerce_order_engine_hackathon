package com.ecommerce.engine.service;

import com.ecommerce.engine.entity.*;
import com.ecommerce.engine.enums.EventType;
import com.ecommerce.engine.enums.OrderStatus;
import com.ecommerce.engine.exception.BusinessException;
import com.ecommerce.engine.repository.CartItemRepository;
import com.ecommerce.engine.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final PaymentService paymentService;
    private final DiscountService discountService;
    private final FraudDetectionService fraudDetectionService;
    private final AuditLogService auditLogService;
    private final EventService eventService;

    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = new HashMap<>();
    static {
        VALID_TRANSITIONS.put(OrderStatus.CREATED, Set.of(OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, OrderStatus.FAILED));
        VALID_TRANSITIONS.put(OrderStatus.PENDING_PAYMENT, Set.of(OrderStatus.PAID, OrderStatus.FAILED, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.PAID, Set.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED));
        VALID_TRANSITIONS.put(OrderStatus.DELIVERED, Set.of());
        VALID_TRANSITIONS.put(OrderStatus.FAILED, Set.of());
        VALID_TRANSITIONS.put(OrderStatus.CANCELLED, Set.of());
    }

    @Transactional
    public Order placeOrder(String userId, String couponCode, String idempotencyKey, String paymentMode) {
        // Task 19: Idempotency check
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            Optional<Order> existingOrder = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existingOrder.isPresent()) {
                log.info("Duplicate order request detected for idempotency key: {}", idempotencyKey);
                return existingOrder.get();
            }
        }

        // Step 1: Validate cart
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new BusinessException("Cart is empty. Cannot place order.");
        }

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product.getStock() <= 0) {
                throw new BusinessException("Product " + product.getProductId() + " is out of stock.");
            }
        }

        // Step 2: Calculate total with discounts
        Map<String, Object> discountResult = discountService.calculateDiscount(cartItems, couponCode);
        double subtotal = (double) discountResult.get("subtotal");
        double totalDiscount = (double) discountResult.get("totalDiscount");
        double finalTotal = (double) discountResult.get("finalTotal");

        // Task 17: Fraud detection
        Map<String, Object> fraudResult = fraudDetectionService.checkFraud(userId, finalTotal);
        boolean fraudFlagged = (boolean) fraudResult.get("flagged");

        // Create order
        Order order = new Order();
        order.setOrderId("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setUserId(userId);
        order.setStatus(OrderStatus.CREATED);
        order.setSubtotal(subtotal);
        order.setDiscountAmount(totalDiscount);
        order.setCouponCode(couponCode);
        order.setTotalAmount(finalTotal);
        order.setPaymentMode(paymentMode != null ? paymentMode : "COD");
        order.setIdempotencyKey(idempotencyKey);
        order.setItems(new ArrayList<>());

        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPriceAtOrder(cartItem.getProduct().getPrice());
            orderItem.setReturnedQuantity(0);
            order.getItems().add(orderItem);
        }

        order = orderRepository.save(order);
        eventService.publishEvent(EventType.ORDER_CREATED, order.getOrderId(), "Order created for user: " + userId);
        auditLogService.log("ORDER_CREATED", userId, "ORDER", order.getOrderId(),
                "Order created. Total: Rs." + finalTotal + (fraudFlagged ? " [FRAUD FLAGGED]" : ""));

        if (fraudFlagged) {
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            for (CartItem cartItem : cartItems) {
                productService.releaseStock(cartItem.getProduct().getProductId(), cartItem.getQuantity());
            }
            cartItemRepository.deleteByUserId(userId);
            throw new BusinessException("Order flagged for fraud. " + fraudResult.get("reasons"));
        }

        // Step 3: Lock stock and deduct
        try {
            for (CartItem cartItem : cartItems) {
                productService.deductStock(cartItem.getProduct().getProductId(), cartItem.getQuantity());
            }
        } catch (Exception e) {
            log.error("Stock deduction failed, rolling back order {}", order.getOrderId());
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            throw new BusinessException("Order failed during stock deduction: " + e.getMessage());
        }

        // Step 4: Process payment based on payment mode
        if ("COD".equals(paymentMode)) {
            // Cash on Delivery - no online payment needed
            order.setStatus(OrderStatus.CREATED);
            orderRepository.save(order);
            auditLogService.log("ORDER_CONFIRMED", userId, "ORDER", order.getOrderId(),
                    "COD order confirmed. Total: Rs." + finalTotal);
        } else {
            // Online payment (UPI, CARD, NET_BANKING)
            order.setStatus(OrderStatus.PENDING_PAYMENT);
            orderRepository.save(order);

            boolean paymentSuccess = paymentService.processPayment(order.getOrderId(), finalTotal);

            if (paymentSuccess) {
                order.setStatus(OrderStatus.PAID);
                orderRepository.save(order);
                eventService.publishEvent(EventType.PAYMENT_SUCCESS, order.getOrderId(),
                        "Payment of Rs." + finalTotal + " via " + paymentMode + " successful");
                auditLogService.log("PAYMENT_SUCCESS", userId, "ORDER", order.getOrderId(),
                        "Payment of Rs." + finalTotal + " via " + paymentMode + " successful");
            } else {
                // Task 7: Transaction Rollback
                log.warn("Payment failed for order {}. Rolling back...", order.getOrderId());
                for (OrderItem item : order.getItems()) {
                    productService.restoreStock(item.getProduct().getProductId(), item.getQuantity());
                }
                order.setStatus(OrderStatus.FAILED);
                orderRepository.save(order);
                eventService.publishEvent(EventType.PAYMENT_FAILED, order.getOrderId(), "Payment failed. Stock restored.");
                auditLogService.log("PAYMENT_FAILED", userId, "ORDER", order.getOrderId(),
                        "Payment failed via " + paymentMode + ". Stock restored. Order marked FAILED.");
                cartItemRepository.deleteByUserId(userId);
                throw new BusinessException("Payment failed. Order has been rolled back. Stock has been restored. Please try again.");
            }
        }

        // Step 5: Clear cart
        cartItemRepository.deleteByUserId(userId);
        auditLogService.log("CART_CLEARED", userId, "CART", "ALL", "Cart cleared after successful order");

        return order;
    }

    @Transactional
    public Order updateOrderStatus(String orderId, OrderStatus newStatus) {
        Order order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("Order not found: " + orderId));

        OrderStatus currentStatus = order.getStatus();
        Set<OrderStatus> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());

        if (!allowed.contains(newStatus)) {
            throw new BusinessException("Invalid state transition: " + currentStatus + " -> " + newStatus);
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        auditLogService.log("ORDER_STATUS_CHANGE", order.getUserId(), "ORDER", orderId,
                currentStatus + " -> " + newStatus);
        return saved;
    }

    @Transactional
    public Order cancelOrder(String orderId) {
        Order order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("Order not found: " + orderId));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Order is already cancelled.");
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new BusinessException("Cannot cancel a delivered order. Use return instead.");
        }

        for (OrderItem item : order.getItems()) {
            productService.restoreStock(item.getProduct().getProductId(), item.getQuantity() - item.getReturnedQuantity());
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        eventService.publishEvent(EventType.ORDER_CANCELLED, orderId, "Order cancelled by user: " + order.getUserId());
        auditLogService.log("ORDER_CANCELLED", order.getUserId(), "ORDER", orderId, "Order cancelled. Stock restored.");
        return saved;
    }

    @Transactional
    public Order returnItems(String orderId, String productId, int returnQuantity) {
        Order order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException("Can only return items from PAID or DELIVERED orders.");
        }

        OrderItem targetItem = order.getItems().stream()
                .filter(item -> item.getProduct().getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Product not found in this order."));

        int returnable = targetItem.getQuantity() - targetItem.getReturnedQuantity();
        if (returnQuantity > returnable) {
            throw new BusinessException("Cannot return more than purchased. Returnable: " + returnable);
        }

        targetItem.setReturnedQuantity(targetItem.getReturnedQuantity() + returnQuantity);
        productService.restoreStock(productId, returnQuantity);

        double refund = targetItem.getPriceAtOrder() * returnQuantity;
        order.setTotalAmount(order.getTotalAmount() - refund);

        Order saved = orderRepository.save(order);
        eventService.publishEvent(EventType.RETURN_INITIATED, orderId,
                "Returned " + returnQuantity + " units of " + productId + ". Refund: Rs." + refund);
        auditLogService.log("RETURN_ITEM", order.getUserId(), "ORDER", orderId,
                "Returned " + returnQuantity + " of " + productId + ". Refund: Rs." + refund);
        return saved;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrder(String orderId) {
        return orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("Order not found: " + orderId));
    }

    public List<Order> getOrdersByUser(String userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }
}
