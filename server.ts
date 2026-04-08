import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin if credentials are provided
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
} else {
  console.warn("⚠️ Firebase Admin credentials missing. Custom token minting will fail.");
}

const app = express();
app.use(express.json());
const PORT = 3000;

// In-memory OTP store (For production, use Redis or Firestore with TTL)
const otpStore = new Map<string, { code: string, expiresAt: number }>();

app.post("/api/auth/check-user", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });

    if (!getApps().length) {
       return res.status(500).json({ error: "Firebase Admin not configured." });
    }

    const uid = phoneNumber.replace(/\D/g, '');
    try {
      await getAuth().getUser(uid);
      res.json({ exists: true });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        res.json({ exists: false });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Check user error:", error);
    res.status(500).json({ error: error.message || "Failed to check user" });
  }
});

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { phoneNumber, channel } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phoneNumber, { code: otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`[OTP Store] Saved OTP for ${phoneNumber}`);

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      if (channel === 'whatsapp') {
        if (!process.env.TWILIO_WHATSAPP_NUMBER) {
          return res.status(400).json({ error: "Twilio WhatsApp number not configured" });
        }
        await client.messages.create({
          body: `Your KALAA login code is ${otp}`,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${phoneNumber}`
        });
      } else {
        if (!process.env.TWILIO_PHONE_NUMBER) {
          return res.status(400).json({ error: "Twilio SMS number not configured" });
        }
        await client.messages.create({
          body: `Your KALAA login code is ${otp}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
      }
      console.log(`Sent OTP via ${channel} to ${phoneNumber}`);
    } else {
      // Fallback for development if Twilio is not configured
      console.log(`[DEV MODE] Twilio not configured. OTP for ${phoneNumber} is ${otp} (Channel: ${channel})`);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: error.message || "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    console.log(`[OTP Store] Verifying OTP for ${phoneNumber}. Provided: ${otp}`);
    const stored = otpStore.get(phoneNumber);

    if (!stored) {
      console.log(`[OTP Store] No OTP found for ${phoneNumber}`);
      return res.status(400).json({ error: "No OTP request found for this number. Please request a new OTP." });
    }

    if (Date.now() > stored.expiresAt) {
      console.log(`[OTP Store] OTP expired for ${phoneNumber}`);
      otpStore.delete(phoneNumber);
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (stored.code !== otp) {
      console.log(`[OTP Store] Invalid OTP for ${phoneNumber}. Expected: ${stored.code}, Got: ${otp}`);
      return res.status(400).json({ error: "Incorrect OTP. Please try again." });
    }

    // Clear OTP after successful verification
    otpStore.delete(phoneNumber);
    console.log(`[OTP Store] OTP verified successfully for ${phoneNumber}`);

    // Mint custom token
    if (!getApps().length) {
       console.error("[Firebase Admin] Not configured. Cannot mint token.");
       return res.status(500).json({ error: "Server Configuration Error: Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing in the environment variables. Cannot log you in." });
    }

    // Use phone number as UID
    const uid = phoneNumber.replace(/\D/g, '');
    const customToken = await getAuth().createCustomToken(uid);
    console.log(`[Firebase Admin] Minted custom token for UID: ${uid}`);

    res.json({ success: true, token: customToken });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: error.message || "Failed to verify OTP" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

startServer();
