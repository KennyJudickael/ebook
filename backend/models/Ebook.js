const mongoose = require("mongoose");

const ebookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  author: { type: String },
  fileUrl: { type: String, required: true }, // URL du fichier stocké
  createdAt: { type: Date, default: Date.now },
});

const Ebook = mongoose.model("Ebook", ebookSchema);
module.exports = Ebook;
