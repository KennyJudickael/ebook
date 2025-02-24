import mongoose from "mongoose";

const ebookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  author: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ["pdf", "epub"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ebook", ebookSchema);
