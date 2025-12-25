import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface GetUsernameRequest {
  userId: number;
}

export interface GetUsernameResponse {
  username: string;
}

export const getUsername = api<GetUsernameRequest, GetUsernameResponse>(
  { method: "GET", path: "/user/:userId/username", expose: false },
  async (req) => {
    const user = await userDB.queryRow<{ username: string }>`
      SELECT username FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    return {
      username: user.username,
    };
  }
);
