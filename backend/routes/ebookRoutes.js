import express from "express";
import { uploadEbook } from "../controllers/ebookController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Route pour uploader un ebook (protégée par auth)
router.post("/upload", auth, uploadEbook);

export default router;
