package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.FeedbackDto;
import java.util.List;

public interface FeedbackService {
    FeedbackDto createFeedback(FeedbackDto feedbackDto);
    List<FeedbackDto> getFeedbacksByDoctor(Long doctorId);
    FeedbackDto getFeedbackByAppointment(Long appointmentId);
}
