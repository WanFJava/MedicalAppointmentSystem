package com.smartclinic.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.smartclinic.backend.entity.LiveChatStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LiveChatSessionDto {
    private Long id;
    private String accessToken;
    private Long customerId;
    private String customerName;
    private Long assignedReceptionistId;
    private String assignedReceptionistName;
    private LiveChatStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime closedAt;
    private LocalDateTime lastMessageAt;
    private List<LiveChatMessageDto> messages;
}
