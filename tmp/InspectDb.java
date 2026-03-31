import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class InspectDb {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mariadb://localhost:3306/meubanco";
        String user = "usuario";
        String password = "senhauser";

        try (Connection connection = DriverManager.getConnection(url, user, password)) {
            System.out.println("Connected");

            printColumns(connection, "transacao");
            printColumns(connection, "receita");
            printColumns(connection, "despesa");
            printColumns(connection, "user");

            try (PreparedStatement stmt = connection.prepareStatement(
                    """
                    SELECT id, email, username
                    FROM user
                    ORDER BY id
                    """
            )) {
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        long id = rs.getLong("id");
                        String email = rs.getString("email");
                        String username = rs.getString("username");
                        BigDecimal receitas = sumPeriodo(connection, "receita", id);
                        BigDecimal despesas = sumPeriodo(connection, "despesa", id);
                        BigDecimal receitasAcoes = sumAcoes(connection, id, "RECEITA");
                        BigDecimal despesasAcoes = sumAcoes(connection, id, "DESPESA");
                        System.out.printf(
                                "user=%d email=%s username=%s receitas_marco=%s despesas_marco=%s saldo_marco=%s acoes_receita_marco=%s acoes_despesa_marco=%s%n",
                                id,
                                email,
                                username,
                                receitas,
                                despesas,
                                receitas.subtract(despesas),
                                receitasAcoes,
                                despesasAcoes
                        );
                    }
                }
            }
        }
    }

    private static BigDecimal sumPeriodo(Connection connection, String table, long userId) throws Exception {
        String sql = """
                SELECT COALESCE(SUM(t.valor), 0) total
                FROM transacao t
                INNER JOIN %s x ON x.id = t.id
                WHERE t.user_id = ? AND t.data BETWEEN ? AND ?
                """.formatted(table);
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, "2026-03-01");
            stmt.setString(3, "2026-03-31");
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                return rs.getBigDecimal("total");
            }
        }
    }

    private static void printColumns(Connection connection, String table) throws Exception {
        System.out.println("Columns for " + table + ":");
        try (PreparedStatement stmt = connection.prepareStatement(
                """
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
                """
        )) {
            stmt.setString(1, table);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    System.out.println(" - " + rs.getString(1));
                }
            }
        }
    }

    private static BigDecimal sumAcoes(Connection connection, long userId, String tipo) throws Exception {
        String sql = """
                SELECT COALESCE(SUM(valor), 0) total
                FROM acoes_financeiras
                WHERE usuario_id = ? AND tipo = ? AND data BETWEEN ? AND ?
                """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, tipo);
            stmt.setString(3, "2026-03-01");
            stmt.setString(4, "2026-03-31");
            try (ResultSet rs = stmt.executeQuery()) {
                rs.next();
                return rs.getBigDecimal("total");
            }
        }
    }
}
