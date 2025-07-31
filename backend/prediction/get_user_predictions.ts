import { api } from "encore.dev/api";
import { predictionDB } from "./db";

export interface GetUserPredictionsRequest {
  userId: number;
}

export interface UserPrediction {
  id: number;
  question: string;
  optionSelected: string;
  ptSpent: number;
  status: string;
  correctOption?: string;
  outcome: 'won' | 'lost' | 'pending';
  createdAt: Date;
}

export interface GetUserPredictionsResponse {
  predictions: UserPrediction[];
}

// Gets all predictions a user has voted on.
export const getUserPredictions = api<GetUserPredictionsRequest, GetUserPredictionsResponse>(
  { expose: true, method: "GET", path: "/predictions/user/:userId" },
  async (req) => {
    const userPredictions = await predictionDB.queryAll<{
      prediction_id: number;
      question: string;
      option_selected: string;
      pt_spent: number;
      status: string;
      correct_option: string | null;
      vote_created_at: Date;
    }>`
      SELECT v.prediction_id, p.question, v.option_selected, v.pt_spent,
             p.status, p.correct_option, v.created_at as vote_created_at
      FROM votes v
      JOIN predictions p ON v.prediction_id = p.id
      WHERE v.user_id = ${req.userId}
      ORDER BY v.created_at DESC
    `;

    return {
      predictions: userPredictions.map(up => {
        let outcome: 'won' | 'lost' | 'pending' = 'pending';
        
        if (up.status === 'resolved' && up.correct_option) {
          outcome = up.option_selected === up.correct_option ? 'won' : 'lost';
        }

        return {
          id: up.prediction_id,
          question: up.question,
          optionSelected: up.option_selected,
          ptSpent: up.pt_spent,
          status: up.status,
          correctOption: up.correct_option || undefined,
          outcome,
          createdAt: up.vote_created_at,
        };
      }),
    };
  }
);
