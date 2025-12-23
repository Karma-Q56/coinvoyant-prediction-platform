import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import { predictionDB } from "./db";

export const closeExpired = api({}, async (): Promise<{ closed: number }> => {
  const expiredPredictionsGen = await predictionDB.query<{ id: number }>`
    SELECT id
    FROM predictions
    WHERE status = 'open'
      AND closes_at <= NOW()
  `;

  const expiredPredictions = [];
  for await (const row of expiredPredictionsGen) {
    expiredPredictions.push(row);
  }

  if (expiredPredictions.length > 0) {
    await predictionDB.exec`
      UPDATE predictions
      SET status = 'closed', closed_at = NOW()
      WHERE status = 'open'
        AND closes_at <= NOW()
    `;
  }

  return { closed: expiredPredictions.length };
});

const _ = new CronJob("close-expired-predictions", {
  title: "Close Expired Predictions",
  every: "1h",
  endpoint: closeExpired,
});
