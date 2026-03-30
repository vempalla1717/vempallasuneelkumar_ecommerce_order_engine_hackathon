package com.ecommerce.engine.service;

import com.ecommerce.engine.entity.CartItem;
import com.ecommerce.engine.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationExpiryService {
    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final AuditLogService auditLogService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireReservations() {
        List<CartItem> expired = cartItemRepository.findByExpiresAtBefore(LocalDateTime.now());
        for (CartItem item : expired) {
            log.info("Expiring reservation for user {} product {} qty {}",
                    item.getUserId(), item.getProduct().getProductId(), item.getQuantity());
            productService.releaseStock(item.getProduct().getProductId(), item.getQuantity());
            auditLogService.log("RESERVATION_EXPIRED", item.getUserId(), "CART",
                    item.getProduct().getProductId(),
                    "Reservation expired. Released " + item.getQuantity() + " units.");
            cartItemRepository.delete(item);
        }
        if (!expired.isEmpty()) {
            log.info("Expired {} cart reservations", expired.size());
        }
    }
}
