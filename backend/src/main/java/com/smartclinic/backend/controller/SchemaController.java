package com.smartclinic.backend.controller;

import com.smartclinic.backend.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SchemaController {
    
    private final JdbcTemplate jdbcTemplate;
    private final BillService billService;
    
    @GetMapping("/api/schema/{table}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getSchema(@PathVariable String table) {
        return jdbcTemplate.queryForList("SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", table);
    }

    @GetMapping("/api/fix-encoding")
    @PreAuthorize("hasRole('ADMIN')")
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
