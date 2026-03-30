package com.ecommerce.engine.entity;

import com.ecommerce.engine.enums.EventType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    private String entityId;

    @Column(length = 2000)
    private String details;

    @Builder.Default
    private Boolean processed = false;

    @Builder.Default
    private Boolean failed = false;

    @Column(length = 1000)
    private String failureReason;

    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
