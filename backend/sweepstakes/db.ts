import { SQLDatabase } from "encore.dev/storage/sqldb";

export const sweepstakesDB = new SQLDatabase("sweepstakes", {
  migrations: "./migrations",
});
