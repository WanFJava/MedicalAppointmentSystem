package com.smartclinic.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Otp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String otpCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpType type;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    // Temporary fields for registration
    private String fullName;
    private String password;
    private String phone;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }
}
