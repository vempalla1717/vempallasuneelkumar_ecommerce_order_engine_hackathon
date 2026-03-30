package com.ecommerce.engine.service;

import com.ecommerce.engine.entity.EventLog;
import com.ecommerce.engine.enums.EventType;
import com.ecommerce.engine.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {
    private final EventLogRepository eventLogRepository;

    public EventLog publishEvent(EventType eventType, String entityId, String details) {
        EventLog event = new EventLog();
        event.setEventType(eventType);
        event.setEntityId(entityId);
        event.setDetails(details);
        event.setProcessed(false);
        event.setFailed(false);
        return eventLogRepository.save(event);
    }

    @Transactional
    public void processEvents() {
        List<EventLog> unprocessed = eventLogRepository.findByProcessedFalseOrderByCreatedAtAsc();
        for (EventLog event : unprocessed) {
            try {
                log.info("Processing event: {} for entity: {}", event.getEventType(), event.getEntityId());
                event.setProcessed(true);
                event.setProcessedAt(LocalDateTime.now());
                eventLogRepository.save(event);
            } catch (Exception e) {
                log.error("Event processing failed for event {}: {}", event.getId(), e.getMessage());
                event.setFailed(true);
                event.setFailureReason(e.getMessage());
                eventLogRepository.save(event);
                break;
            }
        }
    }

    public List<EventLog> getAllEvents() {
        return eventLogRepository.findAllByOrderByCreatedAtDesc();
    }
}
