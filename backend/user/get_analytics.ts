import { api, APIError } from "encore.dev/api";
import { predictionDB } from "../prediction/db";

interface GetAnalyticsRequest {
  userId: number;
}

interface AnalyticsResponse {
  overview: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalTokensWon: number;
    totalTokensLost: number;
  };
  categoryPerformance: CategoryPerformance[];
  weekdayPerformance: WeekdayPerformance[];
  monthlyTrend: MonthlyTrend[];
  insights: string[];
  recentPredictions: RecentPrediction[];
}

interface CategoryPerformance {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
  tokensWon: number;
  tokensLost: number;
}

interface WeekdayPerformance {
  weekday: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface RecentPrediction {
  id: number;
  question: string;
  category: string;
  vote: string;
  isCorrect: boolean | null;
  tokensWon: number;
  createdAt: Date;
}

export const getAnalytics = api<GetAnalyticsRequest, AnalyticsResponse>(
  { expose: true, method: "GET", path: "/user/:userId/analytics" },
  async (req) => {
    const overviewRows: any[] = [];
    for await (const row of predictionDB.query`
      SELECT
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN v.is_correct = true THEN 1 END) as correct_predictions,
        COALESCE(SUM(CASE WHEN v.is_correct = true THEN v.tokens_won ELSE 0 END), 0) as total_tokens_won,
        COALESCE(SUM(CASE WHEN v.is_correct = false THEN v.tokens_wagered ELSE 0 END), 0) as total_tokens_lost
      FROM votes v
      WHERE v.user_id = ${req.userId}
    `) {
      overviewRows.push(row);
    }

    const totalPredictions = parseInt(overviewRows[0]?.total_predictions || "0");
    const correctPredictions = parseInt(overviewRows[0]?.correct_predictions || "0");
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    const categoryRows: any[] = [];
    for await (const row of predictionDB.query`
      SELECT
        p.category,
        COUNT(*) as total,
        COUNT(CASE WHEN v.is_correct = true THEN 1 END) as correct,
        COALESCE(SUM(CASE WHEN v.is_correct = true THEN v.tokens_won ELSE 0 END), 0) as tokens_won,
        COALESCE(SUM(CASE WHEN v.is_correct = false THEN v.tokens_wagered ELSE 0 END), 0) as tokens_lost
      FROM votes v
      JOIN predictions p ON v.prediction_id = p.id
      WHERE v.user_id = ${req.userId}
      GROUP BY p.category
      ORDER BY total DESC
    `) {
      categoryRows.push(row);
    }

    const categoryPerformance: CategoryPerformance[] = categoryRows.map((row: any) => ({
      category: row.category,
      total: parseInt(row.total),
      correct: parseInt(row.correct),
      accuracy: parseInt(row.total) > 0 ? (parseInt(row.correct) / parseInt(row.total)) * 100 : 0,
      tokensWon: parseInt(row.tokens_won),
      tokensLost: parseInt(row.tokens_lost),
    }));

    const weekdayRows: any[] = [];
    for await (const row of predictionDB.query`
      SELECT
        TO_CHAR(v.created_at, 'Day') as weekday,
        EXTRACT(DOW FROM v.created_at) as day_number,
        COUNT(*) as total,
        COUNT(CASE WHEN v.is_correct = true THEN 1 END) as correct
      FROM votes v
      WHERE v.user_id = ${req.userId}
      GROUP BY TO_CHAR(v.created_at, 'Day'), EXTRACT(DOW FROM v.created_at)
      ORDER BY day_number
    `) {
      weekdayRows.push(row);
    }

    const weekdayPerformance: WeekdayPerformance[] = weekdayRows.map((row: any) => ({
      weekday: row.weekday.trim(),
      total: parseInt(row.total),
      correct: parseInt(row.correct),
      accuracy: parseInt(row.total) > 0 ? (parseInt(row.correct) / parseInt(row.total)) * 100 : 0,
    }));

    const monthlyRows: any[] = [];
    for await (const row of predictionDB.query`
      SELECT
        TO_CHAR(v.created_at, 'YYYY-MM') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN v.is_correct = true THEN 1 END) as correct
      FROM votes v
      WHERE v.user_id = ${req.userId}
      GROUP BY TO_CHAR(v.created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `) {
      monthlyRows.push(row);
    }

    const monthlyTrend: MonthlyTrend[] = monthlyRows.map((row: any) => ({
      month: row.month,
      total: parseInt(row.total),
      correct: parseInt(row.correct),
      accuracy: parseInt(row.total) > 0 ? (parseInt(row.correct) / parseInt(row.total)) * 100 : 0,
    })).reverse();

    const recentRows: any[] = [];
    for await (const row of predictionDB.query`
      SELECT
        v.id,
        p.question,
        p.category,
        v.vote,
        v.is_correct,
        v.tokens_won,
        v.created_at
      FROM votes v
      JOIN predictions p ON v.prediction_id = p.id
      WHERE v.user_id = ${req.userId}
      ORDER BY v.created_at DESC
      LIMIT 20
    `) {
      recentRows.push(row);
    }

    const recentPredictions: RecentPrediction[] = recentRows.map((row: any) => ({
      id: row.id,
      question: row.question,
      category: row.category,
      vote: row.vote,
      isCorrect: row.is_correct,
      tokensWon: row.tokens_won || 0,
      createdAt: new Date(row.created_at),
    }));

    const insights = generateInsights(
      accuracy,
      categoryPerformance,
      weekdayPerformance,
      totalPredictions
    );

    return {
      overview: {
        totalPredictions,
        correctPredictions,
        accuracy,
        totalTokensWon: parseInt(overviewRows[0]?.total_tokens_won || "0"),
        totalTokensLost: parseInt(overviewRows[0]?.total_tokens_lost || "0"),
      },
      categoryPerformance,
      weekdayPerformance,
      monthlyTrend,
      insights,
      recentPredictions,
    };
  }
);

function generateInsights(
  accuracy: number,
  categoryPerformance: CategoryPerformance[],
  weekdayPerformance: WeekdayPerformance[],
  totalPredictions: number
): string[] {
  const insights: string[] = [];

  if (totalPredictions === 0) {
    insights.push("Start making predictions to see personalized insights!");
    return insights;
  }

  if (accuracy > 70) {
    insights.push(`Excellent! Your overall accuracy is ${accuracy.toFixed(1)}%, you're in the top tier of predictors!`);
  } else if (accuracy > 50) {
    insights.push(`Good job! You're predicting correctly ${accuracy.toFixed(1)}% of the time.`);
  } else if (accuracy > 0) {
    insights.push(`Your accuracy is ${accuracy.toFixed(1)}%. Keep practicing to improve your prediction skills!`);
  }

  if (categoryPerformance.length > 0) {
    const bestCategory = categoryPerformance.reduce((best, cat) =>
      cat.accuracy > best.accuracy ? cat : best
    , categoryPerformance[0]);

    if (bestCategory && bestCategory.total >= 3) {
      insights.push(`You predict best in ${bestCategory.category} with ${bestCategory.accuracy.toFixed(1)}% accuracy!`);
    }
  }

  if (weekdayPerformance.length > 0) {
    const bestWeekday = weekdayPerformance.reduce((best, day) =>
      day.accuracy > best.accuracy ? day : best
    , weekdayPerformance[0]);

    if (bestWeekday && bestWeekday.total >= 3) {
      insights.push(`Your accuracy improves on ${bestWeekday.weekday}s (${bestWeekday.accuracy.toFixed(1)}% success rate).`);
    }
  }

  if (categoryPerformance.length > 1) {
    const worstCategory = categoryPerformance.reduce((worst, cat) =>
      cat.total >= 3 && cat.accuracy < worst.accuracy ? cat : worst
    , categoryPerformance[0]);

    const bestCategory = categoryPerformance.reduce((best, cat) =>
      cat.accuracy > best.accuracy ? cat : best
    , categoryPerformance[0]);

    if (worstCategory && worstCategory.total >= 3 && worstCategory !== bestCategory) {
      insights.push(`Consider studying ${worstCategory.category} predictions more carefully - your accuracy there is ${worstCategory.accuracy.toFixed(1)}%.`);
    }
  }

  if (categoryPerformance.length > 0) {
    const mostProfitableCategory = categoryPerformance.reduce((best, cat) =>
      (cat.tokensWon - cat.tokensLost) > (best.tokensWon - best.tokensLost) ? cat : best
    , categoryPerformance[0]);

    if (mostProfitableCategory && mostProfitableCategory.tokensWon > mostProfitableCategory.tokensLost) {
      const profit = mostProfitableCategory.tokensWon - mostProfitableCategory.tokensLost;
      insights.push(`${mostProfitableCategory.category} has been your most profitable category with ${profit} tokens net gain!`);
    }
  }

  return insights;
}
