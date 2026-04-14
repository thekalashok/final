import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
}

async function checkBucket() {
  const bucket = admin.storage().bucket();
  console.log("Checking bucket:", bucket.name);
  try {
    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log("Bucket exists and is accessible. Files found:", files.length);
  } catch (e: any) {
    console.error("Bucket check failed:", e.message);
  }
}

checkBucket();
