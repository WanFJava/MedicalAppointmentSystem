package com.smartclinic.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChatbotEndpointTests {

    @Autowired
    private MockMvc mockMvc;

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
}
