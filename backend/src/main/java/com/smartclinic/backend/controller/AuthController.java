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
}
