package com.smartclinic.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseFixRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // Find and drop restrictive SQL Server CHECK constraints on status columns
            List<Map<String, Object>> constraints = jdbcTemplate.queryForList(
                "SELECT c.name AS constraint_name, OBJECT_NAME(c.parent_object_id) AS table_name " +
                "FROM sys.check_constraints c " +
                "WHERE c.parent_object_id IN (OBJECT_ID('appointments'), OBJECT_ID('schedules'), OBJECT_ID('users'), OBJECT_ID('bills')) " +
                "AND c.name LIKE '%statu%'"
            );

            for (Map<String, Object> row : constraints) {
                String constraintName = (String) row.get("constraint_name");
                String tableName = (String) row.get("table_name");
                log.info("Dropping outdated SQL Server CHECK constraint [{}] on table [{}]", constraintName, tableName);
                jdbcTemplate.execute("ALTER TABLE [" + tableName + "] DROP CONSTRAINT [" + constraintName + "]");
            }
        } catch (Exception e) {
            log.warn("Notice during DatabaseFixRunner execution: {}", e.getMessage());
        }
    }
}
