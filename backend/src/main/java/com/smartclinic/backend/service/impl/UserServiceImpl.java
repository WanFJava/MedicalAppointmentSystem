package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.UserDto;
import com.smartclinic.backend.entity.Status;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.UserService;
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
        if (userDto.getStatus() != null) {
            user.setStatus(userDto.getStatus());
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
        user.setStatus(Status.LOCKED);
        userRepository.save(user);
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
