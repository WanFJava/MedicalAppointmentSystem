package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.JwtAuthResponse;
import com.smartclinic.backend.dto.LoginDto;
import com.smartclinic.backend.dto.RegisterDto;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final com.smartclinic.backend.repository.ScheduleRepository scheduleRepository;
    private final com.smartclinic.backend.repository.AppointmentRepository appointmentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.web.bind.annotation.GetMapping("/fix-db")
    public ResponseEntity<String> fixDb() {
        try {
            jdbcTemplate.execute("ALTER TABLE medical_records ALTER COLUMN diagnosis NVARCHAR(MAX)");
            jdbcTemplate.execute("ALTER TABLE medical_records ALTER COLUMN doctor_note NVARCHAR(MAX)");
            return ResponseEntity.ok("Database schema fixed");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.GetMapping("/fix-notes")
    public ResponseEntity<String> fixNotes() {
        java.util.List<com.smartclinic.backend.entity.Schedule> schedules = scheduleRepository.findAll();
        for (com.smartclinic.backend.entity.Schedule s : schedules) {
            if ("V\\u1EAFng b\\u00E1c s\\u0129".equals(s.getNote())) {
                s.setNote("Vắng bác sĩ");
                scheduleRepository.save(s);
            }
        }
        java.util.List<com.smartclinic.backend.entity.Appointment> appointments = appointmentRepository.findAll();
        for (com.smartclinic.backend.entity.Appointment a : appointments) {
            if ("V\\u1EAFng b\\u00E1c s\\u0129".equals(a.getNote())) {
                a.setNote("Vắng bác sĩ");
                appointmentRepository.save(a);
            }
        }
        return ResponseEntity.ok("Fixed");
    }

    // Build Login REST API
    @PostMapping("/login")
    public ResponseEntity<JwtAuthResponse> login(@RequestBody LoginDto loginDto) {
        String token = authService.login(loginDto);

        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + loginDto.getEmail()));

        JwtAuthResponse jwtAuthResponse = new JwtAuthResponse();
        jwtAuthResponse.setAccessToken(token);
        jwtAuthResponse.setId(user.getId());
        jwtAuthResponse.setFullName(user.getFullName());
        jwtAuthResponse.setEmail(user.getEmail());
        jwtAuthResponse.setRole(user.getRole());
        jwtAuthResponse.setAvatar(user.getAvatar());

        return ResponseEntity.ok(jwtAuthResponse);
    }

    // Build Register REST API
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterDto registerDto) {
        String response = authService.register(registerDto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody com.smartclinic.backend.dto.OtpRequestDto otpRequestDto) {
        String response = authService.verifyRegisterOtp(otpRequestDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(@RequestBody java.util.Map<String, String> request) {
        String response = authService.resendRegisterOtp(request.get("email"));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody com.smartclinic.backend.dto.ForgotPasswordDto forgotPasswordDto) {
        String response = authService.forgotPassword(forgotPasswordDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-forgot-password-otp")
    public ResponseEntity<String> verifyForgotPasswordOtp(@RequestBody com.smartclinic.backend.dto.OtpRequestDto otpRequestDto) {
        String response = authService.verifyForgotPasswordOtp(otpRequestDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody com.smartclinic.backend.dto.ResetPasswordDto resetPasswordDto) {
        String response = authService.resetPassword(resetPasswordDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody com.smartclinic.backend.dto.ChangePasswordDto changePasswordDto,
            java.security.Principal principal) {
        String response = authService.changePassword(principal.getName(), changePasswordDto);
        return ResponseEntity.ok(response);
    }
}
