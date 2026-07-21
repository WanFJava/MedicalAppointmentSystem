package com.smartclinic.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SchemaController {
    
    private final JdbcTemplate jdbcTemplate;
    
    @GetMapping("/api/schema/{table}")
    public List<Map<String, Object>> getSchema(@PathVariable String table) {
        return jdbcTemplate.queryForList("SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?", table);
    }
}
