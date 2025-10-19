import { api } from "encore.dev/api";
import { userDB } from "./db";

interface MonthlyResetResponse {
  usersReset: number;
  message: string;
}

export const monthlyReset = api(
  { method: "POST", path: "/user/monthly-reset", expose: true },
  async (): Promise<MonthlyResetResponse> => {
    const currentMonth = new Date().toISOString().substring(0, 7);

    const usersToReset = await userDB.queryAll<{
      id: number;
      last_monthly_reset: string | null;
      is_premium: boolean;
    }>`
      SELECT id, last_monthly_reset, is_premium
      FROM users
      WHERE last_monthly_reset IS NULL 
         OR DATE_TRUNC('month', last_monthly_reset) < DATE_TRUNC('month', NOW())
    `;

    for (const user of usersToReset) {
      const resetTokens = user.is_premium ? 300 : 100;

      await userDB.exec`
        UPDATE users 
        SET pt_balance = ${resetTokens},
            last_monthly_reset = NOW(),
            monthly_reset_count = monthly_reset_count + 1,
            total_wins = 0,
            total_losses = 0,
            accuracy_percentage = 0,
            streak = 0
        WHERE id = ${user.id}
      `;

      await userDB.exec`
        INSERT INTO transactions (user_id, amount, type, description)
        VALUES (${user.id}, ${resetTokens}, 'monthly_reset', 'Monthly token reset')
      `;
    }

    await userDB.exec`
      DELETE FROM user_achievements 
      WHERE month_year IS NOT NULL 
      AND month_year < ${currentMonth}
    `;

    return {
      usersReset: usersToReset.length,
      message: `Monthly reset completed for ${usersToReset.length} users`,
    };
  }
);
