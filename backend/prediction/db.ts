import { SQLDatabase } from "encore.dev/storage/sqldb";

export const predictionDB = new SQLDatabase("prediction", {
  migrations: "./migrations",
});
