package com.smartclinic.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private static final Logger logger = LoggerFactory.getLogger(DatabaseFixer.class);

    @Override
    public void run(String... args) throws Exception {
        try {
            // Find all check constraints on the appointments table
            String query = "SELECT name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('appointments') AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('appointments'), 'status', 'ColumnId')";
            List<String> constraints = jdbcTemplate.queryForList(query, String.class);
            
            for (String constraintName : constraints) {
                logger.info("Dropping constraint: " + constraintName);
                jdbcTemplate.execute("ALTER TABLE appointments DROP CONSTRAINT " + constraintName);
            }
        } catch (Exception e) {
            logger.error("Failed to drop constraints: " + e.getMessage());
        }
    }
}
