package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        int maxRetries = 3;
        for (int i = 1; i <= maxRetries; i++) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                
                helper.setFrom(fromEmail, "SmartClinic");
                helper.setTo(toEmail);
                helper.setSubject("Mã OTP xác nhận từ SmartClinic");
                
                // HTML content for better look (optional, but since we use MimeMessage we can use HTML)
                String htmlMsg = "<h3>Chào bạn,</h3>"
                        + "<p>Mã OTP của bạn là: <strong>" + otpCode + "</strong></p>"
                        + "<p>Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>"
                        + "<br><p>Trân trọng,<br>Đội ngũ SmartClinic</p>";
                
                helper.setText(htmlMsg, true); // true indicates HTML
                
                mailSender.send(mimeMessage);
                log.info("OTP email sent successfully to {}", toEmail);
                return; // Success, exit the loop
            } catch (Exception e) {
                log.warn("Attempt {} to send OTP email failed for {}: {}", i, toEmail, e.getMessage());
                if (i == maxRetries) {
                    log.error("Failed to send OTP email after {} attempts.", maxRetries);
                    log.warn(">>> FOR DEVELOPMENT TESTING: OTP Code for {} is {} <<<", toEmail, otpCode);
                    throw new RuntimeException("Lỗi máy chủ: Không thể gửi email OTP. Vui lòng thử lại sau.");
                }
                try {
                    Thread.sleep(1500); // wait 1.5 seconds before retrying
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }
}
