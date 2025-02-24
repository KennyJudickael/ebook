import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

dotenv.config();

const router = express.Router();

// Inscription
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Le nom est requis"),
    body("email").isEmail().withMessage("Email invalide"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit avoir au moins 6 caractères"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Vérifier si l’utilisateur existe déjà
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Créer un nouvel utilisateur
      user = new User({
        name,
        email,
        password: hashedPassword,
      });

      await user.save();

      // Générer un token JWT
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Réponse avec message + token
      res.status(201).json({
        message: "Utilisateur créé avec succès",
        token: token, // Token bien visible
      });
    } catch (err) {
      console.error("Erreur lors de l’inscription :", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// Connexion
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email invalide"),
    body("password").notEmpty().withMessage("Le mot de passe est requis"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Vérifier l’utilisateur
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Identifiants invalides" });
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Identifiants invalides" });
      }

      // Générer un token JWT
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Réponse avec message + token
      res.json({
        message: "Connexion réussie",
        token: token, // Token bien visible
      });
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

export default router;
