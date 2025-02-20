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

// Récupérer tous les ebooks
router.get("/", protect, async (req, res) => {
  try {
    const ebooks = await Ebook.find({ user: req.user.id });
    res.json(ebooks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des ebooks", error });
  }
});

// Récupérer un ebook par son ID
router.get("/:id", protect, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) {
      return res.status(404).json({ message: "Ebook non trouvé" });
    }
    res.json(ebook);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'ebook", error });
  }
});

// Modifier un ebook
router.put("/:id", protect, async (req, res) => {
  try {
    const { title, author } = req.body;

    let ebook = await Ebook.findById(req.params.id);
    if (!ebook) {
      return res.status(404).json({ message: "Ebook non trouvé" });
    }

    // Vérifie si l'utilisateur est bien le propriétaire de l'ebook
    if (ebook.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Non autorisé à modifier cet ebook" });
    }

    // Mise à jour des champs
    ebook.title = title || ebook.title;
    ebook.author = author || ebook.author;

    await ebook.save();
    res.json({ message: "Ebook mis à jour avec succès", ebook });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour de l'ebook", error });
  }
});

// Supprimer un ebook
router.delete("/:id", protect, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) {
      return res.status(404).json({ message: "Ebook non trouvé" });
    }

    // Vérifie si l'utilisateur est bien le propriétaire de l'ebook
    if (ebook.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Non autorisé à supprimer cet ebook" });
    }

    await ebook.deleteOne();
    res.json({ message: "Ebook supprimé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de l'ebook", error });
  }
});

module.exports = router;
