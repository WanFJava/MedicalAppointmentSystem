package com.smartclinic.backend.service;

import com.smartclinic.backend.entity.Schedule;

import java.time.LocalDateTime;

public final class BookingPolicy {

    public static final long MINIMUM_NOTICE_HOURS = 24;

    private BookingPolicy() {
    }

    public static boolean canBook(Schedule schedule, LocalDateTime now) {
        if (schedule == null || schedule.getDate() == null || schedule.getStartTime() == null) {
            return false;
        }

        LocalDateTime scheduleStart = LocalDateTime.of(
                schedule.getDate(),
                schedule.getStartTime()
        );
        return !scheduleStart.isBefore(now.plusHours(MINIMUM_NOTICE_HOURS));
    }

    public static void requireBookable(Schedule schedule, LocalDateTime now) {
        if (!canBook(schedule, now)) {
            throw new IllegalArgumentException(
                    "Lịch khám phải được đặt trước ít nhất 24 giờ. Vui lòng chọn khung giờ khác."
            );
        }
    }
}
