package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByDoctorIdAndDate(Long doctorId, LocalDate date);
    List<Schedule> findByDate(LocalDate date);
    List<Schedule> findByDateOrderByStartTimeAsc(LocalDate date);
    List<Schedule> findByDoctorIdAndDateAndStatus(Long doctorId, LocalDate date, com.smartclinic.backend.entity.ScheduleStatus status);
    List<Schedule> findByDoctorIdAndDateGreaterThanEqualAndStatusOrderByDateAscStartTimeAsc(Long doctorId, LocalDate date, com.smartclinic.backend.entity.ScheduleStatus status);
    List<Schedule> findByDoctorIsNullAndDate(LocalDate date);
    List<Schedule> findByStatusAndDate(com.smartclinic.backend.entity.ScheduleStatus status, LocalDate date);
    List<Schedule> findByDoctorIsNullAndStatusAndDate(com.smartclinic.backend.entity.ScheduleStatus status, LocalDate date);
}
