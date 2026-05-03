import express from "express";
import path from "path";
import twilio from "twilio";
import dotenv from "dotenv";
import multer from "multer";
import admin from "firebase-admin";
import { Bucket } from "@google-cloud/storage";
import fs from "fs";

dotenv.config();

// Initialize server
const app = express();
app.use(express.json());
const PORT = 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = express.Router();

router.post("/upload-telegram", upload.single("file"), async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return res.status(500).json({ error: "Telegram configuration missing in Settings (Token or Chat ID)" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("chat_id", chatId);
    formData.append("photo", blob, req.file.originalname);

    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    const result: any = await response.json();
    if (!result.ok) {
      console.error("Telegram API Error:", result);
      throw new Error(result.description);
    }

    // Telegram returns an array of photo sizes, get the largest one
    const photos = result.result.photo;
    const largestPhoto = photos[photos.length - 1];
    const fileId = largestPhoto.file_id;

    // Use a relative URL for better compatibility across dev/shared/prod domains
    const proxyUrl = `/api/file/${fileId}`;
    
    res.json({ 
      url: proxyUrl,
      fileId: fileId,
      name: req.file.originalname 
    });
  } catch (error: any) {
    console.error("Telegram upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/file/:fileId", async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const { fileId } = req.params;

  if (!token) {
    console.error("Proxy Error: TELEGRAM_BOT_TOKEN missing");
    return res.status(500).send("Telegram token missing");
  }

  console.log(`Proxy Request for File ID: ${fileId}`);

  try {
    // 1. Get file path from Telegram
    const pathResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const pathResult: any = await pathResponse.json();
    
    if (!pathResult.ok) {
      console.error("Telegram getFile Error:", pathResult);
      throw new Error(pathResult.description);
    }

    const filePath = pathResult.result.file_path;
    console.log(`Telegram File Path Found: ${filePath}`);
    
    // 2. Stream the file from Telegram to the response
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      console.error(`Failed to fetch file from Telegram storage: ${fileResponse.status}`);
      throw new Error("Failed to fetch file from Telegram");
    }

    // Copy headers (content-type)
    const contentType = fileResponse.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

    // Convert and send
    const arrayBuffer = await fileResponse.arrayBuffer();
    const nodeBuffer = Buffer.from(arrayBuffer);
    res.send(nodeBuffer);
  } catch (error: any) {
    console.error("Telegram proxy error details:", error);
    res.status(500).send(error.message);
  }
});

router.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  });
});

// Mount the router at multiple possible base paths for compatibility
app.use("/api", router);
app.use("/.netlify/functions/api", router);
app.use("/", router);

export { app };

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Start the server only if not in a serverless environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
