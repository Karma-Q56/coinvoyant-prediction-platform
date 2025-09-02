import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface CheckDailyBonusRequest {
  userId: number;
}

export interface DailyBonusResponse {
  canClaim: boolean;
  lastClaimedDate?: Date;
  consecutiveDays: number;
  bonusAmount: number;
}

// Checks if user can claim daily login bonus.
export const checkDailyBonus = api<CheckDailyBonusRequest, DailyBonusResponse>(
  { expose: true, method: "GET", path: "/user/:userId/daily-bonus" },
  async (req) => {
    const user = await userDB.queryRow<{
      last_login_bonus: Date | null;
      consecutive_login_days: number;
    }>`
      SELECT last_login_bonus, consecutive_login_days
      FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let canClaim = true;
    let consecutiveDays = user.consecutive_login_days || 0;
    
    if (user.last_login_bonus) {
      const lastClaimedDate = new Date(user.last_login_bonus);
      const lastClaimedDay = new Date(lastClaimedDate.getFullYear(), lastClaimedDate.getMonth(), lastClaimedDate.getDate());
      
      // If already claimed today, can't claim again
      if (lastClaimedDay.getTime() === today.getTime()) {
        canClaim = false;
      }
    }

    // Base bonus: 50 PT + (10 PT * consecutive days), max 200 PT
    const bonusAmount = Math.min(50 + (consecutiveDays * 10), 200);

    return {
      canClaim,
      lastClaimedDate: user.last_login_bonus || undefined,
      consecutiveDays,
      bonusAmount,
    };
  }
);
