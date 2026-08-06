package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleRequestDto {
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer maxPatient;
    private com.smartclinic.backend.entity.ScheduleType scheduleType;
    private Boolean forceAssign;
}
