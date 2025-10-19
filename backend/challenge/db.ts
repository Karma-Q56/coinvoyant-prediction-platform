import { SQLDatabase } from "encore.dev/storage/sqldb";

export const challengeDB = new SQLDatabase("challenge", {
  migrations: "./migrations",
});
