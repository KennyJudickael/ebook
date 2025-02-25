import { createRequire } from "module";
import multer from "multer";
import fetch from "node-fetch";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import Ebook from "../models/Ebook.js";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const parseEpubModule = require("@gxl/epub-parser");
const parseEpub = parseEpubModule.default || parseEpubModule;

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

export const getEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find({ user: req.user.id });
    console.log("Ebooks récupérés :", ebooks);
    res.json({
      message: "Liste des ebooks récupérée avec succès",
      ebooks: ebooks.map((ebook) => ({
        id: ebook._id,
        title: ebook.title,
        author: ebook.author,
        fileUrl: ebook.fileUrl,
        fileType: ebook.fileType,
        createdAt: ebook.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des ebooks :", error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getEbookContent = async (req, res) => {
  try {
    const ebookId = req.params.id;
    const ebook = await Ebook.findOne({ _id: ebookId, user: req.user.id });

    if (!ebook) {
      return res.status(404).json({ message: "Ebook non trouvé" });
    }

    // Télécharger le fichier depuis Cloudinary
    const response = await fetch(ebook.fileUrl);
    if (!response.ok) {
      throw new Error("Erreur lors du téléchargement du fichier");
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pages = [];

    if (ebook.fileType === "pdf") {
      const data = await pdfParse(buffer);
      const text = data.text;
      const pageSize = 1000;
      for (let i = 0; i < text.length; i += pageSize) {
        pages.push(text.slice(i, i + pageSize));
      }
    } else if (ebook.fileType === "epub") {
      const epubData = await parseEpub(buffer);
      pages = epubData.sections.map((section) => section.textContent || "");
    } else {
      return res.status(400).json({ message: "Type de fichier non supporté" });
    }

    console.log(
      `Contenu extrait pour ${ebook.fileType}, ${pages.length} pages`
    );
    res.json({
      message: "Contenu extrait avec succès",
      ebookId: ebook._id,
      fileType: ebook.fileType,
      pages,
    });
  } catch (error) {
    console.error("Erreur lors de l’extraction du contenu :", error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
