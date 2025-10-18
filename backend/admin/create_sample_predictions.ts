import { api, APIError } from "encore.dev/api";
import { predictionDB } from "../prediction/db";
import { userDB } from "../user/db";

export interface CreateSamplePredictionsRequest {
  userId: number;
}

export interface CreateSamplePredictionsResponse {
  created: number;
  message: string;
}

// List of admin email addresses
const ADMIN_EMAILS = [
  "ragnarokq56@gmail.com",
];

// Creates sample predictions for testing (admin only).
export const createSamplePredictions = api<CreateSamplePredictionsRequest, CreateSamplePredictionsResponse>(
  { expose: true, method: "POST", path: "/admin/create-sample-predictions" },
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

    // Check if predictions already exist
    const existingPredictions = await predictionDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM predictions
    `;

    if (existingPredictions && existingPredictions.count > 0) {
      return {
        created: 0,
        message: "Sample predictions already exist",
      };
    }

    const samplePredictions = [
      {
        question: "Will Bitcoin reach $100,000 by the end of 2024?",
        category: "Cryptocurrency",
        options: ["Yes", "No"],
        requiredPt: 10,
        closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        predictionType: "long_term",
        imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400",
        odds: { "Yes": 3.5, "No": 1.5 }
      },
      {
        question: "Who will win the next major esports tournament?",
        category: "Gaming",
        options: ["Team Alpha", "Team Beta", "Team Gamma", "Other"],
        requiredPt: 5,
        closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        predictionType: "long_term",
        imageUrl: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400",
        odds: { "Team Alpha": 2.5, "Team Beta": 3.0, "Team Gamma": 4.0, "Other": 5.0 }
      },
      {
        question: "Will it rain tomorrow?",
        category: "Weather",
        options: ["Yes", "No"],
        requiredPt: 1,
        closesAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        predictionType: "daily",
        imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400",
        odds: { "Yes": 2.0, "No": 2.0 }
      },
      {
        question: "Which movie will top the box office this weekend?",
        category: "Entertainment",
        options: ["Movie A", "Movie B", "Movie C"],
        requiredPt: 5,
        closesAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        predictionType: "daily",
        imageUrl: "https://images.unsplash.com/photo-1489599735734-79b4fc81f6c2?w=400",
        odds: { "Movie A": 2.2, "Movie B": 2.8, "Movie C": 3.5 }
      },
      {
        question: "Will the stock market close higher today?",
        category: "Finance",
        options: ["Higher", "Lower", "Unchanged"],
        requiredPt: 3,
        closesAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        predictionType: "daily",
        odds: { "Higher": 2.5, "Lower": 2.5, "Unchanged": 4.0 }
      },
      {
        question: "Which team will win the championship?",
        category: "Sports",
        options: ["Team Red", "Team Blue"],
        requiredPt: 15,
        closesAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        predictionType: "long_term",
        imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400",
        odds: { "Team Red": 1.8, "Team Blue": 2.2 }
      }
    ];

    let created = 0;
    for (const prediction of samplePredictions) {
      try {
        await predictionDB.exec`
          INSERT INTO predictions (question, category, options, required_pt, closes_at, image_url, prediction_type, odds)
          VALUES (${prediction.question}, ${prediction.category}, ${JSON.stringify(prediction.options)}, ${prediction.requiredPt}, ${prediction.closesAt}, ${prediction.imageUrl || null}, ${prediction.predictionType}, ${JSON.stringify(prediction.odds)})
        `;
        created++;
      } catch (error) {
        console.error('Error creating sample prediction:', error);
      }
    }

    return {
      created,
      message: `Successfully created ${created} sample predictions`,
    };
  }
);
