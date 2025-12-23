import { api } from "encore.dev/api";
import { userDB } from "./db";

interface WatchAdResponse {
  tokensEarned: number;
  adsWatchedToday: number;
  maxAdsPerDay: number;
  newBalance: number;
}

interface WatchAdRequest {
  userId: number;
}

export const watchAd = api(
  { method: "POST", path: "/user/watch-ad", expose: true },
  async (req: WatchAdRequest): Promise<WatchAdResponse> => {
    const userId = req.userId;

    const user = await userDB.queryRow<{
      ads_watched_today: number;
      last_ad_watch_date: string | null;
      pt_balance: number;
    }>`
      SELECT ads_watched_today, last_ad_watch_date, pt_balance
      FROM users WHERE id = ${userId}
    `;

    if (!user) {
      throw new Error("User not found");
    }

    const today = new Date().toISOString().split('T')[0];
    const maxAdsPerDay = 3;
    const tokensPerAd = 5;

    let adsWatchedToday = user.ads_watched_today;

    if (user.last_ad_watch_date !== today) {
      adsWatchedToday = 0;
    }

    if (adsWatchedToday >= maxAdsPerDay) {
      throw new Error("Maximum ads watched for today");
    }

    const newAdsCount = adsWatchedToday + 1;
    const newBalance = user.pt_balance + tokensPerAd;

    await userDB.exec`
      UPDATE users 
      SET ads_watched_today = ${newAdsCount},
          last_ad_watch_date = ${today},
          pt_balance = ${newBalance}
      WHERE id = ${userId}
    `;

    await userDB.exec`
      INSERT INTO transactions (user_id, amount, type, description)
      VALUES (${userId}, ${tokensPerAd}, 'ad_watch', 'Watched advertisement')
    `;

    const { checkAchievementsForUser } = await import("./check_achievements_internal");
    try {
      await checkAchievementsForUser(userId);
    } catch (err) {
      console.error("Failed to check achievements:", err);
    }

    return {
      tokensEarned: tokensPerAd,
      adsWatchedToday: newAdsCount,
      maxAdsPerDay,
      newBalance,
    };
  }
);
