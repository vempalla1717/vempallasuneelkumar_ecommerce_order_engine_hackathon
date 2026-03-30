package com.ecommerce.engine.config;

import com.ecommerce.engine.entity.Product;
import com.ecommerce.engine.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            log.info("Products already exist. Skipping seed data.");
            return;
        }

        log.info("Seeding sample products...");

        productRepository.save(Product.builder()
                .productId("PRDT_001").name("iPhone 15 Pro Max").category("Electronics")
                .description("Apple iPhone 15 Pro Max 256GB - Natural Titanium with A17 Pro chip")
                .imageUrl("https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop")
                .actualPrice(159900.00).price(139999.00).stock(25).reservedStock(0)
                .lowStockThreshold(5).rating(4.7).ratingCount(2834).build());

        productRepository.save(Product.builder()
                .productId("PRDT_002").name("Samsung Galaxy S24 Ultra").category("Electronics")
                .description("Samsung Galaxy S24 Ultra 5G 256GB with S Pen and AI features")
                .imageUrl("https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop")
                .actualPrice(134999.00).price(119999.00).stock(30).reservedStock(0)
                .lowStockThreshold(5).rating(4.5).ratingCount(1956).build());

        productRepository.save(Product.builder()
                .productId("PRDT_003").name("Sony WH-1000XM5 Headphones").category("Audio")
                .description("Industry-leading noise canceling wireless headphones with 30hr battery")
                .imageUrl("https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop")
                .actualPrice(34990.00).price(24990.00).stock(50).reservedStock(0)
                .lowStockThreshold(10).rating(4.6).ratingCount(4521).build());

        productRepository.save(Product.builder()
                .productId("PRDT_004").name("MacBook Air M3 15-inch").category("Laptops")
                .description("Apple MacBook Air with M3 chip, 16GB RAM, 512GB SSD - Midnight")
                .imageUrl("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop")
                .actualPrice(154900.00).price(134900.00).stock(15).reservedStock(0)
                .lowStockThreshold(3).rating(4.8).ratingCount(1247).build());

        productRepository.save(Product.builder()
                .productId("PRDT_005").name("Nike Air Max 270 React").category("Footwear")
                .description("Men's running shoes with Air Max cushioning and React foam")
                .imageUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop")
                .actualPrice(14995.00).price(8997.00).stock(100).reservedStock(0)
                .lowStockThreshold(15).rating(4.3).ratingCount(3678).build());

        productRepository.save(Product.builder()
                .productId("PRDT_006").name("Levi's 511 Slim Fit Jeans").category("Clothing")
                .description("Classic slim fit stretch denim jeans in dark indigo wash")
                .imageUrl("https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop")
                .actualPrice(4599.00).price(2799.00).stock(200).reservedStock(0)
                .lowStockThreshold(20).rating(4.2).ratingCount(5643).build());

        productRepository.save(Product.builder()
                .productId("PRDT_007").name("Instant Pot Duo 7-in-1").category("Kitchen")
                .description("Electric pressure cooker, slow cooker, rice cooker - 6 Quart")
                .imageUrl("https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop")
                .actualPrice(12995.00).price(8499.00).stock(40).reservedStock(0)
                .lowStockThreshold(8).rating(4.4).ratingCount(8921).build());

        productRepository.save(Product.builder()
                .productId("PRDT_008").name("Kindle Paperwhite 11th Gen").category("Electronics")
                .description("6.8-inch display, adjustable warm light, 16GB, waterproof")
                .imageUrl("https://images.unsplash.com/photo-1594980596870-8aa52a78d8a4?w=400&h=400&fit=crop")
                .actualPrice(16999.00).price(13999.00).stock(60).reservedStock(0)
                .lowStockThreshold(10).rating(4.6).ratingCount(6234).build());

        productRepository.save(Product.builder()
                .productId("PRDT_009").name("PlayStation 5 Digital Edition").category("Gaming")
                .description("Next-gen gaming console with DualSense controller and 825GB SSD")
                .imageUrl("https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop")
                .actualPrice(49990.00).price(44990.00).stock(10).reservedStock(0)
                .lowStockThreshold(3).rating(4.8).ratingCount(3456).build());

        productRepository.save(Product.builder()
                .productId("PRDT_010").name("Canon EOS R50 Camera").category("Camera")
                .description("Mirrorless camera with RF-S 18-45mm lens, 4K video, 24.2MP")
                .imageUrl("https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop")
                .actualPrice(74995.00).price(62995.00).stock(20).reservedStock(0)
                .lowStockThreshold(5).rating(4.5).ratingCount(892).build());

        productRepository.save(Product.builder()
                .productId("PRDT_011").name("boAt Rockerz 450 Headphones").category("Audio")
                .description("Wireless bluetooth on-ear headphones with 40mm drivers, 15hr battery")
                .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop")
                .actualPrice(3990.00).price(1299.00).stock(150).reservedStock(0)
                .lowStockThreshold(20).rating(4.1).ratingCount(12543).build());

        productRepository.save(Product.builder()
                .productId("PRDT_012").name("Adidas Ultraboost Light").category("Footwear")
                .description("Premium running shoes with Boost midsole and Primeknit upper")
                .imageUrl("https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop")
                .actualPrice(17999.00).price(12599.00).stock(75).reservedStock(0)
                .lowStockThreshold(10).rating(4.4).ratingCount(2341).build());

        productRepository.save(Product.builder()
                .productId("PRDT_013").name("Samsung 55\" Crystal 4K TV").category("Electronics")
                .description("55-inch Crystal UHD 4K Smart TV with HDR and Tizen OS")
                .imageUrl("https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop")
                .actualPrice(64990.00).price(42990.00).stock(12).reservedStock(0)
                .lowStockThreshold(3).rating(4.3).ratingCount(4567).build());

        productRepository.save(Product.builder()
                .productId("PRDT_014").name("The Alchemist - Paulo Coelho").category("Books")
                .description("International bestseller - a magical fable about following your dreams")
                .imageUrl("https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop")
                .actualPrice(350.00).price(199.00).stock(500).reservedStock(0)
                .lowStockThreshold(50).rating(4.5).ratingCount(34521).build());

        productRepository.save(Product.builder()
                .productId("PRDT_015").name("Apple Watch Series 9").category("Wearables")
                .description("GPS 45mm with always-on Retina display, blood oxygen, ECG app")
                .imageUrl("https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop")
                .actualPrice(49900.00).price(41900.00).stock(35).reservedStock(0)
                .lowStockThreshold(5).rating(4.6).ratingCount(1876).build());

        log.info("Seeded 15 sample products successfully!");
    }
}
