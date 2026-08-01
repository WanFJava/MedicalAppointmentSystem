package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.LiveChatCreateRequestDto;
import com.smartclinic.backend.dto.LiveChatMessageRequestDto;
import com.smartclinic.backend.dto.LiveChatSessionDto;
import com.smartclinic.backend.service.LiveChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/live-chat/customer/sessions")
@RequiredArgsConstructor
public class CustomerLiveChatController {

    private static final String CHAT_TOKEN_HEADER = "X-Chat-Token";

    private final LiveChatService liveChatService;

    @PostMapping
    public ResponseEntity<LiveChatSessionDto> createSession(
            @Valid @RequestBody LiveChatCreateRequestDto request,
            Authentication authentication) {
        String email = authentication == null ? null : authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(liveChatService.createCustomerSession(request, email));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<LiveChatSessionDto> getSession(
            @PathVariable Long sessionId,
            @RequestHeader(CHAT_TOKEN_HEADER) String accessToken) {
        return ResponseEntity.ok(
                liveChatService.getCustomerSession(sessionId, accessToken));
    }

    @PostMapping("/{sessionId}/messages")
    public ResponseEntity<LiveChatSessionDto> sendMessage(
            @PathVariable Long sessionId,
            @RequestHeader(CHAT_TOKEN_HEADER) String accessToken,
            @Valid @RequestBody LiveChatMessageRequestDto request) {
        return ResponseEntity.ok(
                liveChatService.sendCustomerMessage(sessionId, accessToken, request));
    }

    @PutMapping("/{sessionId}/close")
    public ResponseEntity<LiveChatSessionDto> closeSession(
            @PathVariable Long sessionId,
            @RequestHeader(CHAT_TOKEN_HEADER) String accessToken) {
        return ResponseEntity.ok(
                liveChatService.closeCustomerSession(sessionId, accessToken));
    }
}
