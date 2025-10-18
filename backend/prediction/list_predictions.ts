import { api } from "encore.dev/api";
import { predictionDB } from "./db";
import { Query } from "encore.dev/api";

export interface ListPredictionsRequest {
  category?: Query<string>;
  status?: Query<string>;
  predictionType?: Query<string>;
}

export interface Prediction {
  id: number;
  question: string;
  category: string;
  options: string[];
  status: string;
  correctOption?: string;
  requiredPt: number;
  createdAt: Date;
  closesAt: Date;
  voteCounts: Record<string, number>;
  imageUrl?: string;
  predictionType: string;
  odds: Record<string, number>;
}

export interface ListPredictionsResponse {
  predictions: Prediction[];
}

// Lists all predictions with optional filtering.
export const listPredictions = api<ListPredictionsRequest, ListPredictionsResponse>(
  { expose: true, method: "GET", path: "/predictions" },
  async (req) => {
    console.log('List predictions called with params:', req);
    
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (req.category) {
      whereClause += ` AND p.category = $${params.length + 1}`;
      params.push(req.category);
    }

    if (req.status) {
      whereClause += ` AND p.status = $${params.length + 1}`;
      params.push(req.status);
    }

    if (req.predictionType) {
      whereClause += ` AND p.prediction_type = $${params.length + 1}`;
      params.push(req.predictionType);
    }

    const query = `
      SELECT p.id, p.question, p.category, p.options, p.status, p.correct_option,
             p.required_pt, p.created_at, p.closes_at, p.image_url, p.prediction_type, p.odds
      FROM predictions p
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    console.log('Executing query:', query, 'with params:', params);

    try {
      const predictions = await predictionDB.rawQueryAll<{
        id: number;
        question: string;
        category: string;
        options: string[];
        status: string;
        correct_option: string | null;
        required_pt: number;
        created_at: Date;
        closes_at: Date;
        image_url: string | null;
        prediction_type: string;
        odds: Record<string, number> | null;
      }>(query, ...params);

      console.log('Raw predictions result:', predictions);

      // Get vote counts for each prediction
      const predictionIds = predictions.map(p => p.id);
      const voteCounts = new Map<number, Record<string, number>>();

      if (predictionIds.length > 0) {
        const votes = await predictionDB.queryAll<{
          prediction_id: number;
          option_selected: string;
          vote_count: number;
        }>`
          SELECT prediction_id, option_selected, COUNT(*) as vote_count
          FROM votes
          WHERE prediction_id = ANY(${predictionIds})
          GROUP BY prediction_id, option_selected
        `;

        console.log('Vote counts result:', votes);

        votes.forEach(vote => {
          if (!voteCounts.has(vote.prediction_id)) {
            voteCounts.set(vote.prediction_id, {});
          }
          voteCounts.get(vote.prediction_id)![vote.option_selected] = vote.vote_count;
        });
      }

      const result = {
        predictions: predictions.map(p => ({
          id: p.id,
          question: p.question,
          category: p.category,
          options: p.options,
          status: p.status,
          correctOption: p.correct_option || undefined,
          requiredPt: p.required_pt,
          createdAt: p.created_at,
          closesAt: p.closes_at,
          voteCounts: voteCounts.get(p.id) || {},
          imageUrl: p.image_url || undefined,
          predictionType: p.prediction_type,
          odds: p.odds || {},
        })),
      };

      console.log('Final result:', result);
      return result;
    } catch (error) {
      console.error('Error in listPredictions:', error);
      throw error;
    }
  }
);
