package com.smartclinic.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;
import java.util.Locale;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class LiveChatSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String database = connection.getMetaData()
                    .getDatabaseProductName()
                    .toLowerCase(Locale.ROOT);
            if (database.contains("microsoft sql server")) {
                createSqlServerSchema();
                updateSqlServerEnumConstraints();
            } else if (database.contains("h2")) {
                createH2Schema();
            } else {
                throw new IllegalStateException(
                        "Live chat schema is not configured for database: " + database);
            }
        }
    }

    private void updateSqlServerEnumConstraints() {
        recreateSqlServerCheckConstraint(
                "live_chat_sessions",
                "status",
                "ck_live_chat_sessions_status",
                "[status] IN ('BOT', 'WAITING', 'ACTIVE', 'CLOSED')"
        );
        recreateSqlServerCheckConstraint(
                "live_chat_messages",
                "sender_type",
                "ck_live_chat_messages_sender_type",
                "[sender_type] IN ('CUSTOMER', 'CHATBOT', 'RECEPTIONIST', 'SYSTEM')"
        );
    }

    private void recreateSqlServerCheckConstraint(
            String tableName,
            String columnName,
            String constraintName,
            String definition) {
        if (!tableExists(tableName)) {
            return;
        }

        List<String> existingConstraints = jdbcTemplate.queryForList(
                """
                SELECT check_constraint.name
                FROM sys.check_constraints check_constraint
                INNER JOIN sys.tables parent_table
                    ON parent_table.object_id = check_constraint.parent_object_id
                WHERE parent_table.name = ?
                  AND (
                      COL_NAME(
                          check_constraint.parent_object_id,
                          check_constraint.parent_column_id
                      ) = ?
                      OR check_constraint.definition LIKE ?
                  )
                """,
                String.class,
                tableName,
                columnName,
                "%" + columnName + "%"
        );

        if (existingConstraints.size() == 1
                && constraintName.equalsIgnoreCase(existingConstraints.get(0))) {
            return;
        }

        for (String existingConstraint : existingConstraints) {
            jdbcTemplate.execute(
                    "ALTER TABLE [" + tableName + "] DROP CONSTRAINT ["
                            + existingConstraint + "]"
            );
        }

        jdbcTemplate.execute(
                "ALTER TABLE [" + tableName + "] WITH CHECK ADD CONSTRAINT ["
                        + constraintName + "] CHECK (" + definition + ")"
        );
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE UPPER(TABLE_NAME) = UPPER(?)
                """,
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    private void createSqlServerSchema() {
        if (!tableExists("live_chat_sessions")) {
            jdbcTemplate.execute("""
                    CREATE TABLE live_chat_sessions (
                        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                        access_token VARCHAR(64) NOT NULL UNIQUE,
                        customer_id BIGINT NULL,
                        customer_name NVARCHAR(255) NOT NULL,
                        assigned_receptionist_id BIGINT NULL,
                        status VARCHAR(20) NOT NULL,
                        created_at DATETIME2 NOT NULL,
                        accepted_at DATETIME2 NULL,
                        closed_at DATETIME2 NULL,
                        last_message_at DATETIME2 NOT NULL,
                        version BIGINT NOT NULL DEFAULT 0,
                        CONSTRAINT fk_live_chat_customer
                            FOREIGN KEY (customer_id) REFERENCES users(id),
                        CONSTRAINT fk_live_chat_receptionist
                            FOREIGN KEY (assigned_receptionist_id) REFERENCES users(id)
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX idx_live_chat_status_last_message
                    ON live_chat_sessions(status, last_message_at)
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX idx_live_chat_receptionist
                    ON live_chat_sessions(assigned_receptionist_id)
                    """);
        }

        if (!tableExists("live_chat_messages")) {
            jdbcTemplate.execute("""
                    CREATE TABLE live_chat_messages (
                        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                        session_id BIGINT NOT NULL,
                        sender_type VARCHAR(20) NOT NULL,
                        sender_id BIGINT NULL,
                        content NVARCHAR(MAX) NOT NULL,
                        created_at DATETIME2 NOT NULL,
                        CONSTRAINT fk_live_chat_message_session
                            FOREIGN KEY (session_id) REFERENCES live_chat_sessions(id)
                            ON DELETE CASCADE,
                        CONSTRAINT fk_live_chat_message_sender
                            FOREIGN KEY (sender_id) REFERENCES users(id)
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX idx_live_chat_message_session_time
                    ON live_chat_messages(session_id, created_at)
                    """);
        }
    }

    private void createH2Schema() {
        if (!tableExists("live_chat_sessions")) {
            jdbcTemplate.execute("""
                    CREATE TABLE live_chat_sessions (
                        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                        access_token VARCHAR(64) NOT NULL UNIQUE,
                        customer_id BIGINT,
                        customer_name NVARCHAR(255) NOT NULL,
                        assigned_receptionist_id BIGINT,
                        status VARCHAR(20) NOT NULL,
                        created_at TIMESTAMP NOT NULL,
                        accepted_at TIMESTAMP,
                        closed_at TIMESTAMP,
                        last_message_at TIMESTAMP NOT NULL,
                        version BIGINT DEFAULT 0 NOT NULL,
                        CONSTRAINT fk_live_chat_customer
                            FOREIGN KEY (customer_id) REFERENCES users(id),
                        CONSTRAINT fk_live_chat_receptionist
                            FOREIGN KEY (assigned_receptionist_id) REFERENCES users(id)
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX idx_live_chat_status_last_message
                    ON live_chat_sessions(status, last_message_at)
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX idx_live_chat_receptionist
                    ON live_chat_sessions(assigned_receptionist_id)
                    """);
        }

        if (!tableExists("live_chat_messages")) {
            jdbcTemplate.execute("""
                    CREATE TABLE live_chat_messages (
                        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                        session_id BIGINT NOT NULL,
                        sender_type VARCHAR(20) NOT NULL,
                        sender_id BIGINT,
                        content NVARCHAR(1000) NOT NULL,
                        created_at TIMESTAMP NOT NULL,
                        CONSTRAINT fk_live_chat_message_session
                            FOREIGN KEY (session_id) REFERENCES live_chat_sessions(id)
                            ON DELETE CASCADE,
                        CONSTRAINT fk_live_chat_message_sender
                            FOREIGN KEY (sender_id) REFERENCES users(id)
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE INDEX idx_live_chat_message_session_time
                    ON live_chat_messages(session_id, created_at)
                    """);
        }
    }
}
