import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export default async function auth(req, res, next) {
  const token = req.header("x-auth-token"); // Token envoyé dans l’en-tête

  if (!token) {
    return res.status(401).json({ message: "Aucun token, accès refusé" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Ajoute l’ID utilisateur à la requête
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
}
