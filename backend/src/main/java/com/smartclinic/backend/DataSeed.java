package com.smartclinic.backend;

import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Status;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeed implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- RUNNING DATA SEED ---");
        
        // 1. Seed Receptionist
        if (!userRepository.existsByEmail("receptionist@smartclinic.com")) {
            User receptionist = new User();
            receptionist.setFullName("Lễ Tân 01");
            receptionist.setEmail("receptionist@smartclinic.com");
            receptionist.setPassword(passwordEncoder.encode("123456"));
            receptionist.setPhone("0987654321");
            receptionist.setRole(Role.RECEPTIONIST);
            receptionist.setStatus(Status.ACTIVE);
            userRepository.save(receptionist);
            System.out.println("Seeded Receptionist user: receptionist@smartclinic.com / 123456");
        }
        
        // 2. Note for Doctor
        System.out.println("Note: Doctors can be created in the Admin Dashboard (Doctors Management) by supplying a registered User ID.");
        System.out.println("--- DATA SEED COMPLETED ---");
    }
}
