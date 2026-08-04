package com.smartclinic.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotRequestDto {

    @NotBlank(message = "Message is required.")
    @Size(max = 500, message = "Message must not exceed 500 characters.")
    private String message;

    private Long sessionId;

    @Size(max = 64, message = "Chat access token is invalid.")
    private String accessToken;

    @Size(max = 255, message = "Customer name must not exceed 255 characters.")
    private String customerName;
}
