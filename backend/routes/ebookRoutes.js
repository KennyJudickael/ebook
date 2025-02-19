const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");

// Route protégée (exemple : récupérer les ebooks de l'utilisateur)
router.get("/my-ebooks", authenticateUser, (req, res) => {
  res.json({ message: "Voici tes ebooks", user: req.user });
});

module.exports = router;
