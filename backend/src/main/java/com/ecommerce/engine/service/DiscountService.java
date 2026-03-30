package com.ecommerce.engine.service;

import com.ecommerce.engine.entity.CartItem;
import com.ecommerce.engine.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class DiscountService {

    public Map<String, Object> calculateDiscount(List<CartItem> cartItems, String couponCode) {
        double subtotal = 0;
        double bulkDiscount = 0;

        for (CartItem item : cartItems) {
            double itemTotal = item.getProduct().getPrice() * item.getQuantity();
            subtotal += itemTotal;
            if (item.getQuantity() > 3) {
                bulkDiscount += itemTotal * 0.05;
            }
        }

        double percentageDiscount = 0;
        if (subtotal > 1000) {
            percentageDiscount = subtotal * 0.10;
        }

        double couponDiscount = 0;
        if (couponCode != null && !couponCode.isEmpty()) {
            switch (couponCode.toUpperCase()) {
                case "SAVE10":
                    couponDiscount = subtotal * 0.10;
                    break;
                case "FLAT200":
                    couponDiscount = 200;
                    break;
                default:
                    throw new BusinessException("Invalid coupon code: " + couponCode);
            }
        }

        double totalDiscount;
        if (couponCode != null && couponCode.equalsIgnoreCase("SAVE10")) {
            totalDiscount = Math.max(percentageDiscount, couponDiscount) + bulkDiscount;
        } else {
            totalDiscount = percentageDiscount + couponDiscount + bulkDiscount;
        }

        totalDiscount = Math.min(totalDiscount, subtotal);
        double finalTotal = subtotal - totalDiscount;

        Map<String, Object> result = new HashMap<>();
        result.put("subtotal", Math.round(subtotal * 100.0) / 100.0);
        result.put("percentageDiscount", Math.round(percentageDiscount * 100.0) / 100.0);
        result.put("bulkDiscount", Math.round(bulkDiscount * 100.0) / 100.0);
        result.put("couponDiscount", Math.round(couponDiscount * 100.0) / 100.0);
        result.put("totalDiscount", Math.round(totalDiscount * 100.0) / 100.0);
        result.put("finalTotal", Math.round(finalTotal * 100.0) / 100.0);
        return result;
    }
}
