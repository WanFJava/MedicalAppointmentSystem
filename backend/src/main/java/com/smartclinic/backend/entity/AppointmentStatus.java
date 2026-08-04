package com.smartclinic.backend.entity;

public enum AppointmentStatus {
    PENDING,
    PENDING_CONFIRMATION,
    DECLINED,
    CONFIRMED,
    ON_THE_WAY,
    ARRIVED,
    CHECKED_IN,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED_BY_PATIENT,
    CANCELLED_BY_DOCTOR,
    NO_SHOW,
    NO_SHOW_BY_DOCTOR
}
