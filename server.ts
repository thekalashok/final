import express from "express";
import path from "path";
import twilio from "twilio";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin if credentials are provided
let dbAdmin: any = null;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    dbAdmin = getFirestore(adminApp);
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
} else {
  console.warn("⚠️ Firebase Admin credentials missing. Custom token minting and persistent OTPs will fail.");
}

const app = express();
app.use(express.json());
const PORT = 3000;

const COLLECTIONS = {
  OTPS: "otps_internal", // Using a separate collection for internal OTP storage
};

// Router for API routes to handle Netlify function pathing
const router = express.Router();

router.post("/auth/check-user", async (req, res) => {
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

router.post("/auth/send-otp", async (req, res) => {
  try {
    const { phoneNumber, channel } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    if (dbAdmin) {
      await dbAdmin.collection(COLLECTIONS.OTPS).doc(phoneNumber).set({
        code: otp,
        expiresAt: expiresAt
      });
      console.log(`[Firestore] Saved OTP for ${phoneNumber}`);
    } else {
      console.warn("[Firestore] Admin DB not initialized. OTP will not be saved persistently.");
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
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
      } catch (twilioError: any) {
        console.error("Twilio API Error:", twilioError);
        if (twilioError.code === 20003) {
          return res.status(500).json({ error: "Twilio Authentication Failed. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in the Netlify Environment Variables." });
        }
        throw twilioError;
      }
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

router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) return res.status(400).json({ error: "Phone number and OTP required" });

    console.log(`[Auth] Verifying OTP for ${phoneNumber}.`);
    
    let stored: { code: string, expiresAt: number } | null = null;

    if (dbAdmin) {
      const otpDoc = await dbAdmin.collection(COLLECTIONS.OTPS).doc(phoneNumber).get();
      if (otpDoc.exists) {
        stored = otpDoc.data() as { code: string, expiresAt: number };
      }
    }

    if (!stored) {
      console.log(`[Auth] No OTP found for ${phoneNumber}`);
      return res.status(400).json({ error: "No OTP request found for this number. Please request a new OTP." });
    }

    if (Date.now() > stored.expiresAt) {
      console.log(`[Auth] OTP expired for ${phoneNumber}`);
      if (dbAdmin) await dbAdmin.collection(COLLECTIONS.OTPS).doc(phoneNumber).delete();
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (stored.code !== otp) {
      console.log(`[Auth] Invalid OTP for ${phoneNumber}.`);
      return res.status(400).json({ error: "Incorrect OTP. Please try again." });
    }

    // Clear OTP after successful verification
    if (dbAdmin) await dbAdmin.collection(COLLECTIONS.OTPS).doc(phoneNumber).delete();
    console.log(`[Auth] OTP verified successfully for ${phoneNumber}`);

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

// Mount the router
app.use("/api", router);
// Also mount at root for Netlify function compatibility if needed
app.use("/.netlify/functions/api", router);

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

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== "production" || process.env.RUN_SERVER === "true") {
  startServer();
}
