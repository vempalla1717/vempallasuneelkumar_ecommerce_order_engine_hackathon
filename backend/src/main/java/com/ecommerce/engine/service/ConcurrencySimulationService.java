package com.ecommerce.engine.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConcurrencySimulationService {
    private final CartService cartService;

    public Map<String, Object> simulateConcurrentAddToCart(String productId, int quantity, int numberOfUsers) {
        ExecutorService executor = Executors.newFixedThreadPool(numberOfUsers);
        List<Future<Map<String, Object>>> futures = new ArrayList<>();
        List<Map<String, Object>> results = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < numberOfUsers; i++) {
            String userId = "CONCURRENT_USER_" + (i + 1);
            futures.add(executor.submit(() -> {
                Map<String, Object> result = new HashMap<>();
                result.put("userId", userId);
                try {
                    cartService.addToCart(userId, productId, quantity);
                    result.put("success", true);
                    result.put("message", "Successfully added " + quantity + " items to cart");
                } catch (Exception e) {
                    result.put("success", false);
                    result.put("message", e.getMessage());
                }
                return result;
            }));
        }

        for (Future<Map<String, Object>> future : futures) {
            try {
                results.add(future.get(10, TimeUnit.SECONDS));
            } catch (Exception e) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Timeout or error: " + e.getMessage());
                results.add(error);
            }
        }
        executor.shutdown();

        long successCount = results.stream().filter(r -> (boolean) r.get("success")).count();
        long failCount = results.stream().filter(r -> !(boolean) r.get("success")).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("productId", productId);
        summary.put("requestedQuantityPerUser", quantity);
        summary.put("totalUsers", numberOfUsers);
        summary.put("successfulUsers", successCount);
        summary.put("failedUsers", failCount);
        summary.put("details", results);
        return summary;
    }
}
