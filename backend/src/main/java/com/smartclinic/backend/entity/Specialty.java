package com.smartclinic.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "specialties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Specialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @org.hibernate.annotations.Nationalized
    private String name;

    @Column(length = 1000)
    @org.hibernate.annotations.Nationalized
    private String description;
}
