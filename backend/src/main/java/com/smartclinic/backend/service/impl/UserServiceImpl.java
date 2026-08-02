package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.UserDto;
import com.smartclinic.backend.entity.Status;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Status;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.UserService;
import com.smartclinic.backend.service.DoctorService;
import com.smartclinic.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DoctorService doctorService;
    private final com.smartclinic.backend.service.PatientService patientService;
    private final NotificationService notificationService;

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto createUser(UserDto userDto) {
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setFullName(userDto.getFullName());
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setPhone(userDto.getPhone());
        user.setRole(userDto.getRole());
        user.setStatus(userDto.getStatus() != null ? userDto.getStatus() : Status.ACTIVE);
        user.setAvatar(userDto.getAvatar());

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    @Override
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setFullName(userDto.getFullName());
        user.setPhone(userDto.getPhone());
        user.setRole(userDto.getRole());
        if (userDto.getStatus() != null && userDto.getStatus() != user.getStatus()) {
            if (user.getRole() == Role.DOCTOR) {
                try {
                    com.smartclinic.backend.dto.DoctorDto doctorDto = doctorService.getDoctorByUserId(user.getId());
                    doctorService.validateDoctorStatusChange(doctorDto.getId(), userDto.getStatus());
                } catch (IllegalArgumentException e) {
                    throw e; // rethrow validation error
                } catch (Exception e) {
                    // ignore if doctor profile not found yet
                }
            } else if (user.getRole() == Role.PATIENT) {
                try {
                    com.smartclinic.backend.dto.PatientDto patientDto = patientService.getPatientProfileByUserId(user.getId());
                    patientService.validatePatientStatusChange(patientDto.getId(), userDto.getStatus());
                } catch (IllegalArgumentException e) {
                    throw e;
                } catch (Exception e) {
                    // ignore if patient profile not found yet
                }
            }
            user.setStatus(userDto.getStatus());
            
            if (userDto.getStatus() == Status.LOCKED) {
                userRepository.findByRole(Role.ADMIN).forEach(admin -> {
                    notificationService.sendNotification(admin.getId(), "Tài khoản của " + user.getFullName() + " (" + user.getEmail() + ") đã bị khóa.");
                });
            }
        }
        if (userDto.getAvatar() != null) {
            user.setAvatar(userDto.getAvatar());
        }

        // Only update password if provided
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        return mapToDto(updatedUser);
    }

    @Override
    public void lockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (user.getRole() == Role.DOCTOR && user.getStatus() != Status.LOCKED) {
            try {
                com.smartclinic.backend.dto.DoctorDto doctorDto = doctorService.getDoctorByUserId(user.getId());
                doctorService.validateDoctorStatusChange(doctorDto.getId(), Status.LOCKED);
            } catch (IllegalArgumentException e) {
                throw e; // rethrow validation error
            } catch (Exception e) {
                // ignore if doctor profile not found yet
            }
        }

        user.setStatus(Status.LOCKED);
        userRepository.save(user);
        
        userRepository.findByRole(Role.ADMIN).forEach(admin -> {
            notificationService.sendNotification(admin.getId(), "Tài khoản của " + user.getFullName() + " (" + user.getEmail() + ") đã bị khóa.");
        });
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
