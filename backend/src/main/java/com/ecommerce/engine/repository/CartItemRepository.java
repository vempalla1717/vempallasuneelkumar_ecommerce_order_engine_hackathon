package com.ecommerce.engine.repository;

import com.ecommerce.engine.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(String userId);
    Optional<CartItem> findByUserIdAndProductProductId(String userId, String productId);
    void deleteByUserId(String userId);
    List<CartItem> findByExpiresAtBefore(LocalDateTime dateTime);
    void deleteByUserIdAndProductProductId(String userId, String productId);
}
