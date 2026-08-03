package com.smartclinic.backend;

import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Status;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataSeed implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo-data.password:}")
    private String demoPassword;

    @Override
    public void run(String... args) throws Exception {
        if (demoPassword == null || demoPassword.isBlank()) {
            throw new IllegalStateException(
                    "app.demo-data.password must be set when demo data is enabled.");
        }
        System.out.println("--- RUNNING DATA SEED ---");

        // 1. Seed Receptionist
        if (!userRepository.existsByEmail("receptionist@smartclinic.com")) {
            User receptionist = new User();
            receptionist.setFullName("Lễ Tân 01");
            receptionist.setEmail("receptionist@smartclinic.com");
            receptionist.setPassword(passwordEncoder.encode(demoPassword));
            receptionist.setPhone("0987654321");
            receptionist.setRole(Role.RECEPTIONIST);
            receptionist.setStatus(Status.ACTIVE);
            userRepository.save(receptionist);
            System.out.println("Seeded demo receptionist user: receptionist@smartclinic.com");
        }

        // 2. Note for Doctor
        System.out.println("Note: Doctors can be created in the Admin Dashboard (Doctors Management) by supplying a registered User ID.");
        System.out.println("--- DATA SEED COMPLETED ---");
    }
}
