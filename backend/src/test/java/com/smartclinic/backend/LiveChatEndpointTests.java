package com.smartclinic.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartclinic.backend.repository.LiveChatMessageRepository;
import com.smartclinic.backend.repository.LiveChatSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LiveChatEndpointTests {

    private static final String CHAT_TOKEN_HEADER = "X-Chat-Token";

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private LiveChatMessageRepository messageRepository;

    @Autowired
    private LiveChatSessionRepository sessionRepository;

    @BeforeEach
    void cleanLiveChats() {
        messageRepository.deleteAll();
        sessionRepository.deleteAll();
    }

    @Test
    void anonymousCustomerCanCreateAndContinueLiveChat() throws Exception {
        CreatedSession session = createAnonymousSession();

        mockMvc.perform(post("/api/live-chat/customer/sessions/{id}/messages", session.id())
                        .header(CHAT_TOKEN_HEADER, session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Tôi cần hỗ trợ đặt lịch ngày mai"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.messages", hasSize(3)))
                .andExpect(jsonPath("$.messages[2].senderType").value("CUSTOMER"));

        mockMvc.perform(get("/api/live-chat/customer/sessions/{id}", session.id())
                        .header(CHAT_TOKEN_HEADER, session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerName").value("Khách kiểm thử"))
                .andExpect(jsonPath("$.accessToken", not(blankOrNullString())));
    }

    @Test
    void customerCannotReadSessionWithWrongToken() throws Exception {
        CreatedSession session = createAnonymousSession();

        mockMvc.perform(get("/api/live-chat/customer/sessions/{id}", session.id())
                        .header(CHAT_TOKEN_HEADER, "wrong-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousUserCannotOpenReceptionistQueue() throws Exception {
        mockMvc.perform(get("/api/live-chat/receptionist/sessions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(
            username = "receptionist@smartclinic.com",
            roles = "RECEPTIONIST"
    )
    void receptionistCanClaimAndReplyToWaitingCustomer() throws Exception {
        CreatedSession session = createAnonymousSession();

        mockMvc.perform(put("/api/live-chat/receptionist/sessions/{id}/claim", session.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.assignedReceptionistName").value("Lễ Tân 01"))
                .andExpect(jsonPath("$.messages", hasSize(3)));

        mockMvc.perform(post("/api/live-chat/receptionist/sessions/{id}/messages", session.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Chào bạn, tôi có thể hỗ trợ ngay."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages", hasSize(4)))
                .andExpect(jsonPath("$.messages[3].senderType").value("RECEPTIONIST"))
                .andExpect(jsonPath("$.messages[3].content")
                        .value("Chào bạn, tôi có thể hỗ trợ ngay."));
    }

    @Test
    @WithMockUser(
            username = "receptionist@smartclinic.com",
            roles = "RECEPTIONIST"
    )
    void bookingSupportConversationKeepsFullTranscriptAfterClosing() throws Exception {
        CreatedSession session = createAnonymousSession(
                "Khách đặt lịch",
                "Tôi muốn đặt lịch khám tim mạch."
        );

        mockMvc.perform(post("/api/live-chat/customer/sessions/{id}/messages", session.id())
                        .header(CHAT_TOKEN_HEADER, session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Tôi muốn khám ngày mai, khoảng 09:00."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages", hasSize(3)));

        mockMvc.perform(put("/api/live-chat/receptionist/sessions/{id}/claim", session.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.messages", hasSize(4)));

        mockMvc.perform(post("/api/live-chat/receptionist/sessions/{id}/messages", session.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content":"Bạn vui lòng mở trang Đặt lịch, chọn chuyên khoa Tim mạch và khung giờ 09:00."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages", hasSize(5)))
                .andExpect(jsonPath("$.messages[4].senderType").value("RECEPTIONIST"));

        mockMvc.perform(post("/api/live-chat/customer/sessions/{id}/messages", session.id())
                        .header(CHAT_TOKEN_HEADER, session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Cảm ơn, tôi sẽ thực hiện đặt lịch ngay."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages", hasSize(6)));

        mockMvc.perform(put("/api/live-chat/receptionist/sessions/{id}/close", session.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.closedAt").exists())
                .andExpect(jsonPath("$.messages", hasSize(7)));

        mockMvc.perform(get("/api/live-chat/customer/sessions/{id}", session.id())
                        .header(CHAT_TOKEN_HEADER, session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.customerName").value("Khách đặt lịch"))
                .andExpect(jsonPath("$.messages", hasSize(7)))
                .andExpect(jsonPath("$.messages[0].content")
                        .value("Tôi muốn đặt lịch khám tim mạch."))
                .andExpect(jsonPath("$.messages[2].content")
                        .value("Tôi muốn khám ngày mai, khoảng 09:00."))
                .andExpect(jsonPath("$.messages[4].content")
                        .value("Bạn vui lòng mở trang Đặt lịch, chọn chuyên khoa Tim mạch và khung giờ 09:00."))
                .andExpect(jsonPath("$.messages[5].content")
                        .value("Cảm ơn, tôi sẽ thực hiện đặt lịch ngay."))
                .andExpect(jsonPath("$.messages[6].senderType").value("SYSTEM"));
    }

    @Test
    @WithMockUser(
            username = "receptionist@smartclinic.com",
            roles = "RECEPTIONIST"
    )
    void closedSessionRejectsNewMessagesFromBothSides() throws Exception {
        CreatedSession session = createAnonymousSession();

        mockMvc.perform(put("/api/live-chat/receptionist/sessions/{id}/claim", session.id()))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/live-chat/receptionist/sessions/{id}/close", session.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        mockMvc.perform(post("/api/live-chat/customer/sessions/{id}/messages", session.id())
                        .header(CHAT_TOKEN_HEADER, session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Tôi muốn gửi thêm thông tin."}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/live-chat/receptionist/sessions/{id}/messages", session.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Lễ tân gửi thêm thông tin."}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void blankCustomerMessageIsRejected() throws Exception {
        CreatedSession session = createAnonymousSession();

        mockMvc.perform(post("/api/live-chat/customer/sessions/{id}/messages", session.id())
                        .header(CHAT_TOKEN_HEADER, session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"   "}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "patient@test.local", roles = "PATIENT")
    void patientCannotOpenReceptionistQueue() throws Exception {
        mockMvc.perform(get("/api/live-chat/receptionist/sessions"))
                .andExpect(status().isForbidden());
    }

    private CreatedSession createAnonymousSession() throws Exception {
        return createAnonymousSession(
                "Khách kiểm thử",
                "Tôi cần nói chuyện với lễ tân"
        );
    }

    private CreatedSession createAnonymousSession(
            String customerName,
            String initialMessage) throws Exception {
        String requestBody = objectMapper.writeValueAsString(
                new CreateSessionRequest(customerName, initialMessage));
        MvcResult result = mockMvc.perform(post("/api/live-chat/customer/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.messages", hasSize(2)))
                .andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
                .andReturn();

        JsonNode response = objectMapper.readTree(
                result.getResponse().getContentAsByteArray());
        return new CreatedSession(
                response.get("id").asLong(),
                response.get("accessToken").asText()
        );
    }

    private record CreatedSession(Long id, String accessToken) {
    }

    private record CreateSessionRequest(String customerName, String initialMessage) {
    }
}
