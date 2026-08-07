package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Otp;
import com.smartclinic.backend.entity.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findByEmailAndType(String email, OtpType type);
    void deleteByEmailAndType(String email, OtpType type);
}
