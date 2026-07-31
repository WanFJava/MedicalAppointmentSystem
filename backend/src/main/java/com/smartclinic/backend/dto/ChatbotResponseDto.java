package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponseDto {
    private String message;
    private List<String> quickReplies;
    private List<ChatbotActionDto> actions;
    private boolean handoffRequested;
}
