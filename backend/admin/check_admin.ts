import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const userDB = SQLDatabase.named("user");

export interface CheckAdminRequest {
  userId: number;
}

export interface CheckAdminResponse {
  isAdmin: boolean;
}

// List of admin email addresses
const ADMIN_EMAILS = [
  "ragnarokq56@gmail.com",
];

// Checks if a user has admin privileges based on their email.
export const checkAdmin = api<CheckAdminRequest, CheckAdminResponse>(
  { expose: true, method: "GET", path: "/admin/check/:userId" },
  async (req) => {
    const user = await userDB.queryRow<{
      email: string;
    }>`
      SELECT email FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      return {
        isAdmin: false,
      };
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

    return {
      isAdmin,
    };
  }
);
