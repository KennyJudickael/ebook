const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware"); // Assure-toi que cette exportation existe
const Ebook = require("../models/Ebook");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

// Configuration de Multer avec Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ebooks", // Dossier où seront stockés les fichiers
    format: async (req, file) => "pdf", // Forcer le format PDF
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const upload = multer({ storage });

const getCloudinaryPublicId = (url) => {
  const parts = url.split("/");
  return parts[parts.length - 1].split(".")[0]; // Extrait l'ID sans l'extension
};

// Route pour ajouter un ebook avec Cloudinary
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const { title, author } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier envoyé." });
    }

    const newEbook = new Ebook({
      user: req.user.id,
      title,
      author,
      fileUrl: req.file.path, // L'URL Cloudinary sera stockée ici
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
router.put("/:id", protect, upload.single("file"), async (req, res) => {
  try {
    const { title, author } = req.body;

    let ebook = await Ebook.findById(req.params.id);
    if (!ebook) {
      return res.status(404).json({ message: "Ebook non trouvé" });
    }

    if (ebook.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Non autorisé à modifier cet ebook" });
    }

    // Si un nouveau fichier est uploadé, supprimer l'ancien fichier de Cloudinary
    let newFileUrl = ebook.fileUrl;
    if (req.file) {
      const publicId = getCloudinaryPublicId(ebook.fileUrl);
      await cloudinary.uploader.destroy(`ebooks/${publicId}`);
      newFileUrl = req.file.path; // Nouvelle URL du fichier Cloudinary
    }

    // Mise à jour des champs
    ebook.title = title || ebook.title;
    ebook.author = author || ebook.author;
    ebook.fileUrl = newFileUrl;

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

    // Vérifie si l'utilisateur est bien le propriétaire
    if (ebook.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Non autorisé à supprimer cet ebook" });
    }

    // Supprimer le fichier sur Cloudinary
    const publicId = getCloudinaryPublicId(ebook.fileUrl);
    await cloudinary.uploader.destroy(`ebooks/${publicId}`);

    // Supprimer l'ebook de la base de données
    await ebook.deleteOne();

    res.json({ message: "Ebook supprimé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de l'ebook", error });
  }
});

module.exports = router;
