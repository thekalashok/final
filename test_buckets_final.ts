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
  const buckets = [
    "studio-8069889936-a886e.appspot.com",
    "studio-8069889936-a886e.firebasestorage.app",
    "studio-8069889936-a886e"
  ];

  for (const bucketName of buckets) {
    console.log("Testing upload to:", bucketName);
    try {
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file("test_connection.txt");
      await file.save("Hello World");
      console.log("SUCCESS! Upload worked for:", bucketName);
      return;
    } catch (e: any) {
      console.error(`Failed for ${bucketName}:`, e.message);
    }
  }
}

testUpload();
