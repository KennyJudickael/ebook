import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import ebookRoutes from "./routes/ebookRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connecté !");
} catch (err) {
  console.error("Erreur de connexion MongoDB :", err);
  process.exit(1);
}

app.use("/api/auth", authRoutes);
app.use("/api/ebooks", ebookRoutes);

app.get("/", (req, res) => res.send("Serveur en marche !"));

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
