import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import ebookRoutes from "./routes/ebookRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
try {
  await mongoose.connect(process.env.MONGO_URI); // Plus besoin des options ici
  console.log("MongoDB connecté !");
} catch (err) {
  console.error("Erreur de connexion MongoDB :", err);
  process.exit(1);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ebooks", ebookRoutes);

// Route de test
app.get("/", (req, res) => res.send("Serveur en marche !"));

// Démarrage
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
