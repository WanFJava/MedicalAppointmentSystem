package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.ChatbotRequestDto;
import com.smartclinic.backend.dto.ChatbotResponseDto;

public interface ChatbotService {
    ChatbotResponseDto reply(ChatbotRequestDto request, String authenticatedEmail);
}
