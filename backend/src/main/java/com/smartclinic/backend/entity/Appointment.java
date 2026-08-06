package com.smartclinic.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(columnDefinition = "NVARCHAR(1000)")
    private String symptom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    @Column(name = "queue_number")
    private Integer queueNumber;

    @Column(name = "is_reviewed")
    @Builder.Default
    private Boolean isReviewed = false;

    @Column(name = "note", columnDefinition = "NVARCHAR(255)")
    private String note;

    @Column(name = "is_reminded")
    @Builder.Default
    private Boolean isReminded = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type")
    @Builder.Default
    private VisitType visitType = VisitType.CLINIC;

    @Column(name = "home_address", columnDefinition = "NVARCHAR(255)")
    private String homeAddress;

    @Column(name = "travel_fee")
    private java.math.BigDecimal travelFee;

    @Column(name = "expected_time", columnDefinition = "NVARCHAR(50)")
    private String expectedTime;

    @Column(name = "actual_start_time")
    private java.time.LocalTime actualStartTime;

    @Column(name = "actual_end_time")
    private java.time.LocalTime actualEndTime;
}
