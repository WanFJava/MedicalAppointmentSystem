package com.smartclinic.backend.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode);
}
