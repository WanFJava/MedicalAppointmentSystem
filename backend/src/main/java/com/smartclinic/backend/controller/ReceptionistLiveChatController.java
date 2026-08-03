package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.LiveChatMessageRequestDto;
import com.smartclinic.backend.dto.LiveChatSessionDto;
import com.smartclinic.backend.service.LiveChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/live-chat/receptionist/sessions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
public class ReceptionistLiveChatController {

    private final LiveChatService liveChatService;

    @GetMapping
    public ResponseEntity<List<LiveChatSessionDto>> getSessions(
            @RequestParam(defaultValue = "false") boolean includeClosed) {
        return ResponseEntity.ok(
                liveChatService.getReceptionistSessions(includeClosed));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<LiveChatSessionDto> getSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(
                liveChatService.getReceptionistSession(sessionId));
    }

    @PutMapping("/{sessionId}/claim")
    public ResponseEntity<LiveChatSessionDto> claimSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        return ResponseEntity.ok(
                liveChatService.claimSession(sessionId, authentication.getName()));
    }

    @PostMapping("/{sessionId}/messages")
    public ResponseEntity<LiveChatSessionDto> sendMessage(
            @PathVariable Long sessionId,
            Authentication authentication,
            @Valid @RequestBody LiveChatMessageRequestDto request) {
        return ResponseEntity.ok(
                liveChatService.sendReceptionistMessage(
                        sessionId,
                        authentication.getName(),
                        request));
    }

    @PutMapping("/{sessionId}/close")
    public ResponseEntity<LiveChatSessionDto> closeSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        return ResponseEntity.ok(
                liveChatService.closeReceptionistSession(
                        sessionId,
                        authentication.getName()));
    }
}
