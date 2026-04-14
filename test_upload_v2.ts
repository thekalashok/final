import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

async function testUpload() {
  const bucketName = "studio-8069889936-a886e.appspot.com";
  console.log("Testing upload to:", bucketName);
  try {
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file("test.txt");
    await file.save("Hello World");
    console.log("Upload successful!");
  } catch (e: any) {
    console.error("Upload failed:", e.message);
  }
}

testUpload();
