package com.ecommerce.engine.service;

import com.ecommerce.engine.entity.Product;
import com.ecommerce.engine.enums.EventType;
import com.ecommerce.engine.exception.BusinessException;
import com.ecommerce.engine.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final AuditLogService auditLogService;
    private final EventService eventService;

    @Transactional
    public Product addProduct(Product product) {
        if (product.getStock() != null && product.getStock() < 0) {
            throw new BusinessException("Stock cannot be negative.");
        }
        // Auto-generate productId as PRDT_001, PRDT_002, etc.
        if (product.getProductId() == null || product.getProductId().isEmpty()) {
            long nextNum = productRepository.count() + 1;
            String productId = String.format("PRDT_%03d", nextNum);
            while (productRepository.existsByProductId(productId)) {
                nextNum++;
                productId = String.format("PRDT_%03d", nextNum);
            }
            product.setProductId(productId);
        } else if (productRepository.existsByProductId(product.getProductId())) {
            throw new BusinessException("Product ID '" + product.getProductId() + "' already exists.");
        }
        if (product.getReservedStock() == null) product.setReservedStock(0);
        if (product.getLowStockThreshold() == null) product.setLowStockThreshold(5);
        Product saved = productRepository.save(product);
        auditLogService.log("ADD_PRODUCT", "SYSTEM", "PRODUCT", saved.getProductId(),
                "Added product: " + saved.getName() + " with stock: " + saved.getStock());
        eventService.publishEvent(EventType.INVENTORY_UPDATED, saved.getProductId(),
                "Product added with stock: " + saved.getStock());
        return saved;
    }

    @Transactional
    public Product updateStock(String productId, int newStock) {
        if (newStock < 0) {
            throw new BusinessException("Stock cannot be negative.");
        }
        Product product = productRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));
        int oldStock = product.getStock();
        product.setStock(newStock);
        Product saved = productRepository.save(product);
        auditLogService.log("UPDATE_STOCK", "SYSTEM", "PRODUCT", productId,
                "Stock updated from " + oldStock + " to " + newStock);
        eventService.publishEvent(EventType.INVENTORY_UPDATED, productId,
                "Stock updated from " + oldStock + " to " + newStock);
        return saved;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProduct(String productId) {
        return productRepository.findByProductId(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    public List<Product> getOutOfStockProducts() {
        return productRepository.findOutOfStockProducts();
    }

    @Transactional
    public Product reserveStock(String productId, int quantity) {
        Product product = productRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));
        int available = product.getAvailableStock();
        if (quantity > available) {
            throw new BusinessException("Insufficient stock. Available: " + available + ", Requested: " + quantity);
        }
        product.setReservedStock(product.getReservedStock() + quantity);
        Product saved = productRepository.save(product);
        eventService.publishEvent(EventType.STOCK_RESERVED, productId,
                "Reserved " + quantity + " units. Available: " + saved.getAvailableStock());
        return saved;
    }

    @Transactional
    public Product releaseStock(String productId, int quantity) {
        Product product = productRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));
        product.setReservedStock(Math.max(0, product.getReservedStock() - quantity));
        Product saved = productRepository.save(product);
        eventService.publishEvent(EventType.STOCK_RELEASED, productId,
                "Released " + quantity + " units. Available: " + saved.getAvailableStock());
        return saved;
    }

    @Transactional
    public Product deductStock(String productId, int quantity) {
        Product product = productRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));
        if (product.getStock() < quantity) {
            throw new BusinessException("Insufficient stock for deduction.");
        }
        product.setStock(product.getStock() - quantity);
        product.setReservedStock(Math.max(0, product.getReservedStock() - quantity));
        return productRepository.save(product);
    }

    @Transactional
    public Product restoreStock(String productId, int quantity) {
        Product product = productRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new BusinessException("Product not found: " + productId));
        product.setStock(product.getStock() + quantity);
        return productRepository.save(product);
    }
}
