package com.smartclinic.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "specialty_id")
    private Specialty specialty;

    private String degree;

    private Integer experience;

    private BigDecimal consultationFee;

    @Column(name = "average_rating")
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "biography", columnDefinition = "NVARCHAR(MAX)")
    private String biography;

    @Column(name = "can_clinic_visit")
    @Builder.Default
    private Boolean canClinicVisit = true;

    @Column(name = "can_home_visit")
    @Builder.Default
    private Boolean canHomeVisit = false;

    @Column(name = "home_visit_radius")
    @Builder.Default
    private Double homeVisitRadius = 0.0;
}
