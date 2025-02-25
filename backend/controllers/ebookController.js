import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import Ebook from "../models/Ebook.js";

const upload = multer({ storage: multer.memoryStorage() });

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

      const stream = streamifier.createReadStream(req.file.buffer);
      const options = {
        folder: "ebooks",
        resource_type: "raw",
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        async (error, result) => {
          if (error) {
            console.error("Erreur d'upload sur Cloudinary :", error);
            return res
              .status(500)
              .json({ message: "Erreur lors de l'upload sur Cloudinary" });
          }

          const { title, author } = req.body;
          const fileType =
            req.file.mimetype === "application/epub+zip" ? "epub" : "pdf";
          const ebook = new Ebook({
            user: req.user.id,
            title,
            author,
            fileUrl: result.secure_url,
            fileType,
          });

          await ebook.save();
          console.log("Ebook sauvegardé :", ebook); // Log une seule fois après sauvegarde
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
        }
      );

      stream.pipe(uploadStream);
    } catch (error) {
      console.error("Erreur lors de l’upload :", error.stack);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },
];
