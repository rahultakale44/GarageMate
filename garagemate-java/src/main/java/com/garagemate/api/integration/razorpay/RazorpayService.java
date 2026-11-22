package com.garagemate.api.integration.razorpay;

import com.garagemate.api.exception.ApiException;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * Razorpay integration service.
 * Mirrors Node.js razorpay.ts behavior.
 *
 * Signature verification: HMAC-SHA256(orderId + "|" + paymentId, razorpaySecret)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final RazorpayClient razorpayClient;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    /**
     * Creates a Razorpay order.
     *
     * @param amountInPaise  amount in smallest currency unit (paise for INR)
     * @param receiptId      unique receipt ID (usually our payment DB ID as string)
     */
    public Order createOrder(int amountInPaise, String receiptId) {
        try {
            JSONObject options = new JSONObject();
            options.put("amount", amountInPaise);
            options.put("currency", "INR");
            options.put("receipt", receiptId);
            options.put("payment_capture", 1);

            Order order = razorpayClient.orders.create(options);
            log.info("Razorpay order created: id={} amount={}", order.get("id"), amountInPaise);
            return order;
        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage());
            throw ApiException.internal("Payment order creation failed");
        }
    }

    /**
     * Verifies the Razorpay payment signature.
     *
     * Signature = HMAC-SHA256(orderId + "|" + razorpayPaymentId, keySecret)
     * This matches the Node.js implementation exactly.
     */
    public boolean verifySignature(String orderId, String razorpayPaymentId, String signature) {
        try {
            String payload = orderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(hash);
            boolean valid = expectedSignature.equals(signature);
            if (!valid) {
                log.warn("Razorpay signature mismatch for orderId={}", orderId);
            }
            return valid;
        } catch (Exception e) {
            log.error("Razorpay signature verification error: {}", e.getMessage());
            return false;
        }
    }
}
