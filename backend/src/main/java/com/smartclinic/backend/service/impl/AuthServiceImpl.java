package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.LoginDto;
import com.smartclinic.backend.dto.RegisterDto;
import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Status;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.security.JwtTokenProvider;
import com.smartclinic.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final PatientRepository patientRepository;

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
        }
    }

    @Override
    public String register(RegisterDto registerDto) {

        // check email exists in database
        if (userRepository.existsByEmail(registerDto.getEmail())) {
            throw new RuntimeException("Email is already exists!.");
        }

        User user = new User();
        user.setFullName(registerDto.getFullName());
        user.setEmail(registerDto.getEmail());
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        user.setPhone(registerDto.getPhone());
        user.setRole(Role.PATIENT); // Default role for registration is Patient
        user.setStatus(Status.ACTIVE); // Default status is Active
        user.setFailedLoginAttempts(0);

        User savedUser = userRepository.save(user);
        Patient patient = new Patient();
        patient.setUser(savedUser);
        patientRepository.save(patient);

        return "User registered successfully!.";
    }
}
