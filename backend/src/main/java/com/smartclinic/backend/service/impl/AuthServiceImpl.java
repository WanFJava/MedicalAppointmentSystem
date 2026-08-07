package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.*;
import com.smartclinic.backend.entity.*;
import com.smartclinic.backend.repository.OtpRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.security.JwtTokenProvider;
import com.smartclinic.backend.service.AuthService;
import com.smartclinic.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final PatientRepository patientRepository;
    private final OtpRepository otpRepository;
    private final EmailService emailService;

    @Override
    public String login(LoginDto loginDto) {
        try {
            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    loginDto.getEmail(), loginDto.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Reset failed login attempts on successful login
            userRepository.findByEmail(loginDto.getEmail()).ifPresent(user -> {
                if (user.getFailedLoginAttempts() == null || user.getFailedLoginAttempts() > 0) {
                    user.setFailedLoginAttempts(0);
                    userRepository.save(user);
                }
            });

            return jwtTokenProvider.generateToken(authentication);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            // Increment failed login attempts
            userRepository.findByEmail(loginDto.getEmail()).ifPresent(user -> {
                if (user.getStatus() != Status.LOCKED) {
                    int attempts = user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts();
                    attempts++;
                    user.setFailedLoginAttempts(attempts);
                    if (attempts >= 5) {
                        user.setStatus(Status.LOCKED);
                    }
                    userRepository.save(user);
                }
            });
            throw e;
        } catch (org.springframework.security.authentication.DisabledException e) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt. Vui lòng xác minh OTP.");
        } catch (org.springframework.security.authentication.LockedException e) {
            throw new RuntimeException("Tài khoản đã bị khóa do đăng nhập sai nhiều lần.");
        }
    }

    @Override
    public String register(RegisterDto registerDto) {
        // check email exists in database
        if (userRepository.existsByEmail(registerDto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!.");
        }

        // Delete old OTP if exists
        otpRepository.findByEmailAndType(registerDto.getEmail(), OtpType.REGISTER).ifPresent(otpRepository::delete);

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        
        Otp otp = Otp.builder()
                .email(registerDto.getEmail())
                .otpCode(otpCode)
                .type(OtpType.REGISTER)
                .expiryDate(LocalDateTime.now().plusMinutes(5)) // OTP expires in 5 minutes
                .fullName(registerDto.getFullName())
                .password(passwordEncoder.encode(registerDto.getPassword()))
                .phone(registerDto.getPhone())
                .build();
                
        otpRepository.save(otp);
        
        // Send email
        emailService.sendOtpEmail(registerDto.getEmail(), otpCode);

        return "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác minh.";
    }

    @Override
    public String verifyRegisterOtp(OtpRequestDto otpRequestDto) {
        Otp otp = verifyOtp(otpRequestDto.getEmail(), otpRequestDto.getOtpCode(), OtpType.REGISTER);
        
        if (userRepository.existsByEmail(otp.getEmail())) {
            throw new RuntimeException("Tài khoản này đã được tạo trước đó.");
        }

        User user = new User();
        user.setFullName(otp.getFullName());
        user.setEmail(otp.getEmail());
        user.setPassword(otp.getPassword());
        user.setPhone(otp.getPhone());
        user.setRole(Role.PATIENT); 
        user.setStatus(Status.ACTIVE); 
        user.setFailedLoginAttempts(0);

        User savedUser = userRepository.save(user);
        Patient patient = new Patient();
        patient.setUser(savedUser);
        patientRepository.save(patient);
        
        // Remove the OTP after successful registration
        otpRepository.delete(otp);
        
        return "Xác minh thành công. Bạn có thể đăng nhập.";
    }

    @Override
    public String resendRegisterOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Tài khoản đã được đăng ký và kích hoạt.");
        }
        
        Otp otp = otpRepository.findByEmailAndType(email, OtpType.REGISTER)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin đăng ký tạm thời. Vui lòng đăng ký lại."));
                
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        otp.setOtpCode(otpCode);
        otp.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        otpRepository.save(otp);
        
        emailService.sendOtpEmail(email, otpCode);
        return "Mã OTP đã được gửi lại.";
    }

    @Override
    public String forgotPassword(ForgotPasswordDto forgotPasswordDto) {
        User user = userRepository.findByEmail(forgotPasswordDto.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống."));
        sendOtp(user.getEmail(), OtpType.FORGOT_PASSWORD);
        return "Mã OTP đã được gửi đến email của bạn.";
    }

    @Override
    public String verifyForgotPasswordOtp(OtpRequestDto otpRequestDto) {
        verifyOtp(otpRequestDto.getEmail(), otpRequestDto.getOtpCode(), OtpType.FORGOT_PASSWORD);
        return "Xác minh OTP thành công. Vui lòng đặt mật khẩu mới.";
    }

    @Override
    public String resetPassword(ResetPasswordDto resetPasswordDto) {
        verifyOtp(resetPasswordDto.getEmail(), resetPasswordDto.getOtpCode(), OtpType.FORGOT_PASSWORD);
        
        User user = userRepository.findByEmail(resetPasswordDto.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
                
        user.setPassword(passwordEncoder.encode(resetPasswordDto.getNewPassword()));
        user.setFailedLoginAttempts(0);
        if (user.getStatus() == Status.LOCKED) {
            user.setStatus(Status.ACTIVE);
        }
        userRepository.save(user);
        
        // Remove the OTP after successful reset
        otpRepository.findByEmailAndType(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD)
                .ifPresent(otpRepository::delete);
                
        return "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.";
    }

    @Override
    public String changePassword(String email, ChangePasswordDto changePasswordDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
                
        if (!passwordEncoder.matches(changePasswordDto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác.");
        }
        
        user.setPassword(passwordEncoder.encode(changePasswordDto.getNewPassword()));
        userRepository.save(user);
        
        return "Đổi mật khẩu thành công.";
    }

    private void sendOtp(String email, OtpType type) {
        // Delete old OTP if exists
        otpRepository.findByEmailAndType(email, type).ifPresent(otpRepository::delete);

        // Generate 6-digit OTP
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        
        Otp otp = Otp.builder()
                .email(email)
                .otpCode(otpCode)
                .type(type)
                .expiryDate(LocalDateTime.now().plusMinutes(5)) // OTP expires in 5 minutes
                .build();
                
        otpRepository.save(otp);
        
        // Send email
        emailService.sendOtpEmail(email, otpCode);
    }
    
    private Otp verifyOtp(String email, String otpCode, OtpType type) {
        Otp otp = otpRepository.findByEmailAndType(email, type)
                .orElseThrow(() -> new RuntimeException("Mã OTP không hợp lệ."));
                
        if (otp.isExpired()) {
            throw new RuntimeException("Mã OTP đã hết hạn.");
        }
        
        if (!otp.getOtpCode().equals(otpCode)) {
            throw new RuntimeException("Mã OTP không chính xác.");
        }
        
        return otp;
    }
}
