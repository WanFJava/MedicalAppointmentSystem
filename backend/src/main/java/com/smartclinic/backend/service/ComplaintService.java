package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.ComplaintDto;
import java.util.List;

public interface ComplaintService {
    ComplaintDto createComplaint(Long patientUserId, ComplaintDto complaintDto);
    List<ComplaintDto> getAllComplaints();
    List<ComplaintDto> getPatientComplaints(Long patientUserId);
    ComplaintDto resolveComplaint(Long id, Long resolvedByUserId, String resolutionNote);
}
