// server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


function convertToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat("mp3")
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
}

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedPath = req.file.path;
    const convertedPath = path.join("uploads", `${Date.now()}.mp3`);

    await convertToMp3(uploadedPath, convertedPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(convertedPath),
      model: "whisper-1"
    });

    const summaryPrompt = `Summarize the following meeting transcript:\n\n${transcription.text}`;
    const summary = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: summaryPrompt }]
    });

    fs.unlinkSync(uploadedPath);
    fs.unlinkSync(convertedPath);

    res.json({
      transcript: transcription.text,
      summary: summary.choices[0].message.content
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
