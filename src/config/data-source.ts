import { DataSource } from "typeorm";
import { env } from "./env";
import path from "path";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.dbUrl,
  ssl: { rejectUnauthorized: false },
  synchronize: false, // Migrations enabled, so sync is false
  logging: env.nodeEnv === "development",
  entities: [path.join(__dirname, "../modules/**/entities/*.entity.{ts,js}")],
  migrations: [path.join(__dirname, "../shared/migrations/*.{ts,js}")],
  subscribers: [],
});
