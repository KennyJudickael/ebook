const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Route de test
app.get("/api/status", (req, res) => {
  res.json({ message: "API is running" });
});

// Servir les fichiers uploads
app.use("/uploads", express.static("uploads"));

// Monter les routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/ebooks", require("./routes/ebookRoutes"));

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
