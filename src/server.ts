import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { AppDataSource } from "./database/data-source";
import routes from "./routes";
import { errors } from "celebrate";
//import admin, { initializeApp  } from 'firebase-admin'
//import * as serviceAccount from '../firebase-sdk.json'
import path from "path";

export let connection: DataSource;
const PORT = process.env.PORT || 4001;

const app = express();

app.use(express.json());

app.use(cors({
  origin: "https://frontend-pepvagas-3.onrender.com", // Substitua pelo URL exato do seu frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(routes);

AppDataSource.initialize().then(c => {
  connection = c;
  c.runMigrations();
  runBackend();
})
.catch(e => {
  console.error(`Failed to create a connection:`);
  console.error(e);
});

//admin.initializeApp({
//    credential: admin.credential.cert(serviceAccount as any),
// });

function runBackend() {
  const app = express();
  app.use(cors({
    origin: "https://frontend-pepvagas-3.onrender.com", // Substitua pelo URL exato do seu frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  app.use(express.json());
  app.use(routes);
  app.use(errors());
  app.use("/images", express.static(path.join("..", "..", "/uploads")))
  app.use("/files", express.static(path.join("..", "..", "/files")))
  app.listen(PORT, () => console.log(`[.] Backend iniciado com sucesso!, porta: ${PORT}`));
}
