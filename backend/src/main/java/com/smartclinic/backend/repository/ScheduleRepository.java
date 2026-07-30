package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByDoctorIdAndDate(Long doctorId, LocalDate date);
    List<Schedule> findByDoctorIdAndDateAndStatus(Long doctorId, LocalDate date, com.smartclinic.backend.entity.ScheduleStatus status);
    List<Schedule> findByDoctorIdAndDateGreaterThanEqualAndStatusOrderByDateAscStartTimeAsc(Long doctorId, LocalDate date, com.smartclinic.backend.entity.ScheduleStatus status);
}
