import { api, APIError } from "encore.dev/api";
import { predictionDB } from "./db";

export interface GetPredictionRequest {
  predictionId: number;
}

export interface PredictionBasicInfo {
  id: number;
  title: string;
  status: string;
  correctOption: string | null;
}

export const getPrediction = api<GetPredictionRequest, PredictionBasicInfo>(
  { method: "GET", path: "/prediction/:predictionId", expose: false },
  async (req) => {
    const prediction = await predictionDB.queryRow<{
      id: number;
      question: string;
      status: string;
      correct_option: string | null;
    }>`
      SELECT id, question, status, correct_option FROM predictions WHERE id = ${req.predictionId}
    `;

    if (!prediction) {
      throw APIError.notFound("Prediction not found");
    }

    return {
      id: prediction.id,
      title: prediction.question,
      status: prediction.status,
      correctOption: prediction.correct_option,
    };
  }
);
