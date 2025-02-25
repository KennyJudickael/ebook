import express from "express";
import {
  getEbookContent,
  getEbooks,
  uploadEbook,
} from "../controllers/ebookController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Route pour uploader un ebook (protégée par auth)
router.post("/upload", auth, uploadEbook);

// Route pour recuperer les ebooks par utilisateur
router.get("/", auth, getEbooks);

//Route pour recuperer le contenu d'un ebook
router.get("/:id/content", auth, getEbookContent);

export default router;
