package com.smartclinic.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FeedbackEndpointSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void doctorFeedbackListIsPublicForDoctorProfile() throws Exception {
        mockMvc.perform(get("/api/feedbacks/doctor/999999"))
                .andExpect(status().isOk());
    }

    @Test
    void allFeedbacksRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/feedbacks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void patientCannotReadSystemWideFeedbacks() throws Exception {
        mockMvc.perform(get("/api/feedbacks"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanReadSystemWideFeedbacks() throws Exception {
        mockMvc.perform(get("/api/feedbacks"))
                .andExpect(status().isOk());
    }
}
