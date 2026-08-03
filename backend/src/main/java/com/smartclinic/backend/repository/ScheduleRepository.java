package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
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
    int countByDoctorIdAndStatusIn(Long doctorId, List<com.smartclinic.backend.entity.ScheduleStatus> statuses);

    @Query("SELECT s FROM Schedule s WHERE (s.date < :currentDate OR (s.date = :currentDate AND s.endTime <= :currentTime)) AND s.status NOT IN :excludedStatuses")
    List<Schedule> findExpiredSchedules(@Param("currentDate") LocalDate currentDate, @Param("currentTime") LocalTime currentTime, @Param("excludedStatuses") List<com.smartclinic.backend.entity.ScheduleStatus> excludedStatuses);
}
