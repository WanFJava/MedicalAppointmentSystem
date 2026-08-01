package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByDoctorIdOrderByIdDesc(Long doctorId);
    List<Feedback> findAllByOrderByCreatedAtDesc();
    Optional<Feedback> findByAppointmentId(Long appointmentId);
}
