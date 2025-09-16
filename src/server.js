import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { pipeline, env } from "@xenova/transformers";

// ==============================
// Global Env Config
// ==============================
env.allowLocalModels = true;   // allow local ONNX models
env.useBrowserCache = false;

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Multer upload
const upload = multer({ dest: "uploads/" });

// ==============================
// Load Models
// ==============================
let transcriber, summarizer;

async function loadModels() {
  console.log("Loading models...");

  // Whisper ASR
  transcriber = await pipeline(
    "automatic-speech-recognition",
    "Xenova/whisper-tiny.en"
  );

  // Try custom summarizer first
  try {
    summarizer = await pipeline(
      "summarization",
      "CodeXRyu/meeting-summarizer", // 👈 use your repo
      {
        authToken: process.env.HF_TOKEN, // only needed if private
      }
    );
    console.log("✅ Custom summarizer loaded.");
  } catch (err) {
    console.error("❌ Failed to load custom summarizer:", err.message);
    console.log("➡️ Falling back to default summarizer...");
    summarizer = await pipeline(
      "summarization",
      "Xenova/distilbart-cnn-12-6"
    );
    console.log("✅ Default summarizer loaded as fallback.");
  }

  console.log("Models ready ✅");
}
loadModels();

// ==============================
// Utility: Clean Transcript
// ==============================
function cleanTranscript(text) {
  return text.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

// ==============================
// Utility: Enhanced Meeting Summary
// ==============================
function generateFallbackSummary(originalTranscript, cleanedTranscript) {
  if (!originalTranscript || originalTranscript.trim().length < 20) {
    return "The audio is too short. No meaningful conversation detected.";
  }
  if (!cleanedTranscript || cleanedTranscript.length < 10) {
    return "This audio mainly contains background sounds or unclear speech. No meaningful transcript available.";
  }
  return null;
}

// ==============================
// Meeting Context Helper
// ==============================
function prepareMeetingText(transcript, context) {
  let textForSummary = `summarize: ${transcript}`;
  if (context) {
    textForSummary = `summarize: Meeting Context: ${context}\n\nTranscript: ${transcript}`;
  }
  return textForSummary;
}

// ==============================
// Convert to WAV (16kHz mono)
// ==============================
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(["-ar 16000", "-ac 1", "-f wav"])
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err));
  });
}

// ==============================
// Decode WAV into Float32Array
// ==============================
function readWavAsFloat32Array(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pcmData = buffer.subarray(44); // skip header

  const int16View = new Int16Array(
    pcmData.buffer,
    pcmData.byteOffset,
    pcmData.byteLength / Int16Array.BYTES_PER_ELEMENT
  );

  const float32Data = new Float32Array(int16View.length);
  for (let i = 0; i < int16View.length; i++) {
    float32Data[i] = int16View[i] / 32768;
  }
  return float32Data;
}

// ==============================
// Upload Route
// ==============================
app.post("/upload", upload.single("file"), async (req, res) => {
  let filePath, wavPath;
  try {
    filePath = req.file.path;
    wavPath = `${filePath}.wav`;
    const { context } = req.body;

    console.log("Converting to WAV...");
    await convertToWav(filePath, wavPath);

    console.log("Reading WAV as Float32...");
    const audioData = readWavAsFloat32Array(wavPath);

    console.log("Transcribing...");
    const result = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    const transcription = result.text.trim();
    const cleanedTranscript = cleanTranscript(transcription);

    // Short/fallback check
    const fallbackMsg = generateFallbackSummary(transcription, cleanedTranscript);
    if (fallbackMsg) {
      return res.json({ transcription, summary: fallbackMsg });
    }

    console.log("Summarizing...");
    const textForSummary = prepareMeetingText(cleanedTranscript, context);

    const summaryResult = await summarizer(textForSummary, {
      max_length: 128,
      min_length: 25,
      num_beams: 2,
      length_penalty: 2.0,
      early_stopping: true,
    });

    res.json({
      transcription,
      summary: summaryResult[0].summary_text,
    });
  } catch (err) {
    console.error("Processing failed:", err);
    res.status(500).json({ error: err.message });
  } finally {
    // Cleanup
    try {
      if (filePath) fs.unlinkSync(filePath);
      if (wavPath) fs.unlinkSync(wavPath);
    } catch {}
  }
});

// ==============================
// Test Route
// ==============================
app.post("/test-summary", express.json(), async (req, res) => {
  try {
    const { text, context } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const textForSummary = prepareMeetingText(text, context);
    const summaryResult = await summarizer(textForSummary, {
      max_length: 128,
      min_length: 25,
      num_beams: 2,
      length_penalty: 2.0,
      early_stopping: true,
    });

    res.json({
      original_text: text,
      summary: summaryResult[0].summary_text,
    });
  } catch (err) {
    console.error("Summary test failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// Start Server
// ==============================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📝 Test your custom model at: POST /test-summary`);
});
