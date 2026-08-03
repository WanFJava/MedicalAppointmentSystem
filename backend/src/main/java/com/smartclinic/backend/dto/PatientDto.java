package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PatientDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private LocalDate birthday;
    private String gender;
    private String address;
    private String bloodGroup;
    private String allergy;
}
