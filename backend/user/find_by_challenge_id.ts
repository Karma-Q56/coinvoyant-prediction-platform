import { api, APIError } from "encore.dev/api";
import { userDB } from "./db";

export interface FindByChallengeIdRequest {
  challengeId: string;
}

export interface UserBasicInfo {
  id: number;
  username: string;
  ptBalance: number;
}

export const findByChallengeId = api<FindByChallengeIdRequest, UserBasicInfo>(
  { method: "GET", path: "/user/find-by-challenge-id/:challengeId", expose: false },
  async (req) => {
    const user = await userDB.queryRow<{
      id: number;
      username: string;
      pt_balance: number;
    }>`
      SELECT id, username, pt_balance FROM users WHERE challenge_id = ${req.challengeId}
    `;

    if (!user) {
      throw APIError.notFound("User with challenge ID not found");
    }

    return {
      id: user.id,
      username: user.username,
      ptBalance: user.pt_balance,
    };
  }
);
