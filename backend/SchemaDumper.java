import java.sql.*;

public class SchemaDumper {
    public static void main(String[] args) {
        String url = "jdbc:sqlserver://localhost:1433;databaseName=smart_clinic_db;encrypt=true;trustServerCertificate=true";
        String user = "sa";
        String password = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            dumpTableSchema(conn, "medical_records");
            dumpTableSchema(conn, "prescriptions");
            dumpTableSchema(conn, "prescription_details");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void dumpTableSchema(Connection conn, String table) throws SQLException {
        System.out.println("--- Table: " + table + " ---");
        try (PreparedStatement stmt = conn.prepareStatement("SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?")) {
            stmt.setString(1, table);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    System.out.println(rs.getString("COLUMN_NAME") + " | " + rs.getString("DATA_TYPE") + " | " + rs.getString("IS_NULLABLE"));
                }
            }
        }
    }
}
