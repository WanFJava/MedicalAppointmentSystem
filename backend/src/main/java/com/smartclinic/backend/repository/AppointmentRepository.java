package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient_UserIdOrderByIdDesc(Long userId);
    List<Appointment> findByDoctorIdOrderByIdDesc(Long doctorId);
    boolean existsByPatientIdAndScheduleIdAndStatusNot(Long patientId, Long scheduleId,
                                                       com.smartclinic.backend.entity.AppointmentStatus status);
}
