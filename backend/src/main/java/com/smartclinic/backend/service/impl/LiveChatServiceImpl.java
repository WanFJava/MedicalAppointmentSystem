package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.LiveChatCreateRequestDto;
import com.smartclinic.backend.dto.LiveChatMessageDto;
import com.smartclinic.backend.dto.LiveChatMessageRequestDto;
import com.smartclinic.backend.dto.LiveChatSessionDto;
import com.smartclinic.backend.entity.*;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.LiveChatMessageRepository;
import com.smartclinic.backend.repository.LiveChatSessionRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.LiveChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class LiveChatServiceImpl implements LiveChatService {

    private final LiveChatSessionRepository sessionRepository;
    private final LiveChatMessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    public LiveChatSessionDto createCustomerSession(
            LiveChatCreateRequestDto request,
            String authenticatedEmail) {
        User customer = findPatient(authenticatedEmail);
        String customerName = customer != null
                ? customer.getFullName()
                : normalizeCustomerName(request.getCustomerName());
        LocalDateTime now = LocalDateTime.now();

        LiveChatSession session = LiveChatSession.builder()
                .accessToken(UUID.randomUUID().toString())
                .customer(customer)
                .customerName(customerName)
                .status(LiveChatStatus.WAITING)
                .createdAt(now)
                .lastMessageAt(now)
                .build();
        session = sessionRepository.save(session);

        saveMessage(
                session,
                LiveChatSenderType.CUSTOMER,
                customer,
                request.getInitialMessage().trim(),
                now
        );
        saveMessage(
                session,
                LiveChatSenderType.SYSTEM,
                null,
                "Yêu cầu đã được gửi. Vui lòng chờ lễ tân tiếp nhận.",
                now.plusNanos(1)
        );

        return toDto(session, true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public LiveChatSessionDto getCustomerSession(Long sessionId, String accessToken) {
        LiveChatSession session = getSession(sessionId);
        verifyCustomerAccess(session, accessToken);
        return toDto(session, true, true);
    }

    @Override
    public LiveChatSessionDto sendCustomerMessage(
            Long sessionId,
            String accessToken,
            LiveChatMessageRequestDto request) {
        LiveChatSession session = getSessionForUpdate(sessionId);
        verifyCustomerAccess(session, accessToken);
        ensureOpen(session);

        LocalDateTime now = LocalDateTime.now();
        saveMessage(
                session,
                LiveChatSenderType.CUSTOMER,
                session.getCustomer(),
                request.getContent().trim(),
                now
        );
        session.setLastMessageAt(now);
        sessionRepository.save(session);
        return toDto(session, true, true);
    }

    @Override
    public LiveChatSessionDto closeCustomerSession(Long sessionId, String accessToken) {
        LiveChatSession session = getSessionForUpdate(sessionId);
        verifyCustomerAccess(session, accessToken);
        closeSession(session, "Khách hàng đã kết thúc cuộc trò chuyện.");
        return toDto(session, true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LiveChatSessionDto> getReceptionistSessions(boolean includeClosed) {
        List<LiveChatSession> sessions = includeClosed
                ? sessionRepository.findAllByOrderByLastMessageAtDesc()
                : sessionRepository.findByStatusInOrderByLastMessageAtDesc(
                        List.of(LiveChatStatus.WAITING, LiveChatStatus.ACTIVE));
        return sessions.stream()
                .map(session -> toDto(session, false, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public LiveChatSessionDto getReceptionistSession(Long sessionId) {
        return toDto(getSession(sessionId), false, true);
    }

    @Override
    public LiveChatSessionDto claimSession(Long sessionId, String receptionistEmail) {
        User receptionist = getStaffUser(receptionistEmail);
        LiveChatSession session = getSessionForUpdate(sessionId);
        claimForStaff(session, receptionist);
        return toDto(session, false, true);
    }

    @Override
    public LiveChatSessionDto sendReceptionistMessage(
            Long sessionId,
            String receptionistEmail,
            LiveChatMessageRequestDto request) {
        User receptionist = getStaffUser(receptionistEmail);
        LiveChatSession session = getSessionForUpdate(sessionId);
        ensureOpen(session);
        claimForStaff(session, receptionist);

        LocalDateTime now = LocalDateTime.now();
        saveMessage(
                session,
                LiveChatSenderType.RECEPTIONIST,
                receptionist,
                request.getContent().trim(),
                now
        );
        session.setLastMessageAt(now);
        sessionRepository.save(session);
        return toDto(session, false, true);
    }

    @Override
    public LiveChatSessionDto closeReceptionistSession(Long sessionId, String receptionistEmail) {
        User receptionist = getStaffUser(receptionistEmail);
        LiveChatSession session = getSessionForUpdate(sessionId);
        ensureStaffCanManage(session, receptionist);
        closeSession(
                session,
                "Lễ tân " + receptionist.getFullName() + " đã kết thúc cuộc trò chuyện."
        );
        return toDto(session, false, true);
    }

    private void claimForStaff(LiveChatSession session, User staff) {
        ensureOpen(session);
        if (session.getAssignedReceptionist() == null) {
            LocalDateTime now = LocalDateTime.now();
            session.setAssignedReceptionist(staff);
            session.setStatus(LiveChatStatus.ACTIVE);
            session.setAcceptedAt(now);
            session.setLastMessageAt(now);
            sessionRepository.save(session);
            saveMessage(
                    session,
                    LiveChatSenderType.SYSTEM,
                    null,
                    "Lễ tân " + staff.getFullName() + " đã tham gia cuộc trò chuyện.",
                    now
            );
            return;
        }
        ensureStaffCanManage(session, staff);
    }

    private void ensureStaffCanManage(LiveChatSession session, User staff) {
        User assigned = session.getAssignedReceptionist();
        boolean isAdmin = staff.getRole() == Role.ADMIN;
        if (assigned != null && !assigned.getId().equals(staff.getId()) && !isAdmin) {
            throw new AccessDeniedException(
                    "Phiên chat đang được " + assigned.getFullName() + " phụ trách.");
        }
    }

    private void closeSession(LiveChatSession session, String systemMessage) {
        if (session.getStatus() == LiveChatStatus.CLOSED) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        session.setStatus(LiveChatStatus.CLOSED);
        session.setClosedAt(now);
        session.setLastMessageAt(now);
        sessionRepository.save(session);
        saveMessage(session, LiveChatSenderType.SYSTEM, null, systemMessage, now);
    }

    private LiveChatMessage saveMessage(
            LiveChatSession session,
            LiveChatSenderType senderType,
            User sender,
            String content,
            LocalDateTime createdAt) {
        LiveChatMessage message = LiveChatMessage.builder()
                .session(session)
                .senderType(senderType)
                .sender(sender)
                .content(content)
                .createdAt(createdAt)
                .build();
        return messageRepository.save(message);
    }

    private LiveChatSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Live chat session", "id", sessionId));
    }

    private LiveChatSession getSessionForUpdate(Long sessionId) {
        return sessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Live chat session", "id", sessionId));
    }

    private User findPatient(String email) {
        if (!StringUtils.hasText(email) || "anonymousUser".equals(email)) {
            return null;
        }
        return userRepository.findByEmail(email)
                .filter(user -> user.getRole() == Role.PATIENT)
                .orElse(null);
    }

    private User getStaffUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Tài khoản lễ tân không tồn tại."));
        if (user.getRole() != Role.RECEPTIONIST && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Bạn không có quyền xử lý chat trực tiếp.");
        }
        return user;
    }

    private String normalizeCustomerName(String requestedName) {
        if (!StringUtils.hasText(requestedName)) {
            return "Khách hàng";
        }
        return requestedName.trim();
    }

    private void verifyCustomerAccess(LiveChatSession session, String accessToken) {
        if (!StringUtils.hasText(accessToken)) {
            throw new AccessDeniedException("Thiếu mã truy cập phiên chat.");
        }
        boolean matches = MessageDigest.isEqual(
                session.getAccessToken().getBytes(StandardCharsets.UTF_8),
                accessToken.getBytes(StandardCharsets.UTF_8)
        );
        if (!matches) {
            throw new AccessDeniedException("Mã truy cập phiên chat không hợp lệ.");
        }
    }

    private void ensureOpen(LiveChatSession session) {
        if (session.getStatus() == LiveChatStatus.CLOSED) {
            throw new IllegalArgumentException("Phiên chat đã kết thúc.");
        }
    }

    private LiveChatSessionDto toDto(
            LiveChatSession session,
            boolean includeAccessToken,
            boolean includeMessages) {
        User customer = session.getCustomer();
        User receptionist = session.getAssignedReceptionist();
        List<LiveChatMessageDto> messages = includeMessages
                ? messageRepository.findBySessionIdOrderByCreatedAtAscIdAsc(session.getId())
                    .stream()
                    .map(message -> toMessageDto(message, session))
                    .toList()
                : null;

        return new LiveChatSessionDto(
                session.getId(),
                includeAccessToken ? session.getAccessToken() : null,
                customer == null ? null : customer.getId(),
                session.getCustomerName(),
                receptionist == null ? null : receptionist.getId(),
                receptionist == null ? null : receptionist.getFullName(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getAcceptedAt(),
                session.getClosedAt(),
                session.getLastMessageAt(),
                messages
        );
    }

    private LiveChatMessageDto toMessageDto(
            LiveChatMessage message,
            LiveChatSession session) {
        User sender = message.getSender();
        String senderName = switch (message.getSenderType()) {
            case CUSTOMER -> session.getCustomerName();
            case RECEPTIONIST -> sender == null ? "Lễ tân" : sender.getFullName();
            case SYSTEM -> "Hệ thống";
        };
        return new LiveChatMessageDto(
                message.getId(),
                message.getSenderType(),
                sender == null ? null : sender.getId(),
                senderName,
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
