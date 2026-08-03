package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.LiveChatCreateRequestDto;
import com.smartclinic.backend.dto.LiveChatMessageRequestDto;
import com.smartclinic.backend.dto.LiveChatSessionDto;

import java.util.List;

public interface LiveChatService {

    LiveChatSessionDto createCustomerSession(
            LiveChatCreateRequestDto request,
            String authenticatedEmail);

    LiveChatSessionDto getCustomerSession(Long sessionId, String accessToken);

    LiveChatSessionDto sendCustomerMessage(
            Long sessionId,
            String accessToken,
            LiveChatMessageRequestDto request);

    LiveChatSessionDto closeCustomerSession(Long sessionId, String accessToken);

    List<LiveChatSessionDto> getReceptionistSessions(boolean includeClosed);

    LiveChatSessionDto getReceptionistSession(Long sessionId);

    LiveChatSessionDto claimSession(Long sessionId, String receptionistEmail);

    LiveChatSessionDto sendReceptionistMessage(
            Long sessionId,
            String receptionistEmail,
            LiveChatMessageRequestDto request);

    LiveChatSessionDto closeReceptionistSession(Long sessionId, String receptionistEmail);
}
