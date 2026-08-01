package com.smartclinic.backend.dto;

import com.smartclinic.backend.entity.LiveChatSenderType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LiveChatMessageDto {
    private Long id;
    private LiveChatSenderType senderType;
    private Long senderId;
    private String senderName;
    private String content;
    private LocalDateTime createdAt;
}
