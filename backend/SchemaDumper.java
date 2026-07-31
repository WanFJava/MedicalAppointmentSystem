import java.sql.*;

public class SchemaDumper {
    public static void main(String[] args) {
        String url = requireEnv("DB_URL");
        String user = requireEnv("DB_USERNAME");
        String password = requireEnv("DB_PASSWORD");

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("--- Table: appointments ---");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'appointments'")) {
                while (rs.next()) {
                    System.out.println(rs.getString("COLUMN_NAME") + " | " + rs.getString("DATA_TYPE") + " | " + rs.getString("CHARACTER_MAXIMUM_LENGTH"));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " environment variable is required");
        }
        return value;
    }
}
