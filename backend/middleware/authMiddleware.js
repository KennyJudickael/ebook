const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Accès refusé. Aucun token fourni." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Assure-toi que decoded contient bien { id: ... } ou adapte ton code
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide." });
  }
};

module.exports = { protect };
