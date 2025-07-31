import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import bcrypt from "bcrypt";

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  ptBalance: number;
  etBalance: number;
  streak: number;
  joinDate: Date;
}

// Registers a new user account.
export const register = api<RegisterRequest, User>(
  { expose: true, method: "POST", path: "/user/register" },
  async (req) => {
    // Validate input
    if (!req.email || !req.username || !req.password) {
      throw APIError.invalidArgument("email, username, and password are required");
    }

    if (req.password.length < 6) {
      throw APIError.invalidArgument("password must be at least 6 characters");
    }

    // Check if email or username already exists
    const existingUser = await userDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email} OR username = ${req.username}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("email or username already taken");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(req.password, 10);

    // Create user
    const user = await userDB.queryRow<{
      id: number;
      email: string;
      username: string;
      pt_balance: number;
      et_balance: number;
      streak: number;
      join_date: Date;
    }>`
      INSERT INTO users (email, username, password_hash)
      VALUES (${req.email}, ${req.username}, ${passwordHash})
      RETURNING id, email, username, pt_balance, et_balance, streak, join_date
    `;

    if (!user) {
      throw APIError.internal("failed to create user");
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      ptBalance: user.pt_balance,
      etBalance: user.et_balance,
      streak: user.streak,
      joinDate: user.join_date,
    };
  }
);
