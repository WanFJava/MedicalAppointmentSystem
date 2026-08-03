package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Complaint> findAllByOrderByCreatedAtDesc();
    boolean existsByAppointmentId(Long appointmentId);
}
