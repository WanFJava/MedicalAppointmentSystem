package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.*;

public interface AuthService {
    String login(LoginDto loginDto);
    String register(RegisterDto registerDto);
    String verifyRegisterOtp(OtpRequestDto otpRequestDto);
    String resendRegisterOtp(String email);
    String forgotPassword(ForgotPasswordDto forgotPasswordDto);
    String verifyForgotPasswordOtp(OtpRequestDto otpRequestDto);
    String resetPassword(ResetPasswordDto resetPasswordDto);
    String changePassword(String email, ChangePasswordDto changePasswordDto);
}
