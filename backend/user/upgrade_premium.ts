import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { userDB } from "./db";

interface UpgradePremiumResponse {
  message: string;
  newBalance: number;
}

export const upgradePremium = api(
  { method: "POST", path: "/user/upgrade-premium", expose: true, auth: true },
  async (): Promise<UpgradePremiumResponse> => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    const user = await userDB.queryRow<{
      is_premium: boolean;
      pt_balance: number;
    }>`
      SELECT is_premium, pt_balance FROM users WHERE id = ${userId}
    `;

    if (!user) {
      throw new Error("User not found");
    }

    if (user.is_premium) {
      throw new Error("User is already premium");
    }

    const bonusTokens = 200;
    const newBalance = user.pt_balance + bonusTokens;

    await userDB.exec`
      UPDATE users 
      SET is_premium = true,
          pt_balance = ${newBalance}
      WHERE id = ${userId}
    `;

    await userDB.exec`
      INSERT INTO transactions (user_id, amount, type, description)
      VALUES (${userId}, ${bonusTokens}, 'premium_upgrade', 'Premium upgrade bonus')
    `;

    return {
      message: "Successfully upgraded to premium",
      newBalance,
    };
  }
);
