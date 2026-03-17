import { DataSource } from "typeorm";
import path from "path";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "../modules/**/entities/*.entity.{ts,js}")],
  migrations: [path.join(__dirname, "../shared/migrations/*.{ts,js}")],
  subscribers: [],
});
