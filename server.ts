import express from "express";
import path from "path";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

// Initialize server
const app = express();
app.use(express.json());
const PORT = 3000;

const COLLECTIONS = {
  OTPS: "otps_internal", // Using a separate collection for internal OTP storage
};

// Router for API routes to handle Netlify/Vercel function pathing
const router = express.Router();

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
