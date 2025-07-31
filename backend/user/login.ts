import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";
import bcrypt from "bcrypt";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    username: string;
    ptBalance: number;
    etBalance: number;
    streak: number;
    joinDate: Date;
  };
  token: string;
}

// Logs in a user with email and password.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/user/login" },
  async (req) => {
    if (!req.email || !req.password) {
      throw APIError.invalidArgument("email and password are required");
    }

    // Find user by email
    const user = await userDB.queryRow<{
      id: number;
      email: string;
      username: string;
      password_hash: string;
      pt_balance: number;
      et_balance: number;
      streak: number;
      join_date: Date;
    }>`
      SELECT id, email, username, password_hash, pt_balance, et_balance, streak, join_date
      FROM users WHERE email = ${req.email}
    `;

    if (!user) {
      throw APIError.unauthenticated("invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(req.password, user.password_hash);
    if (!isValid) {
      throw APIError.unauthenticated("invalid email or password");
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        ptBalance: user.pt_balance,
        etBalance: user.et_balance,
        streak: user.streak,
        joinDate: user.join_date,
      },
      token,
    };
  }
);
