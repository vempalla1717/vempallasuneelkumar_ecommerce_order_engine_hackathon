package com.ecommerce.engine.repository;

import com.ecommerce.engine.entity.Order;
import com.ecommerce.engine.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderId(String orderId);
    List<Order> findByUserId(String userId);
    List<Order> findByStatus(OrderStatus status);
    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.userId = :userId AND o.createdAt > :since")
    long countRecentOrdersByUser(@Param("userId") String userId, @Param("since") LocalDateTime since);

    @Query("SELECT o FROM Order o WHERE o.userId = :userId AND o.status IN :statuses")
    List<Order> findByUserIdAndStatusIn(@Param("userId") String userId, @Param("statuses") List<OrderStatus> statuses);
}
