package com.smartclinic.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChatbotEndpointTests {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void anonymousCustomerCanChatWithReceptionist() throws Exception {
        mockMvc.perform(post("/api/chatbot/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Xin chào"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", not(blankOrNullString())))
                .andExpect(jsonPath("$.quickReplies", hasSize(4)));
    }

    @Test
    void bookingQuestionReturnsBookingNavigationAction() throws Exception {
        mockMvc.perform(post("/api/chatbot/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Tôi muốn đặt lịch khám"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actions[0].label").value("Đặt lịch khám"))
                .andExpect(jsonPath("$.actions[0].path").value("/book"));
    }

    @Test
    void availableScheduleQuestionUsesDatabaseDoctors() throws Exception {
        mockMvc.perform(post("/api/chatbot/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Bác sĩ nào còn lịch trống?"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", not(blankOrNullString())))
                .andExpect(jsonPath("$.actions").isArray());
    }

    @Test
    void blankMessageIsRejected() throws Exception {
        mockMvc.perform(post("/api/chatbot/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"   "}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void customerCanRequestHumanReceptionistHandoff() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/chatbot/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Tôi cần nói chuyện với lễ tân"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.handoffRequested").value(true))
                .andExpect(jsonPath("$.quickReplies").isEmpty())
                .andExpect(jsonPath("$.actions").isEmpty())
                .andReturn();

        JsonNode response = objectMapper.readTree(
                result.getResponse().getContentAsByteArray());
        mockMvc.perform(get("/api/live-chat/customer/sessions/{id}",
                        response.get("sessionId").asLong())
                        .header("X-Chat-Token", response.get("accessToken").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.messages", hasSize(4)))
                .andExpect(jsonPath("$.messages[0].senderType").value("CHATBOT"))
                .andExpect(jsonPath("$.messages[1].senderType").value("CUSTOMER"))
                .andExpect(jsonPath("$.messages[2].senderType").value("CHATBOT"))
                .andExpect(jsonPath("$.messages[3].senderType").value("SYSTEM"));
    }

    @Test
    void chatbotConversationIsPersistedAndCanBeReloaded() throws Exception {
        MvcResult firstResult = mockMvc.perform(post("/api/chatbot/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Xin chào"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNumber())
                .andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
                .andReturn();

        JsonNode firstResponse = objectMapper.readTree(
                firstResult.getResponse().getContentAsByteArray());
        long sessionId = firstResponse.get("sessionId").asLong();
        String accessToken = firstResponse.get("accessToken").asText();

        String secondRequest = objectMapper.writeValueAsString(Map.of(
                "message", "Tôi muốn xem chuyên khoa",
                "sessionId", sessionId,
                "accessToken", accessToken
        ));
        mockMvc.perform(post("/api/chatbot/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(secondRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId));

        mockMvc.perform(get("/api/live-chat/customer/sessions/{id}", sessionId)
                        .header("X-Chat-Token", accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BOT"))
                .andExpect(jsonPath("$.messages", hasSize(5)))
                .andExpect(jsonPath("$.messages[0].senderType").value("CHATBOT"))
                .andExpect(jsonPath("$.messages[1].senderType").value("CUSTOMER"))
                .andExpect(jsonPath("$.messages[2].senderType").value("CHATBOT"))
                .andExpect(jsonPath("$.messages[3].senderType").value("CUSTOMER"))
                .andExpect(jsonPath("$.messages[4].senderType").value("CHATBOT"));
    }
}
