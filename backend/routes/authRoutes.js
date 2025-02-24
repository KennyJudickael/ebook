import express from "express";
import { body, validationResult } from "express-validator";
import { login, register } from "../controllers/authController.js";

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
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    register(req, res); // Appelle le contrôleur
  }
);

// Connexion
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email invalide"),
    body("password").notEmpty().withMessage("Le mot de passe est requis"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    login(req, res); // Appelle le contrôleur
  }
);

export default router;
