package com.ecommerce.engine.repository;

import com.ecommerce.engine.entity.EventLog;
import com.ecommerce.engine.enums.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventLogRepository extends JpaRepository<EventLog, Long> {
    List<EventLog> findByProcessedFalseOrderByCreatedAtAsc();
    List<EventLog> findAllByOrderByCreatedAtDesc();
    List<EventLog> findByEventType(EventType eventType);
}
