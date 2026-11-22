package com.garagemate.api.integration.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email service — mirrors Node.js emailService.js.
 * Uses Spring Mail (JavaMailSender). All sends are async.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@garagemate.in}")
    private String fromAddress;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Sends a password-reset email with the plain-text reset token.
     * Link format: {frontendUrl}/reset-password?token={plainToken}
     */
    @Async
    public void sendPasswordReset(String toEmail, String plainToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + plainToken;

        String subject = "GarageMate — Reset Your Password";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Password Reset Request</h2>
                  <p>We received a request to reset the password for your GarageMate account.</p>
                  <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                  <p>
                    <a href="%s"
                       style="background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
                      Reset Password
                    </a>
                  </p>
                  <p>Or copy this link:<br><code>%s</code></p>
                  <p>If you did not request this, you can safely ignore this email.</p>
                  <hr>
                  <small>GarageMate — Roadside Assistance Platform</small>
                </body>
                </html>
                """.formatted(resetLink, resetLink);

        sendHtml(toEmail, subject, body);
    }

    /**
     * Sends garage verification status update email.
     */
    @Async
    public void sendGarageVerificationUpdate(String toEmail, String garageName, String status, String reason) {
        String subject = "GarageMate — Garage Verification Update";
        String statusHtml = "APPROVED".equalsIgnoreCase(status)
                ? "<span style='color:green;font-weight:bold;'>APPROVED</span>"
                : "<span style='color:red;font-weight:bold;'>REJECTED</span>";

        String reasonBlock = (reason != null && !reason.isBlank())
                ? "<p><strong>Reason:</strong> " + reason + "</p>"
                : "";

        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Garage Verification Update</h2>
                  <p>Your garage <strong>%s</strong> has been %s.</p>
                  %s
                  <p>Log in to your GarageMate dashboard for more details.</p>
                  <hr>
                  <small>GarageMate — Roadside Assistance Platform</small>
                </body>
                </html>
                """.formatted(garageName, statusHtml, reasonBlock);

        sendHtml(toEmail, subject, body);
    }

    /**
     * Sends a request status update notification to the user.
     */
    @Async
    public void sendRequestStatusUpdate(String toEmail, String userName, String requestId, String status) {
        String subject = "GarageMate — Your Assistance Request Update";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Request Status Update</h2>
                  <p>Hi %s,</p>
                  <p>Your assistance request (<code>%s</code>) status has been updated to:
                     <strong>%s</strong></p>
                  <p>
                    <a href="%s/requests/%s"
                       style="background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
                      View Request
                    </a>
                  </p>
                  <hr>
                  <small>GarageMate — Roadside Assistance Platform</small>
                </body>
                </html>
                """.formatted(userName, requestId, status, frontendUrl, requestId);

        sendHtml(toEmail, subject, body);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} — subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
