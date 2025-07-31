import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const predictionDB = SQLDatabase.named("prediction");
const userDB = SQLDatabase.named("user");

export interface CreatePredictionRequest {
  userId: number;
  question: string;
  category: string;
  options: string[];
  requiredPt: number;
  closesAt: Date;
}

export interface CreatePredictionResponse {
  id: number;
  question: string;
  category: string;
  options: string[];
  requiredPt: number;
  closesAt: Date;
}

// List of admin email addresses
const ADMIN_EMAILS = [
  "ragnarokq56@gmail.com",
];

// Creates a new prediction (admin only).
export const createPrediction = api<CreatePredictionRequest, CreatePredictionResponse>(
  { expose: true, method: "POST", path: "/admin/predictions" },
  async (req) => {
    // Check if user is admin
    const user = await userDB.queryRow<{
      email: string;
    }>`
      SELECT email FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      throw APIError.permissionDenied("admin access required");
    }

    const prediction = await predictionDB.queryRow<{
      id: number;
      question: string;
      category: string;
      options: string[];
      required_pt: number;
      closes_at: Date;
    }>`
      INSERT INTO predictions (question, category, options, required_pt, closes_at)
      VALUES (${req.question}, ${req.category}, ${JSON.stringify(req.options)}, ${req.requiredPt}, ${req.closesAt})
      RETURNING id, question, category, options, required_pt, closes_at
    `;

    return {
      id: prediction!.id,
      question: prediction!.question,
      category: prediction!.category,
      options: prediction!.options,
      requiredPt: prediction!.required_pt,
      closesAt: prediction!.closes_at,
    };
  }
);
