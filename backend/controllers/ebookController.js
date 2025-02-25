import fs from "fs/promises";
import { createRequire } from "module";
import multer from "multer";
import pdfParse from "pdf-parse";
import Ebook from "../models/Ebook.js";
const require = createRequire(import.meta.url);
const parseEpubModule = require("@gxl/epub-parser");
const parseEpub = parseEpubModule.default || parseEpubModule;

// Configurer Multer pour le stockage local
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

export const uploadEbook = [
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("Début de l’upload...");
      console.log("Fichier reçu :", req.file);
      console.log("Données du corps :", req.body);

      if (!req.file) {
        console.log("Aucun fichier détecté");
        return res.status(400).json({ message: "Aucun fichier téléchargé" });
      }

      const { title, author } = req.body;
      const fileType =
        req.file.mimetype === "application/epub+zip" ? "epub" : "pdf";

      const ebook = new Ebook({
        user: req.user.id,
        title,
        author,
        fileUrl: req.file.path,
        fileType,
      });

      await ebook.save();
      console.log("Ebook sauvegardé :", ebook);

      res.status(201).json({
        message: "Fichier téléchargé avec succès",
        ebook: {
          id: ebook._id,
          title: ebook.title,
          author: ebook.author,
          fileUrl: ebook.fileUrl,
          fileType: ebook.fileType,
        },
      });
    } catch (error) {
      console.error("Erreur lors de l’upload :", error.stack);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },
];

export const getEbookContent = async (req, res) => {
  try {
    const ebookId = req.params.id;
    const ebook = await Ebook.findOne({ _id: ebookId, user: req.user.id });

    if (!ebook) {
      return res.status(404).json({ message: "Ebook non trouvé" });
    }

    const buffer = await fs.readFile(ebook.fileUrl);
    let content;

    if (ebook.fileType === "pdf") {
      const data = await pdfParse(buffer);
      content = data.text; // Texte brut complet
    } else if (ebook.fileType === "epub") {
      const epubData = await parseEpub(buffer);
      content = epubData.sections.map((section) => ({
        id: section.id,
        text: section.textContent || "",
      })); // Sections structurées
    } else {
      return res.status(400).json({ message: "Type de fichier non supporté" });
    }

    console.log(`Contenu extrait pour ${ebook.fileType}`);
    res.json({
      message: "Contenu extrait avec succès",
      ebookId: ebook._id,
      fileType: ebook.fileType,
      content,
    });
  } catch (error) {
    console.error("Erreur lors de l’extraction du contenu :", error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
