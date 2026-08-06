package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatient_UserIdOrderByIdDesc(Long userId);
    List<Appointment> findByDoctorIdOrderByIdDesc(Long doctorId);
    List<Appointment> findByScheduleId(Long scheduleId);
    boolean existsByScheduleIdAndStatusIn(Long scheduleId, List<com.smartclinic.backend.entity.AppointmentStatus> statuses);
    boolean existsByPatientIdAndScheduleIdAndStatusNotIn(
            Long patientId,
            Long scheduleId,
            List<com.smartclinic.backend.entity.AppointmentStatus> statuses);
    boolean existsByScheduleIdAndExpectedTimeAndStatusNotIn(
            Long scheduleId,
            String expectedTime,
            List<com.smartclinic.backend.entity.AppointmentStatus> statuses);

    @Query("SELECT MAX(a.queueNumber) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.schedule.date = :scheduleDate")
    Integer findMaxQueueNumberForDoctorAndDate(@Param("doctorId") Long doctorId, @Param("scheduleDate") LocalDate scheduleDate);

    Appointment findFirstByDoctorIdAndScheduleDateAndStatusAndExpectedTimeGreaterThanOrderByExpectedTimeAsc(
            Long doctorId,
            LocalDate scheduleDate,
            com.smartclinic.backend.entity.AppointmentStatus status,
            String expectedTime);

    int countByDoctorIdAndStatusIn(Long doctorId, List<com.smartclinic.backend.entity.AppointmentStatus> statuses);
    int countByPatientIdAndStatusIn(Long patientId, List<com.smartclinic.backend.entity.AppointmentStatus> statuses);
}
