package com.smartclinic.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/schema")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SchemaController {

    private static final Set<String> ALLOWED_TABLES = Set.of(
            "users", "patients", "doctors", "specialties", "schedules",
            "appointments", "medical_records", "prescriptions",
            "prescription_details", "medicines", "bills", "feedbacks",
            "live_chat_sessions", "live_chat_messages"
    );

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/{table}")
    public List<Map<String, Object>> getSchema(@PathVariable String table) {
        if (!ALLOWED_TABLES.contains(table)) {
            throw new IllegalArgumentException("Bảng dữ liệu không hợp lệ.");
        }
        return jdbcTemplate.queryForList("SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", table);
    }

    @PostMapping("/fix-encoding")
    public String fixEncoding() {
        try {
            jdbcTemplate.execute("ALTER TABLE appointments ALTER COLUMN symptom NVARCHAR(1000)");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN full_name NVARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN address NVARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE patients ALTER COLUMN allergy NVARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE patients ALTER COLUMN address NVARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE specialties ALTER COLUMN name NVARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE specialties ALTER COLUMN description NVARCHAR(1000)");
            jdbcTemplate.execute("ALTER TABLE medical_records ALTER COLUMN diagnosis NVARCHAR(1000)");
            jdbcTemplate.execute("ALTER TABLE medical_records ALTER COLUMN doctor_note NVARCHAR(1000)");
            return "Successfully updated columns to NVARCHAR for Vietnamese support!";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }
}
