package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.FeedbackDto;
import com.smartclinic.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<FeedbackDto> createFeedback(@RequestBody FeedbackDto feedbackDto) {
        return ResponseEntity.ok(feedbackService.createFeedback(feedbackDto));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackDto>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<FeedbackDto>> getFeedbacksByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByDoctor(doctorId));
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<FeedbackDto> getFeedbackByAppointment(@PathVariable Long appointmentId) {
        FeedbackDto feedbackDto = feedbackService.getFeedbackByAppointment(appointmentId);
        if (feedbackDto != null) {
            return ResponseEntity.ok(feedbackDto);
        }
        return ResponseEntity.notFound().build();
    }
}
