const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware"); // Assure-toi que cette exportation existe
const Ebook = require("../models/Ebook");

const router = express.Router();

// Configuration de multer pour l'upload des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Dossier où enregistrer les fichiers
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Ajouter un ebook
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const { title, author } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier envoyé." });
    }

    const newEbook = new Ebook({
      user: req.user.id, // Assure-toi que req.user est correctement défini par ton middleware
      title,
      author,
      fileUrl: req.file.path, // Chemin du fichier stocké
    });

    await newEbook.save();
    res
      .status(201)
      .json({ message: "Ebook ajouté avec succès", ebook: newEbook });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de l'ajout de l'ebook", error });
  }
});

module.exports = router;
