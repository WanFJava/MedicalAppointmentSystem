package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private Long specialtyId;
    private String specialtyName;
    private String degree;
    private Integer experience;
    private BigDecimal consultationFee;
    private String password;
    private BigDecimal averageRating;
    private Integer totalReviews;
    private String biography;
    private com.smartclinic.backend.entity.Status status;
}
