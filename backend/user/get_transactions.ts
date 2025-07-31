import { api } from "encore.dev/api";
import { userDB } from "./db";

export interface GetTransactionsRequest {
  userId: number;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
}

// Gets the last 10 transactions for a user.
export const getTransactions = api<GetTransactionsRequest, GetTransactionsResponse>(
  { expose: true, method: "GET", path: "/user/:userId/transactions" },
  async (req) => {
    const transactions = await userDB.queryAll<{
      id: number;
      type: string;
      amount: number;
      currency: string;
      description: string;
      created_at: Date;
    }>`
      SELECT id, type, amount, currency, description, created_at
      FROM transactions
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return {
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        description: t.description || '',
        createdAt: t.created_at,
      })),
    };
  }
);
