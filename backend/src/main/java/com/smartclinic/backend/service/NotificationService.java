package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.NotificationDto;

import java.util.List;

public interface NotificationService {
    void sendNotification(Long userId, String message);
    List<NotificationDto> getUserNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markAsRead(Long notificationId);
    void markAllAsRead(Long userId);
}
