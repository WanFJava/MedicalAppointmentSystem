package com.smartclinic.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDate birthday;
    private String gender;
    private String address;
    
    @Column(name = "blood_group")
    private String bloodGroup;
    
    private String allergy;

    @ManyToMany
    @JoinTable(
        name = "favorite_doctors",
        joinColumns = @JoinColumn(name = "patient_id"),
        inverseJoinColumns = @JoinColumn(name = "doctor_id")
    )
    @Builder.Default
    private Set<Doctor> favoriteDoctors = new HashSet<>();
}
