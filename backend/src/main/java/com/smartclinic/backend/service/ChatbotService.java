package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.ChatbotResponseDto;

public interface ChatbotService {
    ChatbotResponseDto reply(String message);
}
