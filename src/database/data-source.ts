import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
//dotenv.config({ path: __dirname + "/../.env" });
dotenv.config();



//const port = process.env.DB_PORT as number | undefined;

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost", // Usa DB_HOST do Render ou localhost
  port: parseInt(process.env.DB_PORT || "3306"), // Garante que seja número
  username: process.env.DB_USER || "root", // Nome do usuário do MySQL
  password: process.env.DB_PASSWORD || "", // Senha do MySQL
  database: process.env.DB_NAME || "db_pepvagas", // Nome do banco
  migrationsRun: true,
  synchronize: true, // Cuidado: deixe 'false' em produção!
  logging: false,
  entities: [__dirname + "/models/*.{ts,js}"],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  subscribers: [],
});
