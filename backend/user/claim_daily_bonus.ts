import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface ClaimDailyBonusRequest {
  userId: number;
}

export interface ClaimDailyBonusResponse {
  bonusAmount: number;
  newPtBalance: number;
  consecutiveDays: number;
  nextBonusAmount: number;
}

// Claims the daily login bonus.
export const claimDailyBonus = api<ClaimDailyBonusRequest, ClaimDailyBonusResponse>(
  { expose: true, method: "POST", path: "/user/:userId/claim-daily-bonus" },
  async (req) => {
    const tx = await userDB.begin();
    try {
      const user = await tx.queryRow<{
        pt_balance: number;
        last_login_bonus: Date | null;
        consecutive_login_days: number;
      }>`
        SELECT pt_balance, last_login_bonus, consecutive_login_days
        FROM users WHERE id = ${req.userId}
        FOR UPDATE
      `;

      if (!user) {
        throw APIError.notFound("user not found");
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if already claimed today
      if (user.last_login_bonus) {
        const lastClaimedDate = new Date(user.last_login_bonus);
        const lastClaimedDay = new Date(lastClaimedDate.getFullYear(), lastClaimedDate.getMonth(), lastClaimedDate.getDate());
        
        if (lastClaimedDay.getTime() === today.getTime()) {
          throw APIError.failedPrecondition("daily bonus already claimed today");
        }
      }

      // Calculate consecutive days
      let consecutiveDays = user.consecutive_login_days || 0;
      
      if (user.last_login_bonus) {
        const lastClaimedDate = new Date(user.last_login_bonus);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastClaimedDay = new Date(lastClaimedDate.getFullYear(), lastClaimedDate.getMonth(), lastClaimedDate.getDate());
        
        if (lastClaimedDay.getTime() === yesterday.getTime()) {
          // Consecutive day
          consecutiveDays += 1;
        } else {
          // Streak broken, start over
          consecutiveDays = 1;
        }
      } else {
        // First time claiming
        consecutiveDays = 1;
      }

      // Calculate bonus: 50 PT + (10 PT * consecutive days), max 200 PT
      const bonusAmount = Math.min(50 + ((consecutiveDays - 1) * 10), 200);
      const nextBonusAmount = Math.min(50 + (consecutiveDays * 10), 200);

      // Update user
      const updatedUser = await tx.queryRow<{
        pt_balance: number;
      }>`
        UPDATE users 
        SET pt_balance = pt_balance + ${bonusAmount},
            last_login_bonus = ${now},
            consecutive_login_days = ${consecutiveDays},
            updated_at = NOW()
        WHERE id = ${req.userId}
        RETURNING pt_balance
      `;

      // Record transaction
      await tx.exec`
        INSERT INTO transactions (user_id, type, amount, currency, description)
        VALUES (${req.userId}, 'bonus', ${bonusAmount}, 'PT', 'Daily login bonus')
      `;

      await tx.commit();

      return {
        bonusAmount,
        newPtBalance: updatedUser!.pt_balance,
        consecutiveDays,
        nextBonusAmount,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
