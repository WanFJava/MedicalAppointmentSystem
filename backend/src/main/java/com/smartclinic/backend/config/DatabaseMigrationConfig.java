package com.smartclinic.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class DatabaseMigrationConfig {
    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationConfig.class);

    @Bean
    public CommandLineRunner migrateSpecialtiesTable(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE specialties ALTER COLUMN description NVARCHAR(MAX)");
                log.info("Successfully altered specialties description column to NVARCHAR(MAX)");
            } catch (Exception e) {
                log.warn("Could not alter specialties description column (might already be NVARCHAR(MAX)): " + e.getMessage());
            }
        };
    }
}
