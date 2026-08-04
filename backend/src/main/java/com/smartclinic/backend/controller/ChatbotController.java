package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.ChatbotRequestDto;
import com.smartclinic.backend.dto.ChatbotResponseDto;
import com.smartclinic.backend.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/messages")
    public ResponseEntity<ChatbotResponseDto> sendMessage(
            @Valid @RequestBody ChatbotRequestDto request,
            Authentication authentication) {
        String email = authentication == null ? null : authentication.getName();
        return ResponseEntity.ok(chatbotService.reply(request, email));
    }
}
