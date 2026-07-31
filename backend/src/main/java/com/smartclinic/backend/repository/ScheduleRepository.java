package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByDoctorIdAndDate(Long doctorId, LocalDate date);
    List<Schedule> findByDoctorIdAndDateAndStatus(Long doctorId, LocalDate date, String status);
    List<Schedule> findByDoctorIdAndDateGreaterThanEqualAndStatusOrderByDateAscStartTimeAsc(Long doctorId, LocalDate date, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select schedule from Schedule schedule where schedule.id = :id")
    Optional<Schedule> findByIdForUpdate(@Param("id") Long id);
}
