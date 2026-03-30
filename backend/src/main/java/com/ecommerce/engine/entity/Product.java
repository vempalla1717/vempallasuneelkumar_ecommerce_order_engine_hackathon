package com.ecommerce.engine.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String productId;

    @Column(nullable = false)
    private String name;

    private String description;

    private String category;

    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private Double price;

    private Double actualPrice;

    @Column(nullable = false)
    private Integer stock;

    @Column(nullable = false)
    @Builder.Default
    private Integer reservedStock = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 5;

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer ratingCount = 0;

    @Version
    private Long version;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public int getAvailableStock() {
        return stock - (reservedStock != null ? reservedStock : 0);
    }
}
