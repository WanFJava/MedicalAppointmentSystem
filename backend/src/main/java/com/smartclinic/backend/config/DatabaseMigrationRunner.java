package com.smartclinic.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE appointments DROP CONSTRAINT CK__appointme__statu__24927208");
            log.info("==========================================================");
            log.info("SUCCESS: Dropped check constraint CK__appointme__statu__24927208 from appointments table");
            log.info("==========================================================");
        } catch (Exception e) {
            log.warn("Notice: Constraint CK__appointme__statu__24927208 might already be dropped or not exist. " + e.getMessage());
        }
    }
}
