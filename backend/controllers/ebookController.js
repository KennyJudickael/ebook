import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import Ebook from "../models/Ebook.js";

// Configurer le stockage Cloudinary pour Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ebooks",
    allowed_formats: ["pdf", "epub"],
    resource_type: "raw", // Important pour EPUB (fichiers non-image)
  },
});

const upload = multer({ storage });

// Contrôleur pour uploader un ebook
export const uploadEbook = [
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("Début de l’upload...");
      console.log("Fichier reçu :", req.file);
      console.log("Données du corps :", req.body);

      const { title, author } = req.body;

      if (!req.file) {
        console.log("Aucun fichier détecté");
        return res.status(400).json({ message: "Aucun fichier envoyé" });
      }

      console.log("Type MIME du fichier :", req.file.mimetype);
      const fileType =
        req.file.mimetype === "application/epub+zip" ? "epub" : "pdf";
      console.log("Type de fichier attribué :", fileType);

      const ebook = new Ebook({
        user: req.user.id,
        title,
        author,
        fileUrl: req.file.path,
        fileType,
      });
      console.log("Ebook avant sauvegarde :", ebook);
      await ebook.save();
      console.log("Ebook sauvegardé avec succès");

      res.status(201).json({
        message: "Ebook uploadé avec succès",
        ebook: {
          id: ebook._id,
          title: ebook.title,
          author: ebook.author,
          fileUrl: ebook.fileUrl,
          fileType: ebook.fileType,
        },
      });
    } catch (err) {
      console.error("Erreur détaillée lors de l’upload :", err.stack); // Log complet
      res.status(500).json({
        message: "Erreur serveur lors de l’upload",
        error: err.message,
      });
    }
  },
];
