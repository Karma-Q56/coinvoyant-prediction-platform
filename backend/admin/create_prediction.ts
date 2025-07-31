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
  imageUrl?: string;
  predictionType: 'daily' | 'long_term';
}

export interface CreatePredictionResponse {
  id: number;
  question: string;
  category: string;
  options: string[];
  requiredPt: number;
  closesAt: Date;
  imageUrl?: string;
  predictionType: string;
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

    // Validate prediction type
    if (!['daily', 'long_term'].includes(req.predictionType)) {
      throw APIError.invalidArgument("prediction type must be 'daily' or 'long_term'");
    }

    const prediction = await predictionDB.queryRow<{
      id: number;
      question: string;
      category: string;
      options: string[];
      required_pt: number;
      closes_at: Date;
      image_url: string | null;
      prediction_type: string;
    }>`
      INSERT INTO predictions (question, category, options, required_pt, closes_at, image_url, prediction_type)
      VALUES (${req.question}, ${req.category}, ${JSON.stringify(req.options)}, ${req.requiredPt}, ${req.closesAt}, ${req.imageUrl || null}, ${req.predictionType})
      RETURNING id, question, category, options, required_pt, closes_at, image_url, prediction_type
    `;

    return {
      id: prediction!.id,
      question: prediction!.question,
      category: prediction!.category,
      options: prediction!.options,
      requiredPt: prediction!.required_pt,
      closesAt: prediction!.closes_at,
      imageUrl: prediction!.image_url || undefined,
      predictionType: prediction!.prediction_type,
    };
  }
);
